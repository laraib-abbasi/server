const mongoose = require('mongoose');
const Joi = require('joi');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  authors: {
    type: String,
    required: [true, 'Author(s) is required'],
    trim: true,
    maxlength: [200, 'Author(s) cannot exceed 200 characters'],
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(?:\d{9}[\dXx]|\d{13})$/.test(v);
      },
      message: 'Please enter a valid 10 or 13-digit ISBN'
    }
  },
  publicationDate: {
    type: Date,
    required: [true, 'Publication date is required'],
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: [100, 'Publisher cannot exceed 100 characters'],
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true,
    maxlength: [50, 'Genre cannot exceed 50 characters'],
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    default: 'English',
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  pageCount: {
    type: Number,
    min: [1, 'Page count must be at least 1'],
  },
  edition: {
    type: String,
    trim: true,
    maxlength: [50, 'Edition cannot exceed 50 characters'],
  },
  format: {
    type: String,
    enum: ['Hardcover', 'Paperback', 'eBook'],
    default: 'Paperback',
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor','Used'],
    default: 'New',
  },
  keywords: {
    type: String,
    trim: true,
    maxlength: [200, 'Keywords cannot exceed 200 characters'],
  },
  coverImage: {
    type: String, // Will store the image URL
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
  },
  status: {
    type: String,
    enum: ['available', 'pending-exchange', 'in-exchange', 'unavailable'],
    default: 'available'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

const Book = mongoose.model("Book", bookSchema);

const validateBook = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(2).max(200).required().trim(),
    authors: Joi.string().min(2).max(200).required().trim(),
    isbn: Joi.string().pattern(/^(?:\d{9}[\dXx]|\d{13})$/).required(),
    publicationDate: Joi.date().required(),
    publisher: Joi.string().max(100).trim(),
    genre: Joi.string().min(2).max(50).required().trim(),
    language: Joi.string().default('English'),
    description: Joi.string().max(1000).allow('').trim(),
    pageCount: Joi.number().integer().min(1),
    edition: Joi.string().max(50).trim(),
    format: Joi.string().valid('Hardcover', 'Paperback', 'eBook').default('Paperback'),
    condition: Joi.string().valid('New', 'Like New', 'Good', 'Fair', 'Poor','Used').default('New'),
    keywords: Joi.string().max(200).trim(),
    coverImage: Joi.string().uri(),
    owner: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'ObjectId Validation').required(),
    status: Joi.string().valid('available', 'exchanged', 'pending').default('available')
  });

  return schema.validate(data, { 
    abortEarly: false, 
    allowUnknown: false,
    stripUnknown: true
  });
};

module.exports = { Book, validateBook };

