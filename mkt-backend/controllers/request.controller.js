import Request from "../models/request.model.js";
import User from "../models/users.model.js";
import Sequence from "../models/sequence.model.js";
import { createHash } from "node:crypto";
import dayjs from "dayjs";
import { getRequestMailTemplate, getOffshoreNotifyMailTemplate, sendMail } from "../config/mail.js";

export const createRequest = async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    const start = dayjs(data.start_date);
    const end = dayjs(data.end_date);
    const senderEmail = (req.authUser.email || data.sender_email || "").trim().toLowerCase();
    const receiverEmails = Array.isArray(data.receiver_emails)
      ? data.receiver_emails.join(";").trim()
      : String(data.receiver_emails || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = receiverEmails.split(/[;,]/).map((email) => email.trim()).filter(Boolean);

    if (!emailPattern.test(senderEmail)) {
      return res.status(400).json({ message: "A valid sender email is required" });
    }
    if (data.resource_location === "On-Shore" && recipients.length === 0) {
      return res.status(400).json({ message: "At least one notification email is required for On-Shore requests" });
    }
    if (recipients.some((email) => !emailPattern.test(email))) {
      return res.status(400).json({ message: "Enter valid notification email addresses" });
    }
    if (!String(data.remarks || "").trim()) {
      return res.status(400).json({ message: "Remarks are required" });
    }

    const duplicateFields = {
      name: String(data.name || "").trim(),
      current_client: String(data.current_client || "").trim(),
      current_project: String(data.current_project || "").trim(),
      proposed_client: String(data.proposed_client || "").trim(),
      proposed_project: String(data.proposed_project || "").trim(),
      project_type: String(data.project_type || "").trim(),
      resource_type: String(data.resource_type || "").trim(),
      resource_location: data.resource_location,
      applied_start_date: start.toDate(),
      applied_end_date: end.toDate(),
    };
    const dedupKey = createHash("sha256")
      .update(JSON.stringify({
        ...duplicateFields,
        name: duplicateFields.name.toLowerCase(),
        current_client: duplicateFields.current_client.toLowerCase(),
        current_project: duplicateFields.current_project.toLowerCase(),
        proposed_client: duplicateFields.proposed_client.toLowerCase(),
        proposed_project: duplicateFields.proposed_project.toLowerCase(),
        project_type: duplicateFields.project_type.toLowerCase(),
        resource_type: duplicateFields.resource_type.toLowerCase(),
        applied_start_date: start.toISOString(),
        applied_end_date: end.toISOString(),
      }))
      .digest("hex");
    const duplicate = await Request.exists({
      ...duplicateFields,
    });
    if (duplicate) {
      return res.status(409).json({
        message: "An identical request has already been submitted",
      });
    }

    const prefix = data.project_type?.trim().toUpperCase() === "PNBL" ? "P" : "C";
    const sequence = await Sequence.findByIdAndUpdate(
      `request-${prefix}`,
      { $inc: { value: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const payload = {
      uid: `${prefix}-${String(sequence.value).padStart(3, "0")}`,
      emp_id: data.emp_id,
      name: data.name,
      current_client: data.current_client,
      current_project: data.current_project,
      proposed_client: data.proposed_client,
      proposed_project: data.proposed_project,
      project_type: data.project_type,
      resource_type: data.resource_type,
      start_date: start.toDate(),
      end_date: end.toDate(),
      // Snapshot of the originally-applied dates — stays fixed even if an
      // approver later revises the schedule.
      applied_start_date: start.toDate(),
      applied_end_date: end.toDate(),
      no_of_days: data.no_of_days,
      remarks: data.remarks || "",
      attachment: req.file ? req.file.filename : "",
      // Email of the logged-in requestor (sent from the frontend from
      // localStorage user_info). Used below to notify RMG/Finance and to
      // let them reply straight back to the requestor.
      requestor_email: senderEmail,
      sender_email: senderEmail,
      receiver_emails: receiverEmails,
      // On-Shore / Off-Shore request location.
      resource_location: data.resource_location,
      dedup_key: dedupKey,
    };

    const result = await Request.create(payload);

    const requestorName = data.requestor_name || data.name;
    const requestorEmail = payload.requestor_email;

    let baseUrl = process.env.BASE_URL || "https://mktops-approval.netlify.app";

    // Notify the RMG team and the Finance/BGV team that a new request
    // needs their action. SMTP authentication still uses the configured
    // mailbox; the requested sender address is used in From and Reply-To.
    const emailDeliveryResults = [];
    try {
      const notifyUsers = await User.find({
        role: { $in: ["tmg", "finance"] },
      });

      const emailPromises = notifyUsers.map((user) =>
        sendMail({
          to: user.email,
          cc: [...new Set([...recipients, senderEmail])],
          fromEmail: senderEmail,
          replyTo: senderEmail || undefined,
          fromName: requestorName || "Request App",
          subject: `New Request ${result.uid} - ${user.role === "tmg" ? "RMG" : "Finance"} Approval Needed`,
          html: getRequestMailTemplate({
            requestorName,
            role: user.role === "tmg" ? "RMG" : "Finance",
            uid: result.uid,
            requestorEmail,
            gcid: payload.emp_id,
            employeeName: payload.name,
            currentClient: payload.current_client,
            currentProject: payload.current_project,
            proposedClient: payload.proposed_client,
            proposedProject: payload.proposed_project,
            projectType: payload.project_type,
            resourceType: payload.resource_type,
            resourceLocation: payload.resource_location,
            startDate: start.format("DD MMM YYYY"),
            endDate: end.format("DD MMM YYYY"),
            days: payload.no_of_days,
            link:
              user.role === "tmg"
                ? `${baseUrl}/my-request-rmg`
                : `${baseUrl}/my-request-finance`,
          }),
        }),
      );

      emailDeliveryResults.push(...await Promise.all(emailPromises));
    } catch (mailErr) {
      // Don't fail the request creation just because email delivery
      // failed — just log it.
      console.error("Failed to send request notification email:", mailErr);
      emailDeliveryResults.push({ success: false, error: mailErr.message });
    }

    // Off-Shore requests also send a direct notification to the entered recipients.
    // Multiple addresses are separated by ";" on the form, e.g.
    // "a@x.com;b@y.com". Each is trimmed and lightly validated before
    // sending; invalid entries are skipped rather than failing the whole
    // request.
    if (payload.resource_location === "Off-Shore" && payload.receiver_emails) {
      try {
        const notifyPromises = recipients.map((to) =>
          sendMail({
            to,
            cc: [senderEmail],
            fromEmail: senderEmail,
            replyTo: senderEmail || undefined,
            fromName: requestorName || "Request App",
            subject: `Off-Shore Request ${result.uid} - ${payload.name}`,
            html: getOffshoreNotifyMailTemplate({
              requestorName,
              requestorEmail,
              uid: result.uid,
              gcid: payload.emp_id,
              employeeName: payload.name,
              proposedClient: payload.proposed_client,
              proposedProject: payload.proposed_project,
              projectType: payload.project_type,
              resourceType: payload.resource_type,
              startDate: start.format("DD MMM YYYY"),
              endDate: end.format("DD MMM YYYY"),
              days: payload.no_of_days,
              link: `${baseUrl}/my-requests`,
            }),
          }),
        );

        emailDeliveryResults.push(...await Promise.all(notifyPromises));
      } catch (notifyErr) {
        console.error("Failed to send Off-Shore notify email:", notifyErr);
        emailDeliveryResults.push({ success: false, error: notifyErr.message });
      }
    }

    return res.status(201).json({
      success: true,
      data: result,
      emailSent:
        emailDeliveryResults.length > 0 &&
        emailDeliveryResults.every((mailResult) => mailResult.success),
      message: "Request created successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "An identical request has already been submitted",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const requests = (await Request.find().sort({ createdAt: -1 }).lean()).map((request) => {
      const normalized = {
        ...request,
        rmg_status: request.rmg_status ?? request.tmg_status ?? 0,
        rmg_reason: request.rmg_reason ?? request.tmg_reason ?? "",
        rmg_revised_start_date: request.rmg_revised_start_date ?? request.tmg_revised_start_date,
        rmg_revised_end_date: request.rmg_revised_end_date ?? request.tmg_revised_end_date,
      };
      delete normalized.tmg_status;
      delete normalized.tmg_reason;
      delete normalized.tmg_revised_start_date;
      delete normalized.tmg_revised_end_date;
      return normalized;
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.body;
    const deleted = await Request.findOneAndDelete({
      _id: id,
      rmg_status: { $ne: 1 },
      tmg_status: { $ne: 1 },
      finance_status: { $ne: 1 },
    });

    if (!deleted) {
      const existing = await Request.exists({ _id: id });
      if (!existing) {
        return res.status(404).json({ message: "Request not found" });
      }
      return res.status(409).json({
        message: "Approved requests cannot be deleted",
      });
    }

    res.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateRequests = async (req, res) => {
  try {
    // start_date / end_date are optional — only sent when the approver
    // used the "Duration Change" option instead of a plain Approve, so
    // the request's dates get revised as part of the approval.
    let { id, role: requestedRole, status, reason, start_date, end_date } = req.body;
    const role = req.authUser.role;
    if (!["tmg", "rmg", "finance"].includes(role) || ![1, 2].includes(status)) {
      return res.status(400).json({ message: "Invalid approval action" });
    }
    if (requestedRole && requestedRole !== role) {
      return res.status(403).json({ message: "You cannot approve as another role" });
    }
    if (status === 2 && !reason?.trim()) {
      return res.status(400).json({ message: "A denial reason is required" });
    }
    let payload = {};
    if (role === "tmg" || role === "rmg") {
      payload["rmg_status"] = status;
      payload["rmg_reason"] = reason || "";
      payload["rmg_action_at"] = new Date();
    } else if (role === "finance") {
      payload["finance_status"] = status;
      payload["finance_reason"] = reason || "";
      payload["finance_action_at"] = new Date();
    }

    // ✅ Duration Change — only applies on approval (status 1)
    if (status === 1 && start_date && end_date) {
      const start = dayjs(start_date);
      const end = dayjs(end_date);
      payload["start_date"] = start.toDate();
      payload["end_date"] = end.toDate();
      payload["no_of_days"] = end.diff(start, "day") + 1;

      // Also record this as "the date this specific team revised it to",
      // kept separately per team so both revisions stay visible even if
      // the other team revises again afterwards.
      if (role === "tmg" || role === "rmg") {
        payload["rmg_revised_start_date"] = start.toDate();
        payload["rmg_revised_end_date"] = end.toDate();
      } else if (role === "finance") {
        payload["finance_revised_start_date"] = start.toDate();
        payload["finance_revised_end_date"] = end.toDate();
      }
    }

    await Request.findByIdAndUpdate(id, payload);

    res.status(200).json({
      success: true,
      data: [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};