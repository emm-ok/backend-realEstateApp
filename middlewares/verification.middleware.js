export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Email not verified",
    });
  }

  next();
};
