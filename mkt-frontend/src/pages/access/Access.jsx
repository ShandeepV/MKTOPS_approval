import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
  message,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axiosInstance from "../../AxiosInstance";

const { Option } = Select;

// Label shown in the UI  ->  role value stored in the DB / used for routing
const ROLE_OPTIONS = [
  { label: "RMG", value: "tmg", color: "blue" },
  { label: "Finance", value: "finance", color: "green" },
  { label: "Request User", value: "user", color: "gold" },
  { label: "Market Leader", value: "market_leader", color: "purple" },
  { label: "Admin", value: "admin", color: "red" },
];

const roleMeta = (value) =>
  ROLE_OPTIONS.find((r) => r.value === value) || {
    label: value || "Unknown",
    color: "default",
  };

const Access = ({ allowAdminCreation = false }) => {
  const availableRoleOptions = allowAdminCreation
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((option) => option.value !== "admin");
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const handleGetList = async () => {
    setLoading(true);
    try {
      // "all" tells the backend to return every user, regardless of role
      const res = await axiosInstance.post("/get-user", { role: "all" });
      setUsers(res.data?.data || []);
    } catch (error) {
      console.log(error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGetList();
  }, []);

  const handleRefresh = () => {
    setSearchText("");
    setRoleFilter("all");
    handleGetList();
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (editingId) {
        await axiosInstance.post("/update-user", {
          id: editingId,
          name: values.name,
          email: values.email,
          password: values.password || undefined,
          role: values.role,
        });
        message.success("User updated successfully");
      } else {
        await axiosInstance.post("/create-user", {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        });
        message.success("User added successfully");
      }

      form.resetFields();
      setEditingId(null);
      handleGetList();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      password: "",
      role: record.role,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.resetFields();
  };

  const handleDelete = async (record) => {
    try {
      await axiosInstance.post("/delete-user", { id: record._id });
      message.success("Deleted successfully");
      handleGetList();
    } catch {
      message.error("Failed to delete");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const roleMatch = roleFilter === "all" || u.role === roleFilter;
      const search = searchText.trim().toLowerCase();
      const searchMatch =
        !search ||
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search);
      return roleMatch && searchMatch;
    });
  }, [users, searchText, roleFilter]);

  const columns = [
    {
      title: "ID",
      key: "id",
      width: 80,
      render: (_, __, index) => <span>{index + 1}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const meta = roleMeta(role);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 14 }}>
          <Tooltip title="Edit">
            <EditOutlined
              style={{ color: "#faad14", cursor: "pointer", fontSize: 18 }}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDelete(record)}
            >
              <DeleteOutlined
                style={{ color: "#ff4d4f", cursor: "pointer", fontSize: 18 }}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 10 }}>
      <Card
        title={editingId ? "Edit User" : "Add User"}
        style={{ borderRadius: 12, marginBottom: 20 }}
        extra={
          editingId ? (
            <Button size="small" onClick={handleCancelEdit}>
              Cancel Edit
            </Button>
          ) : null
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Invalid email" },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: !editingId,
                    message: "Password is required",
                  },
                ]}
              >
                <Input.Password
                  placeholder={
                    editingId ? "Leave blank to keep unchanged" : "Enter password"
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: "Select role" }]}
              >
                <Select placeholder="Select role">
                  {availableRoleOptions.map((r) => (
                    <Option key={r.value} value={r.value}>
                      {r.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col
              xs={24}
              md={2}
              style={{ display: "flex", alignItems: "flex-start" }}
            >
              <Form.Item label={<span>&nbsp;</span>}>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {editingId ? "Update" : "Submit"}
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          Refresh
        </Button>
        <Input
          placeholder="Search by name or email"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select
          value={roleFilter}
          onChange={setRoleFilter}
          style={{ width: 180 }}
        >
          <Option value="all">All Roles</Option>
          {availableRoleOptions.map((r) => (
            <Option key={r.value} value={r.value}>
              {r.label}
            </Option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="_id"
        bordered
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Access;
