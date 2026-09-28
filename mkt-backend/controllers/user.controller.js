import User from "../models/users.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const getSuperAdminEmail = () =>
  (process.env.SUPER_ADMIN_EMAIL || "superadmin@ascendion.com").trim().toLowerCase();

export const createUser = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    const allowedRoles = ["tmg", "finance", "user", "market_leader"];
    if (req.authUser.role === "super_admin") allowedRoles.push("admin");
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: "You cannot create this role" });
    }

    email = email.trim().toLowerCase();
    if (email === getSuperAdminEmail()) {
      return res.status(400).json({ message: "This email is reserved for the Super Admin" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hash_password = await bcrypt.hash(password, 8);
    await User.create({ name, email, password: hash_password, role });

    res.status(201).json({
      success: true,
      data: [],
      message: "User created successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    let { role } = req.body;
    const callerRole = req.authUser.role;
    let filter;

    if (callerRole === "super_admin") {
      if (role === "super_admin") {
        return res.status(403).json({ message: "Only one Super Admin account is supported" });
      }
      filter = !role || role === "all"
        ? { role: { $ne: "super_admin" }, email: { $ne: getSuperAdminEmail() } }
        : { role, email: { $ne: getSuperAdminEmail() } };
    } else if (callerRole === "admin") {
      if (role === "admin" || role === "super_admin") {
        return res.status(403).json({ message: "Admin accounts are managed by the Super Admin" });
      }
      filter = !role || role === "all"
        ? { role: { $nin: ["admin", "super_admin"] }, email: { $ne: getSuperAdminEmail() } }
        : { role, email: { $ne: getSuperAdminEmail() } };
    } else if (callerRole === "user" && role === "market_leader") {
      filter = { role: "market_leader" };
    } else {
      return res.status(403).json({ message: "You cannot view user accounts" });
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Used by the Super Admin / Access page. Editing a row and typing a new
// value into the Password field resets that user's password — leave it
// blank to keep the existing password unchanged.
export const updateUser = async (req, res) => {
  try {
    const { id, name, email, password, role } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User id is required" });
    }

    const target = await User.findById(id).select("email role").lean();
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target.role === "super_admin" || target.email === getSuperAdminEmail()) {
      return res.status(403).json({ message: "The Super Admin account cannot be edited here" });
    }
    if (email && email.trim().toLowerCase() === getSuperAdminEmail()) {
      return res.status(400).json({ message: "This email is reserved for the Super Admin" });
    }
    if (req.authUser.role === "admin" && (target.role === "admin" || role === "admin" || role === "super_admin")) {
      return res.status(403).json({ message: "Only the Super Admin can manage admin accounts" });
    }
    if (role === "super_admin") {
      return res.status(403).json({ message: "A second Super Admin cannot be created" });
    }
    const allowedRoles = ["tmg", "finance", "user", "market_leader"];
    if (req.authUser.role === "super_admin") allowedRoles.push("admin");
    if (role && !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "You cannot assign this role" });
    }

    let oPayload = {};
    if (name) oPayload["name"] = name;
    if (email) oPayload["email"] = email.trim().toLowerCase();
    if (role) oPayload["role"] = role;
    if (password) {
      const hash_password = await bcrypt.hash(password, 8);
      oPayload["password"] = hash_password;
    }

    const updated = await User.findByIdAndUpdate(id, oPayload, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      data: updated,
      message: "User updated successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.body;

    const target = await User.findById(id).select("email role").lean();
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target.role === "super_admin" || target.email === getSuperAdminEmail()) {
      return res.status(403).json({ message: "The Super Admin account cannot be deleted" });
    }
    if (req.authUser.role === "admin" && target.role === "admin") {
      return res.status(403).json({ message: "Only the Super Admin can manage admin accounts" });
    }

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Normalize the same way the schema does, so a stray space/case
    // typed in the login form can never cause a false "not found".
    email = email.trim().toLowerCase();

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "superadmin@ascendion.com")
      .trim()
      .toLowerCase();
    if (email === superAdminEmail) {
      const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
      if (!superAdminPassword) {
        return res.status(503).json({ message: "Super Admin login is not configured" });
      }
      if (password !== superAdminPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = jwt.sign(
        { id: "superadmin", role: "super_admin" },
        process.env.JWT_SECRET,
        { expiresIn: "365d" },
      );
      return res.status(200).json({
        data: {
          _id: "superadmin",
          name: "Super Admin",
          email: superAdminEmail,
          role: "super_admin",
          token,
        },
        message: "Login Successfully",
      });
    }

    const existingEmail = await User.findOne({ email })
      .select("+password")
      .lean();

    if (!existingEmail) {
      return res.status(404).json({ message: "User not found" });
    }
    if (existingEmail.role === "super_admin") {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    let isValidPassword = await bcrypt.compare(
      password,
      existingEmail.password,
    );

    if (isValidPassword) {
      const token = await jwt.sign(
        { id: existingEmail._id, role: existingEmail.role },
        process.env.JWT_SECRET,
        {
          expiresIn: "365d",
        },
      );

      const { password: storedPassword, ...safeUser } = existingEmail;
      let response = { ...safeUser, token };
      return res
        .status(200)
        .json({ data: response, message: "Login Successfully" });
    } else {
      return res.status(404).json({ message: "Invalid Password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
