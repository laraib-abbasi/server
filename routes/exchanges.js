const express = require('express');
const router = express.Router();
const Exchange = require('../models/exchange');
const { Book, validateBook } = require('../models/book');
const { auth, admin } = require('../middleware/auth');

// Create a new exchange request
router.post('/', auth, async (req, res) => {
  try {
    console.log('Incoming request body:', req.body); // Add this line
    const { requestedBookId, offeredBookId, message="" } = req.body;
    const requester = req.user._id;

    if (!requestedBookId || !offeredBookId) {
      return res.status(400).json({ message: 'Missing book IDs' });
    }

    // Validate books exist and get their owners
    const [requestedBook, offeredBook] = await Promise.all([
      Book.findById(requestedBookId),
      Book.findById(offeredBookId)
    ]);

    // Add this debug logging right after the Promise.all:
console.log('Searching for books:', {
  requestedBookId, 
  offeredBookId,
  foundRequested: !!requestedBook,
  foundOffered: !!offeredBook
});

    if (!requestedBook || !offeredBook) {
      return res.status(404).json({ 
        message: 'One or both books not found',
        details: {
          requestedBookExists: !!requestedBook,
          offeredBookExists: !!offeredBook
        }
      });
    }

    // Check if requester owns the offered book
    if (offeredBook.owner.toString() !== requester.toString()) {
      return res.status(403).json({ message: 'You can only offer books you own' });
    }

    // Check if books are available for exchange
    if (requestedBook.status !== 'available' || offeredBook.status !== 'available') {
      return res.status(400).json({ message: 'One or both books are not available for exchange' });
    }

    // Create the exchange
    const exchange = new Exchange({
      requester,
      recipient: requestedBook.owner,
      requestedBook: requestedBookId,
      offeredBook: offeredBookId,
      message,
      status: 'pending-exchange'
    });

    await exchange.save();

    // Update book statuses
    await Book.updateMany(
      { _id: { $in: [requestedBookId, offeredBookId] } },
      { $set: { status: 'pending-exchange' } }
    );

    res.status(201).json(exchange);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all exchanges (admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const exchanges = await Exchange.find(filter)
      .populate('requester', 'username email')
      .populate('recipient', 'username email')
      .populate('requestedBook', 'title authors')
      .populate('offeredBook', 'title authors')
      .sort({ createdAt: -1 });

    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get exchanges for current user

router.get('/my-exchanges', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const exchanges = await Exchange.find({
      $or: [{ requester: userId }, { recipient: userId }]
    })
      .populate('requester', 'username email')
      .populate('recipient', 'username email')
      .populate('requestedBook', 'title authors coverImage')
      .populate('offeredBook', 'title authors coverImage')
      .sort({ createdAt: -1 });

    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update exchange status
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const exchange = await Exchange.findById(id)
      .populate('requestedBook')
      .populate('offeredBook');

    if (!exchange) {
      return res.status(404).json({ message: 'Exchange not found' });
    }

    // Check if user is involved in this exchange
    if (exchange.requester.toString() !== userId.toString() && 
        exchange.recipient.toString() !== userId.toString() &&
        !req.user.admin) {
      return res.status(403).json({ message: 'Not authorized to update this exchange' });
    }

   // In your exchange routes, update validTransitions:
const validTransitions = {
  'pending-exchange': ['accepted', 'rejected','cancelled'], // Changed from 'pending'
  'accepted': ['completed', 'cancelled'],
  'rejected': [],
  'completed': [],
  'cancelled': []
};

    if (!validTransitions[exchange.status].includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    // Update exchange status
    exchange.status = status;
    await exchange.save();

    // Update book statuses based on exchange status
    let bookUpdates = {};
    if (status === 'accepted') {
      bookUpdates = { status: 'in-exchange' };
    } else if (status === 'completed') {
      // Transfer ownership
      await Book.findByIdAndUpdate(exchange.requestedBook._id, { owner: exchange.requester });
      await Book.findByIdAndUpdate(exchange.offeredBook._id, { owner: exchange.recipient });
      bookUpdates = { status: 'unavailable' };
    } else if (status === 'rejected' || status === 'cancelled') {
      bookUpdates = { status: 'available' };
    }

    if (Object.keys(bookUpdates).length > 0) {
      await Book.updateMany(
        { _id: { $in: [exchange.requestedBook._id, exchange.offeredBook._id] } },
        { $set: bookUpdates }
      );
    }

    res.json(exchange);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin can manually create an exchange
router.post('/admin/create', auth, admin, async (req, res) => {
  try {
    const { requesterId, recipientId, requestedBookId, offeredBookId } = req.body;

    // Validate books and users
    const [requester, recipient, requestedBook, offeredBook] = await Promise.all([
      User.findById(requesterId),
      User.findById(recipientId),
      Book.findById(requestedBookId),
      Book.findById(offeredBookId)
    ]);

    if (!requester || !recipient || !requestedBook || !offeredBook) {
      return res.status(404).json({ message: 'One or more entities not found' });
    }

    // Check book ownership
    if (requestedBook.owner.toString() !== recipientId.toString()) {
      return res.status(400).json({ message: 'Requested book must belong to recipient' });
    }

    if (offeredBook.owner.toString() !== requesterId.toString()) {
      return res.status(400).json({ message: 'Offered book must belong to requester' });
    }

    // Create and complete the exchange immediately
    const exchange = new Exchange({
      requester: requesterId,
      recipient: recipientId,
      requestedBook: requestedBookId,
      offeredBook: offeredBookId,
      status: 'completed'
    });

    await exchange.save();

    // Transfer ownership
    await Book.findByIdAndUpdate(requestedBookId, { 
      owner: requesterId,
      status: 'available'
    });
    await Book.findByIdAndUpdate(offeredBookId, { 
      owner: recipientId,
      status: 'available'
    });

    res.status(201).json(exchange);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;