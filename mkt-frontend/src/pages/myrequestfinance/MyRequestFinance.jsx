import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  Tooltip,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import axiosInstance from "../../AxiosInstance";
import {
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { exportRowsToExcel, buildRequestExportRows } from "../../utils/exportExcel";

const { Option } = Select;
const { RangePicker } = DatePicker;

const statusTag = (status, revised = false) => {
  if (status === 1)
    return (
      <Tag color={revised ? "magenta" : "green"}>Approved</Tag>
    );
  if (status === 2)
    return (
      <Tag style={{ backgroundColor: "#ff4d4f", color: "#fff" }}>Denied</Tag>
    );
  return (
    <Tag style={{ backgroundColor: "#faad14", color: "#fff" }}>Pending</Tag>
  );
};

const MyRequestFinance = () => {
  const [requestList, setRequestList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Approve/Deny modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 1 = approve, 2 = deny
  const [approveStep, setApproveStep] = useState("choice"); // "choice" | "duration"
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Full row "view details" modal
  const [detailsRecord, setDetailsRecord] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form] = Form.useForm();

  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;

  // ✅ Fetch list
  const handleGetList = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/get-request");
      setRequestList(res.data?.data || []);
    } catch {
      message.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetList();
  }, []);

  // ✅ Refresh
  const handleRefresh = () => {
    setSearchText("");
    setStatusFilter("all");
    handleGetList();
  };

  // ✅ Overall Status Logic (for the status filter dropdown)
  const getOverallStatus = (rmg, finance) => {
    if (rmg === 0 && finance === 0) return "open";
    if (finance === 0) return "inprocess";
    if (finance === 2) return "rejected";
    if (finance === 1) return "closed";
    return "open";
  };

  // ✅ Filter + Search + Sort (pending rows always float to the top)
  const filteredList = useMemo(() => {
    let data = [...requestList];

    if (searchText) {
      const s = searchText.toLowerCase();
      data = data.filter(
        (item) =>
          item.emp_id?.toLowerCase().includes(s) ||
          item.name?.toLowerCase().includes(s),
      );
    }

    if (statusFilter !== "all") {
      data = data.filter(
        (item) =>
          getOverallStatus(item.rmg_status, item.finance_status) ===
          statusFilter,
      );
    }

    data.sort((a, b) => {
      const aPending = a.finance_status === 0 ? 0 : 1;
      const bPending = b.finance_status === 0 ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return data;
  }, [requestList, searchText, statusFilter]);

  // ✅ Modal open
  const openModal = (record, type, initialStep = "choice") => {
    setSelectedRecord(record);
    setActionType(type);
    setApproveStep(initialStep);
    setDateRange(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setApproveStep("choice");
    setDateRange(null);
    form.resetFields();
  };

  // ✅ Approve — with an optional note (not mandatory)
  const handleDirectApprove = async () => {
    try {
      setSubmitting(true);
      const vals = form.getFieldsValue();
      await axiosInstance.post(`/update-request`, {
        id: selectedRecord?._id,
        role,
        status: 1,
        reason: vals.approve_note || "",
      });
      message.success("Approved successfully");
      closeModal();
      handleGetList();
    } catch {
      message.error("Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Approve with a revised start/end date
  const handleDurationChangeSubmit = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.warning("Please select a start and end date");
      return;
    }
    try {
      setSubmitting(true);
      await axiosInstance.post(`/update-request`, {
        id: selectedRecord?._id,
        role,
        status: 1,
        reason: "Approved with revised duration",
        start_date: dateRange[0].toISOString(),
        end_date: dateRange[1].toISOString(),
      });
      message.success("Approved with revised duration");
      closeModal();
      handleGetList();
    } catch {
      message.error("Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Deny (reason required)
  const handleDenySubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await axiosInstance.post(`/update-request`, {
        id: selectedRecord?._id,
        role,
        status: 2,
        reason: values.reason,
      });
      message.success("Denied successfully");
      closeModal();
      handleGetList();
    } catch (err) {
      if (err?.errorFields) return; // validation error — stay open
      message.error("Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    const rows = buildRequestExportRows(filteredList);
    const ok = exportRowsToExcel(rows, "Finance_Requests", "Finance");
    if (!ok) message.info("No requests to export");
  };

  // ✅ Format Data
  const formattedData = filteredList.map((item) => ({
    ...item,
    key: item._id,
    empId: item.emp_id,
    project: item.proposed_project,
    client: item.proposed_client,
    startDate: item.start_date,
    endDate: item.end_date,
    days: item.no_of_days,
    attachment: item.attachment,
  }));

  const attachmentUrl = (file) =>
    file ? `${import.meta.env.VITE_BASE_URL_IMG}/${file}` : null;

  // ✅ Columns
  const columns = [
    { title: "UID", dataIndex: "uid", align: "center", width: 60, render: (v) => v || "-" },
    { title: "GCID", dataIndex: "empId", align: "center", width: 72 },
    { title: "Name", dataIndex: "name", align: "center", width: 100 },
    { title: "Proposed Client", dataIndex: "client", align: "center", width: 110 },
    { title: "Proposed Project", dataIndex: "project", align: "center", width: 110 },
    { title: "Current Dates", align: "center", width: 150, render: (_, record) => `${dayjs(record.startDate).format("DD MMM YYYY")} - ${dayjs(record.endDate).format("DD MMM YYYY")}` },
    { title: "RMG Status", dataIndex: "rmg_status", align: "center", width: 88, render: (_, record) => statusTag(record.rmg_status, Boolean(record.rmg_revised_start_date && record.rmg_revised_end_date)) },
    { title: "Finance Status", dataIndex: "finance_status", align: "center", width: 88, render: (_, record) => statusTag(record.finance_status, Boolean(record.finance_revised_start_date && record.finance_revised_end_date)) },
    {
      title: "View",
      align: "center",
      width: 56,
      render: (_, record) => (
        <Tooltip title="View full details">
          <EyeOutlined
            style={{ color: "#1677ff", cursor: "pointer", fontSize: 18 }}
            onClick={() => setDetailsRecord(record)}
          />
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      align: "center",
      width: 270,
      className: "request-action-cell",
      render: (_, record) => record.finance_status === 0 ? (
        <Space size={4} wrap={false}>
          <Button size="small" type="primary" onClick={() => openModal(record, 1, "approve_note")}>
            Approved
          </Button>
          <Button size="small" icon={<CalendarOutlined />} onClick={() => openModal(record, 1, "duration")}>
            Duration Change
          </Button>
          <Button size="small" danger onClick={() => openModal(record, 2)}>
            Deny
          </Button>
        </Space>
      ) : statusTag(record.finance_status, Boolean(record.finance_revised_start_date && record.finance_revised_end_date)),
    },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      {/* 🔥 Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <Space wrap>
          <Input.Search
            placeholder="Search GCID / Name"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
            prefix={<SearchOutlined />}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
          >
            <Option value="all">All</Option>
            <Option value="open">Open</Option>
            <Option value="closed">Closed</Option>
            <Option value="rejected">Rejected</Option>
          </Select>

          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Refresh
          </Button>
        </Space>

        <Button icon={<DownloadOutlined />} onClick={handleDownload}>
          Download Excel
        </Button>
      </div>

      {/* ✅ Table — pending requests always sort to the top */}
      <Table
        columns={columns}
        dataSource={formattedData}
        rowKey="_id"
        bordered
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* ✅ Approve / Deny Modal */}
      <Modal
        title={actionType === 1 ? "Approve Request" : "Deny Request"}
        open={modalOpen}
        onCancel={closeModal}
        footer={actionType === 2 ? undefined : null}
        onOk={handleDenySubmit}
        okText="Submit"
        okButtonProps={{ danger: true, loading: submitting }}
        destroyOnClose
      >
        {actionType === 1 && approveStep === "choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ marginBottom: 4 }}>How would you like to proceed?</p>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={() => setApproveStep("approve_note")}
            >
              Approved
            </Button>
            <Button
              size="large"
              icon={<CalendarOutlined />}
              onClick={() => setApproveStep("duration")}
            >
              Duration Change
            </Button>
          </div>
        )}

        {actionType === 1 && approveStep === "approve_note" && (
          <Form form={form} layout="vertical">
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              style={{ padding: 0, marginBottom: 8 }}
              onClick={() => setApproveStep("choice")}
            >
              Back
            </Button>
            <Form.Item label="Note (optional)" name="approve_note">
              <Input.TextArea rows={3} placeholder="Optional note..." />
            </Form.Item>
            <Button
              type="primary"
              loading={submitting}
              onClick={handleDirectApprove}
            >
              Confirm & Approve
            </Button>
          </Form>
        )}

        {actionType === 1 && approveStep === "duration" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              style={{ padding: 0, alignSelf: "flex-start" }}
              onClick={() => setApproveStep("choice")}
            >
              Back
            </Button>
            <p style={{ margin: 0 }}>Select the revised start and end date:</p>
            <RangePicker
              style={{ width: "100%" }}
              format="DD MMM YYYY"
              value={dateRange}
              onChange={(vals) => setDateRange(vals)}
            />
            <Button
              type="primary"
              loading={submitting}
              onClick={handleDurationChangeSubmit}
            >
              Confirm & Approve
            </Button>
          </div>
        )}

        {actionType === 2 && (
          <Form form={form} layout="vertical">
            <Form.Item
              label="Reason"
              name="reason"
              rules={[{ required: true, message: "Please enter reason" }]}
            >
              <Input.TextArea rows={4} placeholder="Enter reason..." />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 🔎 Full row details modal */}
      <Modal
        open={!!detailsRecord}
        onCancel={() => setDetailsRecord(null)}
        footer={null}
        title="Request Details"
        width={720}
      >
        {detailsRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="UID">{detailsRecord.uid || "-"}</Descriptions.Item>
            <Descriptions.Item label="GCID">{detailsRecord.emp_id}</Descriptions.Item>
            <Descriptions.Item label="Name">{detailsRecord.name}</Descriptions.Item>
            <Descriptions.Item label="Current Client">
              {detailsRecord.current_client}
            </Descriptions.Item>
            <Descriptions.Item label="Current Project">
              {detailsRecord.current_project}
            </Descriptions.Item>
            <Descriptions.Item label="Proposed Client">
              {detailsRecord.proposed_client}
            </Descriptions.Item>
            <Descriptions.Item label="Proposed Project">
              {detailsRecord.proposed_project}
            </Descriptions.Item>
            <Descriptions.Item label="Project Type">
              {detailsRecord.project_type}
            </Descriptions.Item>
            <Descriptions.Item label="Resource Type">
              {detailsRecord.resource_type}
            </Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {dayjs(detailsRecord.start_date).format("DD MMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="End Date">
              {dayjs(detailsRecord.end_date).format("DD MMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Days">
              {detailsRecord.no_of_days}
            </Descriptions.Item>
            <Descriptions.Item label="Request Date & Time">
              {detailsRecord.createdAt ? dayjs(detailsRecord.createdAt).format("DD MMM YYYY HH:mm") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Approval E-mail ID">
              {detailsRecord.receiver_emails || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Status">
              {statusTag(
                detailsRecord.rmg_status,
                Boolean(detailsRecord.rmg_revised_start_date && detailsRecord.rmg_revised_end_date),
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Finance Status">
              {statusTag(
                detailsRecord.finance_status,
                Boolean(detailsRecord.finance_revised_start_date && detailsRecord.finance_revised_end_date),
              )}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Revised Dates">
              {detailsRecord.rmg_revised_start_date && detailsRecord.rmg_revised_end_date
                ? `${dayjs(detailsRecord.rmg_revised_start_date).format("DD MMM YYYY")} - ${dayjs(detailsRecord.rmg_revised_end_date).format("DD MMM YYYY")}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Remarks" span={2}>
              {detailsRecord.remarks || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Finance Reason" span={2}>
              {detailsRecord.finance_reason || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Date">
              {detailsRecord.rmg_action_at ? dayjs(detailsRecord.rmg_action_at).format("DD MMM YYYY HH:mm") : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Reason">
              {detailsRecord.rmg_reason || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Attachment" span={2}>
              {attachmentUrl(detailsRecord.attachment) ? (
                <a
                  href={attachmentUrl(detailsRecord.attachment)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Attachment
                </a>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MyRequestFinance;