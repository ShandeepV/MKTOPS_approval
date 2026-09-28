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
  Popconfirm,
  Tooltip,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axiosInstance from "../../AxiosInstance";
import { exportRowsToExcel, buildBGVExportRows } from "../../utils/exportExcel";

const { Option } = Select;

const statusTag = (status) => {
  if (status === 1)
    return (
      <Tag style={{ backgroundColor: "#52c41a", color: "#fff" }}>Approved</Tag>
    );
  if (status === 2)
    return (
      <Tag style={{ backgroundColor: "#ff4d4f", color: "#fff" }}>Denied</Tag>
    );
  return (
    <Tag style={{ backgroundColor: "#faad14", color: "#fff" }}>Pending</Tag>
  );
};

const MarketLeaderBGV = () => {
  const [bgvList, setBgvList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [denyOpen, setDenyOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsRecord, setDetailsRecord] = useState(null);

  const [form] = Form.useForm();

  let userData = JSON.parse(localStorage.getItem("user_info"));

  const handleGetList = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/get-bgv");
      setBgvList(res.data?.data || []);
    } catch {
      message.error("Failed to load BGV requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetList();
  }, []);

  const handleRefresh = () => {
    setSearchText("");
    setStatusFilter("all");
    handleGetList();
  };

  // ✅ Only the BGVs routed to this Market Leader
  const myList = useMemo(
    () =>
      bgvList.filter(
        (b) =>
          !userData?.name ||
          b.assigned_to?.toLowerCase() === userData.name.toLowerCase(),
      ),
    [bgvList, userData?.name],
  );

  const filteredList = useMemo(() => {
    let data = [...myList];

    if (searchText) {
      const s = searchText.toLowerCase();
      data = data.filter(
        (item) =>
          item.gcid?.toLowerCase().includes(s) ||
          item.name?.toLowerCase().includes(s),
      );
    }

    if (statusFilter !== "all") {
      const map = { pending: 0, approved: 1, denied: 2 };
      data = data.filter((item) => item.ml_status === map[statusFilter]);
    }

    // ✅ Pending items that need action float to the top; already
    // decided ones sink to the bottom.
    data.sort((a, b) => {
      const aPending = a.ml_status === 0 ? 0 : 1;
      const bPending = b.ml_status === 0 ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return data;
  }, [myList, searchText, statusFilter]);

  // ✅ Approve directly
  const handleApprove = async (record) => {
    try {
      await axiosInstance.post("/update-bgv", {
        id: record._id,
        status: 1,
        reason: "",
      });
      message.success("Approved successfully");
      handleGetList();
    } catch {
      message.error("Action failed");
    }
  };

  const openDenyModal = (record) => {
    setSelectedRecord(record);
    setDenyOpen(true);
  };

  const handleDenySubmit = async () => {
    try {
      const vals = await form.validateFields();
      await axiosInstance.post("/update-bgv", {
        id: selectedRecord?._id,
        status: 2,
        reason: vals.reason,
      });
      message.success("Denied successfully");
      setDenyOpen(false);
      form.resetFields();
      handleGetList();
    } catch (err) {
      if (err?.errorFields) return; // validation error, stay open
      message.error("Action failed");
    }
  };

  const handleDownload = () => {
    const rows = buildBGVExportRows(filteredList);
    const ok = exportRowsToExcel(rows, "My_BGV_Requests", "BGV");
    if (!ok) message.info("No BGV requests to export");
  };

  const columns = [
    {
      title: "UID",
      dataIndex: "uid",
      align: "center",
      render: (v) => v || "-",
    },
    {
      title: "Applied Date",
      dataIndex: "createdAt",
      align: "center",
      render: (date) => date ? dayjs(date).format("DD MMM YYYY") : "-",
    },
    { title: "GCID", dataIndex: "gcid", align: "center" },
    { title: "Name", dataIndex: "name", align: "center" },
    { title: "Client", dataIndex: "client", align: "center" },
    { title: "Project Name", dataIndex: "project_name", align: "center" },
    {
      title: "BGV Initiated Date",
      dataIndex: "bgv_initiated_date",
      align: "center",
      render: (d) => (d ? dayjs(d).format("DD MMM YYYY") : "-"),
    },
    {
      title: "BGV Completed Date",
      dataIndex: "bgv_completed_date",
      align: "center",
      render: (d) => (d ? dayjs(d).format("DD MMM YYYY") : "-"),
    },
    { title: "E-mail to be CC'ed", dataIndex: "email", align: "center" },
    {
      title: "BGV Status",
      dataIndex: "ml_status",
      align: "center",
      render: (s) => statusTag(s),
    },
    {
      title: "Details",
      align: "center",
      width: 80,
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
      title: "Action",
      align: "center",
      render: (_, record) => {
        if (record.ml_status !== 0) return null;
        return (
          <Space>
            <Popconfirm
              title="Approve this BGV request?"
              onConfirm={() => handleApprove(record)}
            >
              <Button type="primary" icon={<CheckCircleOutlined />}>
                Approve
              </Button>
            </Popconfirm>
            <Button danger onClick={() => openDenyModal(record)}>
              Deny
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ marginTop: 20 }}>
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
            style={{ width: 160 }}
          >
            <Option value="all">All</Option>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="denied">Denied</Option>
          </Select>

          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Refresh
          </Button>
        </Space>

        <Button icon={<DownloadOutlined />} onClick={handleDownload}>
          Download Excel
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredList}
        rowKey="_id"
        bordered
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Deny reason modal */}
      <Modal
        title="Deny BGV Request"
        open={denyOpen}
        onCancel={() => {
          setDenyOpen(false);
          form.resetFields();
        }}
        onOk={handleDenySubmit}
        okText="Submit"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: "Please enter reason" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter reason..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Full row details modal */}
      <Modal
        open={!!detailsRecord}
        onCancel={() => setDetailsRecord(null)}
        footer={null}
        title="BGV Request Details"
        width={700}
      >
        {detailsRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="UID">{detailsRecord.uid || "-"}</Descriptions.Item>
            <Descriptions.Item label="GCID">{detailsRecord.gcid}</Descriptions.Item>
            <Descriptions.Item label="Name">{detailsRecord.name}</Descriptions.Item>
            <Descriptions.Item label="Client">{detailsRecord.client}</Descriptions.Item>
            <Descriptions.Item label="Project Name">
              {detailsRecord.project_name}
            </Descriptions.Item>
            <Descriptions.Item label="Employee Type">
              {detailsRecord.employee_type || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="BGV Initiated Date">
              {detailsRecord.bgv_initiated_date
                ? dayjs(detailsRecord.bgv_initiated_date).format("DD MMM YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="BGV Completed Date">
              {detailsRecord.bgv_completed_date
                ? dayjs(detailsRecord.bgv_completed_date).format("DD MMM YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Billable Start Date">
              {detailsRecord.billable_start_date
                ? dayjs(detailsRecord.billable_start_date).format("DD MMM YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Pending Compliance">
              {detailsRecord.pending_compliance || detailsRecord.pending_appliance || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="E-mail to be CC'ed" span={2}>
              {detailsRecord.email || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Reason for ML approval" span={2}>
              {detailsRecord.justification || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="BGV Status">
              {statusTag(detailsRecord.ml_status)}
            </Descriptions.Item>
            <Descriptions.Item label="ML Decision Reason">
              {detailsRecord.ml_reason || "-"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MarketLeaderBGV;