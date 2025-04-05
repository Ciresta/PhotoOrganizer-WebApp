require('dotenv').config(); 

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const oauthController = require('./controllers/oauthController');
const uploadController = require('./controllers/photosController');
const refreshTokenMiddleware = require('./middlewares/refreshTokenMiddleware');
const connectToDatabase = require('./config/db'); 
const { swaggerUi, swaggerSpec } = require('./swagger'); 

const app = express();
const port = process.env.PORT || 5000;
//cors
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500', // Add any other domains here
  'https://photoorganizer.netlify.app',
  'https://www.gmu.ac.in/',
  // 'http://127.0.0.1:5501',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      // Allow this origin
      callback(null, true);
    } else {
      // Block the request
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Allow credentials (cookies, authentication headers, etc.)
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' }); 


const oauth2Client = oauthController.oauth2Client;

app.get('/auth/google', oauthController.getAuthUrl);
app.get('/auth/google/callback', oauthController.handleAuthCallback);

app.post('/add', upload.array('photos', 10), refreshTokenMiddleware, (req, res) => {
  uploadController.uploadPhotos(req, res, oauth2Client); 
});

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


app.post('/slideshows', refreshTokenMiddleware, (req, res) => {
  uploadController.createSlideshow(req, res, oauthController.oauth2Client);
});

app.get('/displayslideshows', refreshTokenMiddleware, (req, res) => {
  uploadController.displayAllSlideshows(req, res, oauthController.oauth2Client);
});

app.delete('/slideshows/:id', refreshTokenMiddleware, (req, res) => {
  uploadController.deleteSlideshow(req, res, oauthController.oauth2Client);
});

app.get('/gallery', refreshTokenMiddleware, (req, res) => {
  uploadController.getAllGalleryImages(req, res, oauthController.oauth2Client);
});

app.post('/addgallery', refreshTokenMiddleware, (req, res) => {
  uploadController.addGalleryImage(req, res, oauthController.oauth2Client);
});

app.get('/getslideshow/:slideshowId', (req, res) => {
  uploadController.displaySlideshowById(req, res);
});

app.post('/deletegallery', refreshTokenMiddleware, (req, res) => {
  uploadController.deleteGalleryImage(req, res, oauthController.oauth2Client);
});

app.get('/getgallery/:email',uploadController.getImagesByEmail);

// app.get('/photos/:photoId',refreshTokenMiddleware, (req, res) => {
//   uploadController.getPhotoDetails(req, res, oauth2Client);
// });

// okok

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
