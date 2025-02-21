const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' }); // Return JSON
    }
    
    const token = authHeader.split(' ')[1];
    
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
          if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.status(403).json({ message: 'Forbidden' }); // Return JSON
          }
          req.user = {
            id: decoded.UserInfo.id,
            username: decoded.UserInfo.username,
            roles: decoded.UserInfo.roles || []
          };
          next();
        }
      );
};

module.exports = verifyJWT;