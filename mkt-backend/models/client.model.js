import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalized_name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.model("Client", clientSchema);