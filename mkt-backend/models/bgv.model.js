import mongoose from "mongoose";

const bgvSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, sparse: true },
    
    assigned_to: {
      type: String,
      required: true,
      trim: true,
    },

    gcid: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    client: {
      type: String,
      required: true,
      trim: true,
    },
    project_name: {
      type: String,
      required: true,
      trim: true,
    },

    employee_type: {
      type: String,
      enum: ["New Employee", "Re-Deployed Employee"],
      required: true,
    },

    bgv_initiated_date: {
      type: Date,
      required: true,
    },
    bgv_completed_date: {
      type: Date,
    },
    billable_start_date: { type: Date },
    pending_compliance: { type: String, default: "" },
    pending_appliance: { type: String, default: "" },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    justification: {
      type: String,
      default: "",
    },

    // Email of the logged-in requestor who submitted this BGV request —
    // used to show each requestor only their own submissions on the
    // "BGV Approval" tab of the Requestor page.
    requestor_email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // 0 = Pending, 1 = Approved, 2 = Denied
    ml_status: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    ml_reason: {
      type: String,
      default: "",
    },
    ml_action_at: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("BGV", bgvSchema);