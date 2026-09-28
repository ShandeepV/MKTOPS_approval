import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  message,
  Select,
  Input,
  Modal,
  Descriptions,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../AxiosInstance";
import { exportRowsToExcel, buildRequestExportRows } from "../../utils/exportExcel";

const { Option } = Select;

const RequestList = () => {
  const [requestList, setRequestList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  // ✅ "View details" modal state — this replaces having to scroll the
  // table left/right to see every column. Clicking the eye icon opens
  // everything for that row in one place.
  const [detailsRecord, setDetailsRecord] = useState(null);

  const navigate = useNavigate();

  const handleRefresh = () => {
    setSearchText("");
    setStatusFilter("all");
    handleGetList();
  };

  // ✅ Format Data
  const formattedData = requestList.map((item) => ({
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

  // ✅ Status Tag
  const getStatusTag = (status, revised = false) => {
    switch (status) {
      case 0:
        return (
          <Tag icon={<ClockCircleOutlined />} color="orange">
            Pending
          </Tag>
        );
      case 1:
        return (
          <Tag icon={<CheckCircleOutlined />} color={revised ? "magenta" : "green"}>
            Approved
          </Tag>
        );
      case 2:
        return (
          <Tag icon={<CloseCircleOutlined />} color="red">
            Denied
          </Tag>
        );
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  // ✅ Overall Status UI
  const getOverallStatus = (rmg, finance) => {
    if (rmg === 0 && finance === 0) return <Tag color="blue">Open</Tag>;

    if ((rmg === 0 && finance !== 0) || (rmg !== 0 && finance === 0))
      return <Tag color="gold">In Process</Tag>;

    if (
      (rmg === 1 && finance === 2) ||
      (rmg === 2 && finance === 1) ||
      (rmg === 2 && finance === 2)
    )
      return <Tag color="red">Rejected</Tag>;

    if (rmg !== 0 && finance !== 0) return <Tag color="green">Closed</Tag>;

    return <Tag>Unknown</Tag>;
  };

  // ✅ Status Key
  const getOverallStatusKey = (rmg, finance) => {
    if (rmg === 0 && finance === 0) return "open";

    if ((rmg === 0 && finance !== 0) || (rmg !== 0 && finance === 0))
      return "inprocess";

    if (
      (rmg === 1 && finance === 2) ||
      (rmg === 2 && finance === 1) ||
      (rmg === 2 && finance === 2)
    )
      return "rejected";

    if (rmg !== 0 && finance !== 0) return "closed";

    return "open";
  };

  // ✅ Apply Filter + Search
  const filteredData = formattedData.filter((item) => {
    const statusMatch =
      statusFilter === "all" ||
      getOverallStatusKey(item.rmg_status, item.finance_status) ===
        statusFilter;

    const searchMatch =
      item.emp_id?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchText.toLowerCase());

    return statusMatch && searchMatch;
  });

  const attachmentUrl = (file) =>
    file ? `${import.meta.env.VITE_BASE_URL_IMG}/${file}` : null;

  // ✅ Columns — trimmed down to what's needed to scan the list at a
  // glance. Everything else (current client/project, remarks, RMG/Finance
  // reasons, attachment) lives behind the "View" icon in Actions so the
  // user never has to scroll the table sideways.
  const columns = [
    { title: "UID", dataIndex: "uid", align: "center", render: (v) => v || "-" },
    {
      title: "GCID",
      dataIndex: "emp_id",
      align: "center",
    },
    {
      title: "Name",
      dataIndex: "name",
      align: "center",
    },
    {
      title: "Proposed Client",
      dataIndex: "client",
      align: "center",
    },
    {
      title: "Proposed Project",
      dataIndex: "project",
      align: "center",
    },
    {
      title: "Applied Date",
      dataIndex: "createdAt",
      align: "center",
      render: (date) => date ? dayjs(date).format("DD MMM YYYY") : "-",
    },
    {
      title: "Project Type",
      dataIndex: "project_type",
      align: "center",
    },
    {
      title: "Resource Type",
      dataIndex: "resource_type",
      align: "center",
    },
    {
      title: "Current Dates",
      align: "center",
      render: (_, record) => record.startDate && record.endDate
        ? `${dayjs(record.startDate).format("DD MMM YYYY")} - ${dayjs(record.endDate).format("DD MMM YYYY")}`
        : "-",
    },
    {
      title: "Days",
      dataIndex: "days",
      align: "center",
      render: (d) => <Tag color="purple">{d} days</Tag>,
    },
    {
      title: "RMG Status",
      dataIndex: "rmg_status",
      align: "center",
      render: (_, record) => getStatusTag(
        record.rmg_status,
        Boolean(record.rmg_revised_start_date && record.rmg_revised_end_date),
      ),
    },
    {
      title: "Finance Status",
      dataIndex: "finance_status",
      align: "center",
      render: (_, record) => getStatusTag(
        record.finance_status,
        false,
      ),
    },
    {
      title: "RMG Revised Dates",
      align: "center",
      render: (_, record) => record.rmg_revised_start_date && record.rmg_revised_end_date
        ? `${dayjs(record.rmg_revised_start_date).format("DD MMM YYYY")} - ${dayjs(record.rmg_revised_end_date).format("DD MMM YYYY")}`
        : "-",
    },
    {
      title: "Overall Status",
      align: "center",
      render: (_, r) => getOverallStatus(r.rmg_status, r.finance_status),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 110,
      render: (_, record) => (
        <div
          style={{ display: "flex", gap: 14, justifyContent: "center" }}
        >
          <Tooltip title="View details">
            <EyeOutlined
              style={{ color: "#1677ff", cursor: "pointer", fontSize: 18 }}
              onClick={() => setDetailsRecord(record)}
            />
          </Tooltip>
            {/* Delete remains available until RMG or Finance approves. */}
          {record.rmg_status !== 1 && record.finance_status !== 1 && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Are you sure you want to delete this request?"
                onConfirm={() => handleDelete(record)}
              >
                <DeleteOutlined
                  style={{ color: "#ff4d4f", cursor: "pointer", fontSize: 18 }}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  // ✅ API
  const handleGetList = async () => {
    try {
      const res = await axiosInstance.get("/get-request");
      setRequestList(res.data?.data || []);
    } catch {
      message.error("Failed to load");
    }
  };

  // ✅ Admin can download every request currently in view (filtered by
  // the same search/status filter as the table).
  const handleDownload = () => {
    const rows = buildRequestExportRows(filteredData);
    const ok = exportRowsToExcel(rows, "All_Requests", "Requests");
    if (!ok) message.info("No requests to export");
  };

  const handleDelete = async (record) => {
    try {
      await axiosInstance.post("/delete-request", { id: record._id });
      message.success("Deleted successfully");
      handleGetList();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete");
    }
  };

  useEffect(() => {
    handleGetList();
  }, []);

  return (
    <div style={{ marginTop: 20 }}>
      {/* 🔥 Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ margin: 0 }}>NBL Approval</h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* 🔍 Search */}
          <Input
            placeholder="Search Emp ID / Name"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          {/* 🔽 Filter */}
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
          >
            <Option value="all">All</Option>
            <Option value="open">Open</Option>
            <Option value="inprocess">In Process</Option>
            <Option value="closed">Closed</Option>
            <Option value="rejected">Rejected</Option>
          </Select>

          {/* ⬇️ Download */}
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download Excel
          </Button>

          {/* ➕ Button */}
          <Button type="primary" onClick={() => navigate("/add-request")}>
            + Add Request
          </Button>
        </div>
      </div>

      {/* Table — no more horizontal scrolling needed to see everything */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="_id"
        bordered
        pagination={{ pageSize: 10 }}
      />

      {/* Details Modal — everything that used to require scrolling */}
      <Modal
        open={!!detailsRecord}
        onCancel={() => setDetailsRecord(null)}
        footer={null}
        title="Request Details"
        width={800}
      >
        {detailsRecord && (
          <Descriptions
            bordered
            column={2}
            size="small"
            labelStyle={{ width: 170 }}
            contentStyle={{ wordBreak: "break-word", whiteSpace: "normal" }}
          >
            <Descriptions.Item label="UID">
              {detailsRecord.uid || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Request Date & Time">
              {detailsRecord.createdAt
                ? dayjs(detailsRecord.createdAt).format("DD MMM YYYY HH:mm")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="GCID">
              {detailsRecord.emp_id}
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {detailsRecord.name}
            </Descriptions.Item>
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
            <Descriptions.Item label="Resource Location">
              {detailsRecord.resource_location || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Applied Start Date">
              {detailsRecord.applied_start_date
                ? dayjs(detailsRecord.applied_start_date).format("DD MMM YYYY")
                : dayjs(detailsRecord.start_date).format("DD MMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Applied End Date">
              {detailsRecord.applied_end_date
                ? dayjs(detailsRecord.applied_end_date).format("DD MMM YYYY")
                : dayjs(detailsRecord.end_date).format("DD MMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Current Start Date">
              {dayjs(detailsRecord.start_date).format("DD MMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Current End Date">
              {dayjs(detailsRecord.end_date).format("DD MMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Days">
              {detailsRecord.no_of_days}
            </Descriptions.Item>
            <Descriptions.Item label="Overall Status">
              {getOverallStatus(
                detailsRecord.rmg_status,
                detailsRecord.finance_status,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Remarks" span={2}>
              {detailsRecord.remarks || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Status">
              {getStatusTag(
                detailsRecord.rmg_status,
                Boolean(detailsRecord.rmg_revised_start_date && detailsRecord.rmg_revised_end_date),
              )}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Revised Dates">
              {detailsRecord.rmg_revised_start_date &&
              detailsRecord.rmg_revised_end_date
                ? `${dayjs(detailsRecord.rmg_revised_start_date).format("DD MMM YYYY")} → ${dayjs(detailsRecord.rmg_revised_end_date).format("DD MMM YYYY")}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Reason">
              {detailsRecord.rmg_reason || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Finance Status">
              {getStatusTag(
                detailsRecord.finance_status,
                false,
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Finance Reason">
              {detailsRecord.finance_reason || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Requested By" span={2}>
              {detailsRecord.requestor_email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Approval E-mail ID">
              {detailsRecord.receiver_emails || "-"}
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

export default RequestList;