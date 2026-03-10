const User = require("../model/userSchema");
const { getFirebaseAuth } = require("../config/firebaseAdmin");

class AuthMiddleware {
  static extractBearerToken(req) {
    const authHeader = req.headers.authorization || "";
    return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  }

  static async resolveUserFromToken(idToken, options = {}) {
    const { allowProvision = false, touchLastLogin = false } = options;
    const firebaseAuth = getFirebaseAuth();
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    let user = await User.findOne({ firebaseUid });

    if (!user && allowProvision) {
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
      return { user: null, decodedToken };
    }

    if (touchLastLogin) {
      user.lastLoginAt = new Date();
      await user.save();
    }

    return { user, decodedToken };
  }

  /**
   * Verify Firebase ID token sent as: Authorization: Bearer <token>
   */
  static async requireAuth(req, res, next) {
    try {
      const idToken = AuthMiddleware.extractBearerToken(req);

      if (!idToken) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Missing Bearer token.",
        });
      }

      const { user, decodedToken } = await AuthMiddleware.resolveUserFromToken(idToken, {
        allowProvision: true,
        touchLastLogin: true,
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized user.",
        });
      }

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

  static async optionalAuth(req, _res, next) {
    const idToken = AuthMiddleware.extractBearerToken(req);
    if (!idToken) {
      return next();
    }

    try {
      const { user, decodedToken } = await AuthMiddleware.resolveUserFromToken(idToken, {
        allowProvision: false,
        touchLastLogin: false,
      });

      if (user) {
        req.user = user;
        req.firebaseToken = decodedToken;
      }
    } catch (_error) {
      // Public routes must continue even if token verification fails.
    }

    return next();
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
