const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  googlePhotoId: { type: String, required: true, unique: true },
  size: { type: Number, required: true, default: 0 },
  type: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  customTags: { type: [String], default: [] },
  description: { type: String, default: 'Uploaded via PhotoTaggerApp' },
  status: { type: String, enum: ['Uploaded', 'Failed'], default: 'Uploaded' },
  ownerEmail: { type: String, required: true }, 
});

const Photo = mongoose.model('Photo', photoSchema);
module.exports = Photo;
