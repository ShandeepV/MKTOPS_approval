import TmgUser from "../models/tmgUser.model.js";

export const createTmgUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    const existing = await TmgUser.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await TmgUser.create({ name, email });

    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTmgUsers = async (req, res) => {
  try {
    const users = await TmgUser.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTmgUser = async (req, res) => {
  try {
    const { id, name, email } = req.body;

    const updated = await TmgUser.findByIdAndUpdate(
      id,
      { name, email },
      {
        new: true,
        runValidators: true,
      },
    );

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

export const deleteTmgUser = async (req, res) => {
  try {
    const { id } = req.body;

    const deleted = await TmgUser.findByIdAndDelete(id);

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
