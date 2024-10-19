const { google } = require('googleapis');

// OAuth2 setup
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
    res.redirect(`http://localhost:3000?token=${tokens.access_token}`);
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).send('Authentication error');
  }
};

// Export the oauth2Client for use in other files
exports.oauth2Client = oauth2Client;
