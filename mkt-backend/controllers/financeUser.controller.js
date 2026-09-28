import FinanceUser from "../models/financeUser.model.js";
import validator from "validator";

/**
 * CREATE FINANCE USER
 */
export const createFinanceUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and Email are required",
      });
    }

    // Email Validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check Existing User
    const existingUser = await FinanceUser.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Create User
    const user = await FinanceUser.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Finance user created successfully",
      data: user,
    });
  } catch (error) {
    console.error("Create Finance User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * GET FINANCE USERS
 * Search + Pagination
 */
export const getFinanceUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    // Search Filter
    const searchFilter = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const users = await FinanceUser.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await FinanceUser.countDocuments(searchFilter);

    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      data: users,
    });
  } catch (error) {
    console.error("Get Finance Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * UPDATE FINANCE USER
 */
export const updateFinanceUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and Email are required",
      });
    }

    // Validate Email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check Duplicate Email
    const existingUser = await FinanceUser.findOne({
      email: email.toLowerCase(),
      _id: { $ne: id },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already used by another user",
      });
    }

    // Update User
    const updatedUser = await FinanceUser.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Finance user not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Finance user updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update Finance User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * DELETE FINANCE USER
 */
export const deleteFinanceUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await FinanceUser.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Finance user not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Finance user deleted successfully",
    });
  } catch (error) {
    console.error("Delete Finance User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};