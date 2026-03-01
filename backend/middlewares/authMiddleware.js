const User = require("../model/userSchema");
const { getFirebaseAuth } = require("../config/firebaseAdmin");

class AuthMiddleware {
  /**
   * Verify Firebase ID token sent as: Authorization: Bearer <token>
   */
  static async requireAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization || "";
      const isBearerToken = authHeader.startsWith("Bearer ");
      const idToken = isBearerToken ? authHeader.slice(7).trim() : "";

      if (!idToken) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Missing Bearer token.",
        });
      }

      const firebaseAuth = getFirebaseAuth();
      const decodedToken = await firebaseAuth.verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;

      let user = await User.findOne({ firebaseUid });

      // Auto-provision first-time Firebase users as students.
      if (!user) {
        user = await User.create({
          firebaseUid,
          email: decodedToken.email,
          fullName: decodedToken.name || decodedToken.email || "Student User",
          role: "student",
          profilePhoto: decodedToken.picture ? { url: decodedToken.picture } : undefined,
          lastLoginAt: new Date(),
        });
      }

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized user.",
        });
      }

      user.lastLoginAt = new Date();
      await user.save();

      req.user = user;
      req.firebaseToken = decodedToken;
      return next();
    } catch (error) {
      if (error?.code?.startsWith?.("auth/")) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired Firebase token.",
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Authentication failed.",
        error: error.message,
      });
    }
  }

  static requireRoles(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. You do not have permission for this action.",
        });
      }

      return next();
    };
  }
}

module.exports = AuthMiddleware;
