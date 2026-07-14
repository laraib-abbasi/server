const router = require('express').Router();
const { Book, validateBook } = require('../models/book');
const { User } = require('../models/user');
const { auth, admin } = require('../middleware/auth');
const mongoose = require('mongoose');

// GET all books
router.get('/', async (req, res) => {
  try {
    // 1. Get the owner ID from query params (if provided)
    const { owner } = req.query;

    // 2. Build the base query with sorting and population
    let query = Book.find({})
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });

    // 3. If owner filter exists, modify the query
    if (owner) {
      query.find({ owner }); // Add owner filter
    }

    // 4. Execute the query
    const books = await query.exec();

    res.status(200).send(books);
  } catch (error) {
    console.error('Fetch books error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});


// POST new book
router.post('/', auth, async (req, res) => {
  try {
    // Combine form data with owner from authenticated user
    const bookData = {
      ...req.body,
      owner: req.user._id // Automatically set owner to current user
    };

    const { error } = validateBook(bookData);
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.details.map(d => ({
          field: d.path[0],
          message: d.message.replace(/"/g, '')
        }))
      });
    }

    // Create new book with all fields
    const book = new Book({
      title: bookData.title,
      authors: bookData.authors,
      isbn: bookData.isbn,
      publicationDate: bookData.publicationDate,
      publisher: bookData.publisher,
      genre: bookData.genre,
      language: bookData.language,
      description: bookData.description,
      pageCount: bookData.pageCount,
      edition: bookData.edition,
      format: bookData.format,
      condition: bookData.condition,
      price: bookData.price,
      keywords: bookData.keywords,
      owner: bookData.owner,
      coverImage: bookData.coverImage,
      status: 'available'
    });

    await book.save();
    
    // Return populated book data
    const populatedBook = await Book.findById(book._id)
      .populate('owner', 'username email');
      
    res.status(201).send(populatedBook);

  } catch (error) {
    console.error('Add book error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).send({ 
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// PUT update book
router.put('/:id', auth,  async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid book ID' });
    }

    const { error } = validateBook(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.details.map(d => ({
          field: d.path[0],
          message: d.message.replace(/"/g, '')
        }))
      });
    }

    const book = await Book.findByIdAndUpdate(
      id,
      { $set: req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('owner', 'username email');

    if (!book) {
      return res.status(404).send({ message: 'Book not found' });
    }

    res.status(200).send(book);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// DELETE book
router.delete('/:id', auth,  async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid book ID' });
    }

    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return res.status(404).send({ message: 'Book not found' });
    }

    res.status(200).send({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// GET book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid book ID' });
    }

    const book = await Book.findById(id).populate('owner', 'username email');
    if (!book) {
      return res.status(404).send({ message: 'Book not found' });
    }

    res.status(200).send(book);
  } catch (error) {
    console.error('Fetch book by ID error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// Add a new route specifically for status updates
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid book ID' });
    }

    if (!['available', 'pending-exchange', 'in-exchange', 'unavailable'].includes(status)) {
      return res.status(400).send({ message: 'Invalid status value' });
    }

    const book = await Book.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('owner', 'username email');

    if (!book) {
      return res.status(404).send({ message: 'Book not found' });
    }

    res.status(200).send(book);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// Get books available for exchange (not owned by current user)
router.get('/available', auth, async (req, res) => {
  try {
    const books = await Book.find({ 
      owner: { $ne: req.user.id },
      status: 'available'
    })
      .populate('owner', 'username')
      .select('title authors coverImage owner status');
      
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching available books', error: err.message });
  }
});

module.exports = router;


