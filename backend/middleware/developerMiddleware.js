const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized, no token provided' });
  }

  try {
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    req.user = {
      id: payload.sub, // Google's unique user ID
      email: payload.email,
      isDeveloper: payload.isDeveloper || false, // Add this field based on your app's user database logic
    };

    // Check if the user is a developer
    if (!req.user.isDeveloper) {
      return res.status(403).json({ message: 'Access denied. Developer access only.' });
    }

    next();
  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.status(401).json({ message: 'Invalid or expired Google token.' });
  }
};

module.exports = protect;