import jwt from "jsonwebtoken";
import User from "../models/users.model.js";

export const authenticateToken = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id === "superadmin" && decoded.role === "super_admin") {
      req.authUser = {
        _id: "superadmin",
        name: "Super Admin",
        email: process.env.SUPER_ADMIN_EMAIL || "superadmin@ascendion.com",
        role: "super_admin",
      };
      return next();
    }

    const user = await User.findById(decoded.id)
      .select("_id name email role")
      .lean();
    if (!user || user.role === "super_admin") {
      return res.status(401).json({ message: "Invalid session" });
    }

    req.authUser = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.authUser?.role)) {
    return res.status(403).json({ message: "You are not allowed to perform this action" });
  }
  return next();
};