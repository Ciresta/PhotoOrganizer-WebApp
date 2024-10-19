const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const oauthController = require('./controllers/oauthController');
const uploadController = require('./controllers/uploadController');
const refreshTokenMiddleware = require('./middlewares/refreshTokenMiddleware');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' }); // Directory for uploaded files

// OAuth2 client imported from oauthController
const oauth2Client = oauthController.oauth2Client;

// Auth routes
app.get('/auth/google', oauthController.getAuthUrl);
app.get('/auth/google/callback', oauthController.handleAuthCallback);

// Photo upload route
app.post('/add', upload.single('photo'), refreshTokenMiddleware, (req, res) => {
  uploadController.uploadPhoto(req, res, oauth2Client);
});

// Route to get all photos from Google Photos
app.get('/photos', refreshTokenMiddleware, (req, res) => {
  uploadController.getGooglePhotos(req, res, oauth2Client);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
