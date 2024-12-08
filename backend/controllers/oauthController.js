const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 setup
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.OAUTH_API,       
  process.env.OAUTH_SECRET,    
  process.env.OAUTH_CALLBACK
);


const scopes = [
  'https://www.googleapis.com/auth/photoslibrary.readonly', // Existing scope for reading photos
  'https://www.googleapis.com/auth/photoslibrary.appendonly', // Existing scope for appending photos
  'https://www.googleapis.com/auth/userinfo.profile', // New scope for user profile information
  'https://www.googleapis.com/auth/userinfo.email', 
];

exports.getAuthUrl = (req, res) => {
  console.log("Received request for auth URL");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.json({ authUrl });
};

exports.handleAuthCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log('Tokens:', tokens);
    res.redirect(`http://localhost:3000?token=${tokens.access_token}`);
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).send('Authentication error');
  }
};

// Export the oauth2Client for use in other files
exports.oauth2Client = oauth2Client;
