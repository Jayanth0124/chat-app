import jwt from 'jsonwebtoken';

const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15d'
  });

  // Not strictly necessary since we'll likely use Bearer tokens for API, 
  // but good for an extra layer if we use cookies.
  res.cookie('jwt', token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in MS
    httpOnly: true, // prevents XSS attacks
    sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax', // cross-site cookie transfer for cross-domain deployment
    secure: process.env.NODE_ENV !== 'development'
  });

  return token;
};

export default generateToken;
