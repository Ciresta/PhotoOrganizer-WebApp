const oauthController = require('../controllers/oauthController');

// Middleware to refresh token if needed
const refreshTokenMiddleware = async (req, res, next) => {
  const oauth2Client = oauthController.oauth2Client;
  const tokenExpiryDate = oauth2Client.credentials.expiry_date;
  const currentDate = new Date().getTime();

  // Check if the token is about to expire (5 minutes before expiry)
  if (tokenExpiryDate - currentDate < 300000) {
    try {
      await oauth2Client.refreshAccessToken();
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return res.status(401).send('Unauthorized: Unable to refresh access token');
    }
  }
  next();
};

module.exports = refreshTokenMiddleware;
