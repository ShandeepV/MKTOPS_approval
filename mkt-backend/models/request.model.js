import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, sparse: true },
    dedup_key: { type: String, unique: true, sparse: true, select: false },
    emp_id: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    current_client: {
      type: String,
      required: true,
      trim: true,
    },

    current_project: {
      type: String,
      required: true,
      trim: true,
    },

    proposed_client: {
      type: String,
      required: true,
      trim: true,
    },

    proposed_project: {
      type: String,
      required: true,
      trim: true,
    },

    project_type: {
      type: String,
      required: true,
      trim: true,
    },
    resource_type: {
      type: String,
      required: true,
      trim: true,
    },

    start_date: {
      type: Date,
      required: true,
    },

    end_date: {
      type: Date,
      required: true,
    },

    // Immutable snapshot of what the requestor originally submitted —
    // never overwritten by an approver's "Duration Change".
    applied_start_date: {
      type: Date,
    },
    applied_end_date: {
      type: Date,
    },

    // Set only if RMG used "Duration Change" on their approval.
    rmg_revised_start_date: {
      type: Date,
    },
    rmg_revised_end_date: {
      type: Date,
    },

    // Set only if Finance used "Duration Change" on their approval.
    finance_revised_start_date: {
      type: Date,
    },
    finance_revised_end_date: {
      type: Date,
    },

    no_of_days: {
      type: Number,
    },

    remarks: {
      type: String,
      default: "",
    },

    // Email of the logged-in user who submitted the request. Used to
    // reply-to / identify the sender on the RMG & Finance notification
    // emails.
    requestor_email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    sender_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    receiver_emails: {
      type: String,
      required: false,
      trim: true,
    },

    // On-Shore / Off-Shore — mandatory, chosen first on the form.
    resource_location: {
      type: String,
      enum: ["On-Shore", "Off-Shore"],
      required: true,
    },

    rmg_status: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    rmg_reason: {
      type: String,
      default: "",
    },
    rmg_action_at: { type: Date },
    finance_action_at: { type: Date },

    // Read-only compatibility for documents created before RMG naming.
    tmg_status: { type: Number, enum: [0, 1, 2] },
    tmg_reason: { type: String, default: "" },
    tmg_revised_start_date: { type: Date },
    tmg_revised_end_date: { type: Date },

    finance_status: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    finance_reason: {
      type: String,
      default: "",
    },
    attachment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model("Request", requestSchema);