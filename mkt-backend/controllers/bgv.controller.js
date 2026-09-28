import BGV from "../models/bgv.model.js";
import User from "../models/users.model.js";
import Sequence from "../models/sequence.model.js";
import { getBGVMailTemplate, sendMail } from "../config/mail.js";

export const createBGV = async (req, res) => {
  try {
    const data = req.body;
    const sequence = await Sequence.findByIdAndUpdate(
      "bgv-B",
      { $inc: { value: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const payload = {
      uid: `B-${String(sequence.value).padStart(3, "0")}`,
      assigned_to: data.assigned_to,
      gcid: data.gcid,
      name: data.name,
      client: data.client,
      project_name: data.project_name,
      employee_type: data.employee_type,
      bgv_initiated_date: data.bgv_initiated_date,
      bgv_completed_date: data.bgv_completed_date || undefined,
      billable_start_date: data.billable_start_date || undefined,
      pending_compliance: data.pending_compliance || data.pending_appliance || "",
      email: data.email || "",
      justification: data.justification || "",
      requestor_email: (req.authUser.email || data.requestor_email || "").trim().toLowerCase(),
    };

    const result = await BGV.create(payload);
    let emailSent = false;

    try {
      const marketLeader = await User.findOne({
        role: "market_leader",
        name: payload.assigned_to,
      }).select("email").lean();
      if (marketLeader?.email) {
        const baseUrl = process.env.BASE_URL || "https://mktops-approval.netlify.app";
        const mailResult = await sendMail({
          to: marketLeader.email,
          cc: payload.requestor_email ? [payload.requestor_email] : [],
          fromEmail: payload.requestor_email || undefined,
          replyTo: payload.requestor_email || undefined,
          subject: `BGV Approval Needed - ${payload.uid}`,
          html: getBGVMailTemplate({
            requestorName: req.authUser.name,
            requestorEmail: payload.requestor_email,
            uid: payload.uid,
            gcid: payload.gcid,
            name: payload.name,
            client: payload.client,
            projectName: payload.project_name,
            link: `${baseUrl}/my-bgv`,
          }),
        });
        if (!mailResult.success) {
          console.error("Failed to notify assigned Market Leader:", mailResult.error);
        } else {
          emailSent = true;
        }
      } else {
        console.warn(`No Market Leader email found for ${payload.assigned_to}`);
      }
    } catch (mailError) {
      console.error("Failed to notify assigned Market Leader:", mailError);
    }

    res.status(201).json({
      success: true,
      data: result,
      emailSent,
      message: "BGV request created successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBGVs = async (req, res) => {
  try {
    const bgvs = (await BGV.find().sort({ createdAt: -1 }).lean()).map((bgv) => {
      const pendingCompliance = bgv.pending_compliance || bgv.pending_appliance || "";
      const displayCompliance = pendingCompliance.trim().toLowerCase() === "no"
        ? ""
        : pendingCompliance;
      return {
        ...bgv,
        pending_compliance: displayCompliance,
        pending_appliance: displayCompliance,
      };
    });

    res.json({
      success: true,
      data: bgvs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBGV = async (req, res) => {
  try {
    let { id, status, reason } = req.body;
    if (![1, 2].includes(status)) {
      return res.status(400).json({ message: "Invalid BGV approval action" });
    }
    if (status === 2 && !reason?.trim()) {
      return res.status(400).json({ message: "A denial reason is required" });
    }

    const payload = {
      ml_status: status,
      ml_reason: reason || "",
      ml_action_at: new Date(),
    };

    const filter = req.authUser.role === "market_leader"
      ? { _id: id, assigned_to: req.authUser.name }
      : { _id: id };
    const updated = await BGV.findOneAndUpdate(filter, payload, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Assigned BGV request not found" });
    }

    res.status(200).json({
      success: true,
      data: [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBGV = async (req, res) => {
  try {
    const { id } = req.body;
    const deleted = await BGV.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "BGV request not found" });
    }

    res.json({
      success: true,
      message: "BGV request deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};