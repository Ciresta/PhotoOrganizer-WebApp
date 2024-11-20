const mongoose = require('mongoose');

const SlideshowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photoIds: { type: [String], required: true }, // List of photo IDs
  photoUrls: { type: [String], required: true }, // List of photo URLs
  createdAt: { type: Date, default: Date.now },
});

const Slideshow = mongoose.model('Slideshow', SlideshowSchema);

module.exports = Slideshow;
