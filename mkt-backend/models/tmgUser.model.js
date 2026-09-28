import mongoose from "mongoose";

const tmgUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use valid email"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("TmgUser", tmgUserSchema);
