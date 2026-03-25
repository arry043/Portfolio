import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET || 'fallback_portfolio_jwt_secret', 
    { expiresIn: '1d' }
  );
};

export default generateToken;
