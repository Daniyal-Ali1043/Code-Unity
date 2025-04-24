const jwt = require('jsonwebtoken');
console.log('Zoom Client ID:', process.env.ZOOM_CLIENT_ID);
console.log('Zoom Client Secret:', process.env.ZOOM_CLIENT_SECRET);
const generateZoomToken = () => {
  const payload = {
    iss: process.env.ZOOM_CLIENT_ID,
    exp: new Date().getTime() + 5000,
  };
  return jwt.sign(payload, process.env.ZOOM_CLIENT_SECRET);
};

module.exports = { generateZoomToken };
