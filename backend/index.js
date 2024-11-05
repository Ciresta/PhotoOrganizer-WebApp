const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const oauthController = require('./controllers/oauthController');
const uploadController = require('./controllers/uploadController');
const refreshTokenMiddleware = require('./middlewares/refreshTokenMiddleware');
const connectToDatabase = require('./config/db'); // Use the Mongoose-based connection

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000', // Replace with your React app's URL
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' }); // Directory for uploaded files

// OAuth2 client imported from oauthController
const oauth2Client = oauthController.oauth2Client;

// Auth routes
app.get('/auth/google', oauthController.getAuthUrl);
app.get('/auth/google/callback', oauthController.handleAuthCallback);

// Photo upload route - handle multiple file uploads
app.post('/add', upload.array('photos', 10), refreshTokenMiddleware, (req, res) => {
  uploadController.uploadPhotos(req, res, oauth2Client); // Adjusted to handle multiple photos
});

// Route to get all photos from Google Photos
app.get('/photos', refreshTokenMiddleware, (req, res) => {
  uploadController.getGooglePhotos(req, res, oauth2Client);
});

app.get('/user/profile', refreshTokenMiddleware, (req, res) => {
  uploadController.getUserProfile(req, res, oauth2Client);
});

app.post('/searchPhotos', refreshTokenMiddleware, (req, res) => {
  uploadController.searchPhotos(req, res, oauth2Client);
});

app.get('/photos/:photoId',refreshTokenMiddleware, (req, res) => {
  uploadController.getPhotoDetailsWithTags(req, res, oauth2Client);
});

app.post('/:filename/tags', refreshTokenMiddleware, (req, res) => {
  uploadController.addTag(req, res, oauth2Client);
});

app.post('/addtags', refreshTokenMiddleware, (req, res) => {
  uploadController.addCustomTags(req, res, oauthController.oauth2Client);
});

app.delete('/deletetags', refreshTokenMiddleware, (req, res) => {
  uploadController.deleteCustomTags(req, res, oauthController.oauth2Client);
});


// app.get('/photos/:photoId',refreshTokenMiddleware, (req, res) => {
//   uploadController.getPhotoDetails(req, res, oauth2Client);
// });

// app.get('/photoByFilename',refreshTokenMiddleware, (req, res) => {
//   uploadController.getPhotoByFileName(req, res, oauth2Client);
// });

// Route to search photos using Google Vision API
// app.post('/searchPhotos', refreshTokenMiddleware, uploadController.searchPhotos);

// Connect to the database and then start the server
connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
