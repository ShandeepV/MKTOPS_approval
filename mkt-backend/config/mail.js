import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const smtpUser = (process.env.MAIL_USER || "").trim();
const smtpPassword = (process.env.MAIL_PASS || "").replace(/\s/g, "");

/**
 * Create reusable transporter
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT) || 465,
  secure: true,

  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});

/**
 * Verify SMTP Connection
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("Mail Server Error:", error);
  } else {
    console.log("Mail Server Ready");
  }
});

/**
 * Send Mail Function
 */
export const sendMail = async ({
  to,
  subject,
  html,
  text = "",
  attachments = [],
  replyTo = "",
  fromName = "Request App",
  fromEmail = smtpUser,
  cc = [],
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail || smtpUser}>`,
      to,
      ...(cc.length ? { cc } : {}),
      subject,
      text,
      html,
      attachments,
      ...(replyTo ? { replyTo } : {}),
    });

    console.log("Mail Sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Send Mail Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Off-Shore Notify Email Template
 * Sent to whatever email address(es) the requestor typed into the
 * "Notify Email(s)" field when they picked Off-Shore.
 */
export const getOffshoreNotifyMailTemplate = ({
  requestorName,
  requestorEmail,
  uid,
  gcid,
  employeeName,
  proposedClient,
  proposedProject,
  projectType,
  resourceType,
  startDate,
  endDate,
  days,
  link,
}) => {
  return `
  <div style="font-family:Arial;padding:20px;">

    <h2 style="color:#1677ff;">
      Off-Shore Resource Request Notification
    </h2>

    <p>Hello,</p>

    <p>
      A new Off-Shore request has been raised by
      <b>${requestorName}</b>${requestorEmail ? ` (<a href="mailto:${requestorEmail}">${requestorEmail}</a>)` : ""}.
    </p>

    <p>
      <b>Request UID:</b> ${uid}<br/>
      <b>Employee:</b> ${employeeName}<br/>
      <b>GCID:</b> ${gcid}<br/>
      ${proposedClient ? `<b>Proposed Client:</b> ${proposedClient}<br/>` : ""}
      ${proposedProject ? `<b>Proposed Project:</b> ${proposedProject}<br/>` : ""}
      <b>Project Type:</b> ${projectType}<br/>
      <b>Resource Type:</b> ${resourceType}<br/>
      <b>Applied Dates:</b> ${startDate} - ${endDate}<br/>
      <b>Days:</b> ${days}
    </p>

    <p style="color:#555;">
      Replying to this email will go directly to the requestor.
    </p>

    ${
      link
        ? `<a
      href="${link}"
      style="
        display:inline-block;
        padding:12px 18px;
        background:#1677ff;
        color:white;
        text-decoration:none;
        border-radius:6px;
        margin-top:10px;
      "
    >
      View Request
    </a>`
        : ""
    }

    <hr style="margin-top:30px;" />

    <p style="font-size:12px;color:gray;">
      This is an automated email from Request App.
    </p>

  </div>
  `;
};
export const getRequestMailTemplate = ({
  requestorName,
  role,
  link,
  uid,
  requestorEmail,
  gcid,
  employeeName,
  currentClient,
  currentProject,
  proposedClient,
  proposedProject,
  projectType,
  resourceType,
  resourceLocation,
  startDate,
  endDate,
  days,
}) => {
  return `
  <div style="font-family:Arial;padding:20px;">
    
    <h2 style="color:#1677ff;">
      New Request - ${uid}
    </h2>

    <p>Hello <b>${role}</b> Team,</p>

    <p>
      A new request has been raised for <b>${employeeName}</b> by
      <b>${requestorName}</b>${requestorEmail ? ` (<a href="mailto:${requestorEmail}">${requestorEmail}</a>)` : ""}.
    </p>

    <p>
      <b>Request UID:</b> ${uid}<br/>
      <b>GCID:</b> ${gcid}<br/>
      <b>Current Client / Project:</b> ${currentClient} / ${currentProject}<br/>
      <b>Proposed Client / Project:</b> ${proposedClient} / ${proposedProject}<br/>
      <b>Project Type:</b> ${projectType}<br/>
      <b>Resource:</b> ${resourceType} (${resourceLocation})<br/>
      <b>Applied Dates:</b> ${startDate} - ${endDate}<br/>
      <b>Days:</b> ${days}
    </p>

    <p style="color:#555;">
      Replying to this email will go directly to the requestor.
    </p>

    <a 
      href="${link}"
      style="
        display:inline-block;
        padding:12px 18px;
        background:#1677ff;
        color:white;
        text-decoration:none;
        border-radius:6px;
        margin-top:10px;
      "
    >
      View Request
    </a>

    <hr style="margin-top:30px;" />

    <p style="font-size:12px;color:gray;">
      This is an automated email from Request App.
    </p>

  </div>
  `;
};

export const getBGVMailTemplate = ({
  requestorName,
  requestorEmail,
  uid,
  gcid,
  name,
  client,
  projectName,
  link,
}) => `
  <div style="font-family:Arial;padding:20px;">
    <h2 style="color:#1677ff;">New BGV Approval Request</h2>
    <p>Hello Market Leader,</p>
    <p>A BGV request has been submitted by <b>${requestorName || "Requestor"}</b>${requestorEmail ? ` (${requestorEmail})` : ""}.</p>
    <p>
      <b>Request ID:</b> ${uid}<br/>
      <b>GCID:</b> ${gcid}<br/>
      <b>Name:</b> ${name}<br/>
      <b>Client:</b> ${client}<br/>
      <b>Project:</b> ${projectName}
    </p>
    <a href="${link}" style="display:inline-block;padding:12px 18px;background:#1677ff;color:white;text-decoration:none;border-radius:6px;">Review BGV Request</a>
    <p style="font-size:12px;color:gray;margin-top:30px;">Automated notification from Request App.</p>
  </div>
`;