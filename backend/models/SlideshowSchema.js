const mongoose = require('mongoose');

const SlideshowSchema = new mongoose.Schema({
  slideshowId: { type: String, required: true },
  name: { type: String, required: true },
  photoIds: { type: [String], required: true }, // List of photo IDs
  photoUrls: { type: [String], required: true }, // List of photo URLs
  ownerEmail: { type: String, required: true }, // Email of the owner
  createdAt: { type: Date, default: Date.now },
});

const Slideshow = mongoose.model('Slideshow', SlideshowSchema);

module.exports = Slideshow;
