const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  '646967527297-tvdm72odo8bgbumqqje509e5vqaj99u3.apps.googleusercontent.com',
  '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',
  'http://localhost:5000/auth/google/callback' 
);

const scopes = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
];

module.exports = { oauth2Client, scopes };
