import * as XLSX from "xlsx";
import dayjs from "dayjs";

/**
 * Generic "download rows as an .xlsx file" helper used by every
 * request/BGV list page (Admin, Market Leader, RMG, Finance).
 *
 * @param {Array<Object>} rows   - Array of plain objects, one per row.
 *                                 Keys become the column headers.
 * @param {string} fileNamePrefix - File is saved as `${prefix}_DD-MM-YYYY.xlsx`
 * @param {string} sheetName
 */
export const exportRowsToExcel = (
  rows = [],
  fileNamePrefix = "Export",
  sheetName = "Sheet1",
) => {
  if (!rows.length) {
    // Caller shows the "nothing to export" message; keep this function
    // side-effect free when there's no data.
    return false;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // ✅ Reasonable default column widths so the sheet isn't all squished
  const colWidths = Object.keys(rows[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...rows.map((r) => String(r[key] ?? "").length),
      10,
    ) + 2,
  }));
  worksheet["!cols"] = colWidths;

  const fileName = `${fileNamePrefix}_${dayjs().format("DD-MM-YYYY")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  return true;
};

const formatDateTime = (value) =>
  value && dayjs(value).isValid() ? dayjs(value).format("DD MMM YYYY HH:mm") : "";
const formatDate = (value) =>
  value && dayjs(value).isValid() ? dayjs(value).format("DD MMM YYYY") : "";
const formatDateRange = (start, end) =>
  start && end && dayjs(start).isValid() && dayjs(end).isValid()
    ? `${formatDate(start)} - ${formatDate(end)}`
    : "";

/** Shared row-shaping for the RMG/Finance request records. */
export const buildRequestExportRows = (records = []) =>
  records.map((r) => ({
    UID: r.uid || "",
    GCID: r.emp_id,
    Name: r.name,
    "Applied Date & Time": formatDateTime(r.createdAt),
    "Current Client": r.current_client,
    "Current Project": r.current_project,
    "Proposed Client": r.proposed_client,
    "Proposed Project": r.proposed_project,
    "Project Type": r.project_type,
    "Resource Type": r.resource_type,
    "Proposed Dates": formatDateRange(
      r.applied_start_date || r.start_date,
      r.applied_end_date || r.end_date,
    ),
    Days: r.no_of_days,
    Remarks: r.remarks || "",
    "RMG Status": ["Pending", "Approved", "Denied"][r.rmg_status] || "",
    "RMG Approved Date & Time": r.rmg_status === 1 ? formatDateTime(r.rmg_action_at) : "",
    "RMG Action Date & Time": formatDateTime(r.rmg_action_at),
    "RMG Revised Dates": formatDateRange(
      r.rmg_revised_start_date,
      r.rmg_revised_end_date,
    ),
    "RMG Reason": r.rmg_reason || "",
    "Finance Status": ["Pending", "Approved", "Denied"][r.finance_status] || "",
    "Finance Action Date & Time": formatDateTime(r.finance_action_at),
    "Finance Revised Dates": formatDateRange(
      r.finance_revised_start_date,
      r.finance_revised_end_date,
    ),
    "Finance Reason": r.finance_reason || "",
    "EMAIL TO BE CC'd": r.receiver_emails || "",
    Requestor: r.requestor_email || "",
  }));

/** Shared row-shaping for BGV records. */
export const buildBGVExportRows = (records = []) =>
  records.map((r) => {
    const pendingCompliance = (r.pending_compliance || r.pending_appliance || "").trim();
    return ({
    UID: r.uid || "",
    "Applied Date & Time": formatDateTime(r.createdAt),
    "Assigned To": r.assigned_to,
    GCID: r.gcid,
    Name: r.name,
    Client: r.client,
    "Project Name": r.project_name,
    "BGV Initiated Date": r.bgv_initiated_date
      ? dayjs(r.bgv_initiated_date).format("DD MMM YYYY")
      : "",
    "BGV Completed Date": r.bgv_completed_date
      ? dayjs(r.bgv_completed_date).format("DD MMM YYYY")
      : "",
    "Billable Start Date": r.billable_start_date
      ? dayjs(r.billable_start_date).format("DD MMM YYYY")
      : "",
    "Employee Type": r.employee_type || "",
    "Pending Compliance": pendingCompliance && pendingCompliance.toLowerCase() !== "no"
      ? pendingCompliance
      : "-",
    "E-mail to be CC'ed": r.email || "",
    Justification: r.justification || "",
    "ML Status": ["Pending", "Approved", "Denied"][r.ml_status] || "",
    "BGV Approved Date & Time": r.ml_status === 1 ? formatDateTime(r.ml_action_at) : "",
    "BGV Action Date & Time": formatDateTime(r.ml_action_at),
    "ML Reason": r.ml_reason || "",
    });
  });
