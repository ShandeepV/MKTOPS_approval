import Client from "../models/client.model.js";

export const getClients = async (_req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createClient = async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) {
    return res.status(400).json({ message: "Client name is required" });
  }

  try {
    const normalizedName = name.toLowerCase();
    const existing = await Client.findOne({ normalized_name: normalizedName }).lean();
    if (existing) {
      return res.status(409).json({ message: "This client already exists" });
    }
    const client = await Client.create({
      name,
      normalized_name: normalizedName,
    });
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This client already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const deleted = await Client.findByIdAndDelete(req.body.id);
    if (!deleted) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json({ success: true, message: "Client deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};