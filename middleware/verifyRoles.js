const verifyRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.roles) { // Changed from req.roles to req.user.roles
      return res.status(401).json({ message: 'Unauthorized' }); // Return JSON
    }

    const hasPermission = req.user.roles.some(role => 
      allowedRoles.includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden' }); // Return JSON
    }

    next();
  };
};

module.exports = verifyRoles;