import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  message,
  Select,
  Input,
  Modal,
  Descriptions,
  Tooltip,
  Button,
  Tabs,
  Popconfirm,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../AxiosInstance";
import MyBGVUser from "./MyBGVUser";
import { exportRowsToExcel, buildRequestExportRows } from "../../utils/exportExcel";

const { Option } = Select;

// A small helper so a possibly-missing date pair renders as "-" instead of
// an empty/odd string, and a present pair renders compactly on one line —
// this is what backs the new "Applied Dates" / "RMG Revised" / "Finance
// Revised" columns.
const formatDateRange = (start, end) => {
  if (!start || !end) return "-";
  return `${dayjs(start).format("DD MMM YYYY")} → ${dayjs(end).format("DD MMM YYYY")}`;
};

const MyRequestList = () => {
  const [requestList, setRequestList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  const navigate = useNavigate();

  const loggedInUser = JSON.parse(
    localStorage.getItem("user_info") || "null"
  );

  const myEmail = (loggedInUser?.email || "").trim().toLowerCase();

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

  const getOverallStatus = (rmg, finance) => {
    if (rmg === 0 && finance === 0) {
      return <Tag color="blue">Open</Tag>;
    }
    if ((rmg === 0 && finance !== 0) || (rmg !== 0 && finance === 0)) {
      return <Tag color="gold">In Process</Tag>;
    }
    if (
      (rmg === 1 && finance === 2) ||
      (rmg === 2 && finance === 1) ||
      (rmg === 2 && finance === 2)
    ) {
      return <Tag color="red">Rejected</Tag>;
    }
    if (rmg !== 0 && finance !== 0) {
      return <Tag color="green">Closed</Tag>;
    }
    return <Tag>Unknown</Tag>;
  };

  const getOverallStatusKey = (rmg, finance) => {
    if (rmg === 0 && finance === 0) {
      return "open";
    }
    if ((rmg === 0 && finance !== 0) || (rmg !== 0 && finance === 0)) {
      return "inprocess";
    }
    if (
      (rmg === 1 && finance === 2) ||
      (rmg === 2 && finance === 1) ||
      (rmg === 2 && finance === 2)
    ) {
      return "rejected";
    }
    if (rmg !== 0 && finance !== 0) {
      return "closed";
    }
    return "open";
  };

  const handleGetList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/get-request");
      const all = res.data?.data || [];
      const mine = all.filter(
        (r) => (r.requestor_email || "").trim().toLowerCase() === myEmail
      );
      setRequestList(mine);
    } catch (error) {
      console.error("Failed to load requests:", error);
      message.error("Failed to load your requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setSearchText("");
    setStatusFilter("all");
    handleGetList();
  };

  const handleDownload = () => {
    const rows = buildRequestExportRows(filteredData);
    const ok = exportRowsToExcel(rows, "My_Requests", "Requests");
    if (!ok) message.info("No requests to export");
  };

  const handleDelete = async (record) => {
    try {
      await axiosInstance.post("/delete-request", { id: record._id });
      message.success("Request deleted");
      handleGetList();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to delete request");
    }
  };

  const formattedData = requestList.map((item) => ({
    ...item,
    key: item._id,
  }));

  const filteredData = formattedData.filter((item) => {
    const statusMatch =
      statusFilter === "all" ||
      getOverallStatusKey(item.rmg_status, item.finance_status) ===
        statusFilter;

    const search = searchText.trim().toLowerCase();

    const searchMatch =
      !search ||
      (item.emp_id || "").toLowerCase().includes(search) ||
      (item.name || "").toLowerCase().includes(search) ||
      (item.proposed_client || "").toLowerCase().includes(search) ||
      (item.proposed_project || "").toLowerCase().includes(search);

    return statusMatch && searchMatch;
  });

  const attachmentUrl = (file) => {
    if (!file) {
      return null;
    }
    return `${import.meta.env.VITE_BASE_URL_IMG}/${file}`;
  };

  // ✅ Reworked columns:
  // - GCID / Name are now in the open table (were previously eye-icon-only)
  // - Project Type moved OUT of the open table, into the Details modal only
  // - Applied Dates (what was originally submitted) is always shown
  // - RMG Revised dates stay visible; Finance date fields are omitted
  const columns = [
    { title: "UID", dataIndex: "uid", align: "center", render: (value) => value || "-" },
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
      dataIndex: "proposed_client",
      align: "center",
    },
    {
      title: "Proposed Project",
      dataIndex: "proposed_project",
      align: "center",
    },
    {
      title: "Applied Dates",
      align: "center",
      render: (_, record) =>
        formatDateRange(record.applied_start_date, record.applied_end_date),
    },
    {
      title: "Days",
      dataIndex: "no_of_days",
      align: "center",
      render: (d) => <Tag color="purple">{d ?? 0} days</Tag>,
    },
    {
      title: "RMG Status",
      align: "center",
      render: (_, record) => getStatusTag(
        record.rmg_status,
        Boolean(record.rmg_revised_start_date && record.rmg_revised_end_date),
      ),
    },
    {
      title: "RMG Revised Dates",
      align: "center",
      render: (_, record) =>
        formatDateRange(
          record.rmg_revised_start_date,
          record.rmg_revised_end_date
        ),
    },
    {
      title: "Finance Status",
      align: "center",
      render: (_, record) => getStatusTag(
        record.finance_status,
        false,
      ),
    },
    {
      title: "Overall Status",
      align: "center",
      render: (_, record) =>
        getOverallStatus(record.rmg_status, record.finance_status),
    },
    {
      title: "Details",
      key: "actions",
      align: "center",
      width: 90,
      fixed: "right",
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <Tooltip title="View details">
            <EyeOutlined
              style={{ color: "#1677ff", cursor: "pointer", fontSize: 18 }}
              onClick={() => setDetailsRecord(record)}
            />
          </Tooltip>
          {record.rmg_status !== 1 && record.finance_status !== 1 && (
            <Tooltip title="Delete request">
              <Popconfirm
                title="Delete this request?"
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

  return (
    <div style={{ marginTop: 10 }}>
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
          <Input
            placeholder="Search GCID / Name / Client / Project"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />

          <Button icon={<ReloadOutlined />} onClick={handleRefresh} />

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

          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download Excel
          </Button>

          <Button type="primary" onClick={() => navigate("/my-add-request")}>
            + New Request
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="_id"
        bordered
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

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
            <Descriptions.Item label="GCID">
              {detailsRecord.emp_id || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              {detailsRecord.name || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Current Client">
              {detailsRecord.current_client || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Current Project">
              {detailsRecord.current_project || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Proposed Client">
              {detailsRecord.proposed_client || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Proposed Project">
              {detailsRecord.proposed_project || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Project Type">
              {detailsRecord.project_type || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Resource Type">
              {detailsRecord.resource_type || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Resource Location">
              {detailsRecord.resource_location || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Applied Dates">
              {formatDateRange(
                detailsRecord.applied_start_date,
                detailsRecord.applied_end_date
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Current Dates">
              {formatDateRange(
                detailsRecord.start_date,
                detailsRecord.end_date
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Days">
              {detailsRecord.no_of_days ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Overall Status">
              {getOverallStatus(
                detailsRecord.rmg_status,
                detailsRecord.finance_status
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Remarks" span={2}>
              {detailsRecord.remarks || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Status">
              {getStatusTag(
                detailsRecord.rmg_status,
                Boolean(detailsRecord.rmg_revised_start_date && detailsRecord.rmg_revised_end_date)
              )}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Revised Dates">
              {formatDateRange(
                detailsRecord.rmg_revised_start_date,
                detailsRecord.rmg_revised_end_date
              )}
            </Descriptions.Item>
            <Descriptions.Item label="RMG Reason">
              {detailsRecord.rmg_reason || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Finance Status">
              {getStatusTag(
                detailsRecord.finance_status,
                false
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Finance Reason">
              {detailsRecord.finance_reason || "-"}
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

// Top-level page: NBL requests and BGV submissions.
const MyRequestUser = () => {
  return (
    <div style={{ marginTop: 10 }}>
      <Tabs
        defaultActiveKey="cnbl"
        items={[
          {
            key: "cnbl",
            label: "NBL Approval",
            children: <MyRequestList />,
          },
          {
            key: "bgv",
            label: "BGV Approval",
            children: <MyBGVUser />,
          },
        ]}
      />
    </div>
  );
};

export default MyRequestUser;