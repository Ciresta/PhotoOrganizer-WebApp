const mongoose = require('mongoose');


const GallerySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true }
});



const Gallery = mongoose.model('Gallery', GallerySchema);

module.exports = Gallery;