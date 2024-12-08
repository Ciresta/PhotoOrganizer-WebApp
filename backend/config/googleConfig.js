const { google } = require('googleapis');
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.OAUTH_API,       
  process.env.OAUTH_SECRET,    
  process.env.OAUTH_CALLBACK
);

const scopes = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
];

module.exports = { oauth2Client, scopes };
