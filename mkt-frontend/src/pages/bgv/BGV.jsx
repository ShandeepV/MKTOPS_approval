import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Tag,
  message,
  Select,
  Input,
  Modal,
  Descriptions,
  Form,
  DatePicker,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
  DownloadOutlined,
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

const BGV = () => {
  const [bgvList, setBgvList] = useState([]);
  const [marketLeaders, setMarketLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  const [form] = Form.useForm();

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

  const handleGetMarketLeaders = async () => {
    try {
      const res = await axiosInstance.post("/get-user", {
        role: "market_leader",
      });
      setMarketLeaders(res.data?.data || []);
    } catch {
      // non-fatal — form falls back to free text entry
    }
  };

  useEffect(() => {
    handleGetList();
    handleGetMarketLeaders();
  }, []);

  const handleRefresh = () => {
    setSearchText("");
    setStatusFilter("all");
    handleGetList();
  };

  const filteredList = useMemo(() => {
    let data = [...bgvList];

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

    return data;
  }, [bgvList, searchText, statusFilter]);

  const handleAddSubmit = async () => {
    try {
      const vals = await form.validateFields();
      setSubmitting(true);

      const response = await axiosInstance.post("/create-bgv", {
        assigned_to: vals.assigned_to,
        gcid: vals.gcid,
        name: vals.name,
        client: vals.client,
        project_name: vals.project_name,
        employee_type: vals.employee_type,
        bgv_initiated_date: vals.bgv_initiated_date?.toISOString(),
        bgv_completed_date: vals.bgv_completed_date?.toISOString(),
        billable_start_date: vals.billable_start_date?.toISOString(),
        pending_compliance: vals.pending_compliance || "",
        email: vals.email || "",
        justification: vals.justification,
        requestor_email: JSON.parse(localStorage.getItem("user_info") || "null")?.email || "",
      });

      if (response.data?.emailSent === false) {
        message.warning("BGV request saved, but the notification email could not be sent");
      } else {
        message.success("BGV request added and notification email sent");
      }
      setAddOpen(false);
      form.resetFields();
      handleGetList();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to add BGV request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    const rows = buildBGVExportRows(filteredList);
    const ok = exportRowsToExcel(rows, "All_BGV_Requests", "BGV");
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
    { title: "Assigned To", dataIndex: "assigned_to", align: "center" },
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
        <h3 style={{ margin: 0 }}>BGV Approval</h3>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Input
            placeholder="Search GCID / Name"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
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
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddOpen(true)}
          >
            Add BGV
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredList}
        rowKey="_id"
        bordered
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Add BGV modal */}
      <Modal
        title="Add BGV Request"
        open={addOpen}
        onCancel={() => {
          setAddOpen(false);
          form.resetFields();
        }}
        onOk={handleAddSubmit}
        okText="Submit"
        confirmLoading={submitting}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Assigned To (Market Leader)"
                name="assigned_to"
                rules={[{ required: true, message: "Select a market leader" }]}
              >
                <Select
                  placeholder="Select market leader"
                  showSearch
                  optionFilterProp="children"
                >
                  {marketLeaders.map((ml) => (
                    <Option key={ml._id} value={ml.name}>
                      {ml.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="GCID"
                name="gcid"
                rules={[{ required: true, message: "GCID is required" }]}
              >
                <Input placeholder="Enter GCID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Client"
                name="client"
                rules={[{ required: true, message: "Client is required" }]}
              >
                <Input placeholder="Enter client" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Project Name"
                name="project_name"
                rules={[{ required: true, message: "Project is required" }]}
              >
                <Input placeholder="Enter project" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Employee Type"
                name="employee_type"
                rules={[{ required: true, message: "Select employee type" }]}
              >
                <Select placeholder="Select employee type">
                  <Option value="New Employee">New Employee</Option>
                  <Option value="Re-Deployed Employee">Re-Deployed Employee</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="E-mail to be CC'ed (optional)"
                name="email"
                rules={[
                  { type: "email", message: "Invalid email" },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="BGV Initiated Date"
                name="bgv_initiated_date"
                rules={[{ required: true, message: "Required" }]}
              >
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="BGV Completed Date" name="bgv_completed_date">
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Billable Start Date" name="billable_start_date">
                <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Pending Compliance (optional)" name="pending_compliance">
                <Input placeholder="Enter pending compliance, if any" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Reason for ML approval (optional)" name="justification">
                <Input.TextArea rows={3} placeholder="Enter reason for ML approval..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Details modal */}
      <Modal
        open={!!detailsRecord}
        onCancel={() => setDetailsRecord(null)}
        footer={null}
        title="BGV Request Details"
        width={760}
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
            <Descriptions.Item label="Assigned To">
              {detailsRecord.assigned_to}
            </Descriptions.Item>
            <Descriptions.Item label="GCID">{detailsRecord.gcid}</Descriptions.Item>
            <Descriptions.Item label="Name">{detailsRecord.name}</Descriptions.Item>
            <Descriptions.Item label="Client">{detailsRecord.client}</Descriptions.Item>
            <Descriptions.Item label="Project Name" span={2}>
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

export default BGV;