const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ success: false, message: "Login karein pehle" });
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token invalid ya expire ho gaya" });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({
      success: false,
      message: `Yeh kaam sirf ${roles.join("/")} kar sakte hain`,
    });
  next();
};

module.exports = { protect, authorizeRoles };
