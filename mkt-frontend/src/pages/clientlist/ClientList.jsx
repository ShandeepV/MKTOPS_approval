import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Table,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import axiosInstance from "../../AxiosInstance";

const ClientList = () => {
  const [form] = Form.useForm();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/get-clients");
      setClients(response.data?.data || []);
    } catch {
      message.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const addClient = async ({ name }) => {
    setSaving(true);
    try {
      await axiosInstance.post("/create-client", { name });
      form.resetFields();
      message.success("Client added");
      loadClients();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to add client");
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async (client) => {
    try {
      await axiosInstance.post("/delete-client", { id: client._id });
      message.success("Client deleted");
      loadClients();
    } catch {
      message.error("Failed to delete client");
    }
  };

  const columns = [
    { title: "Client Name", dataIndex: "name" },
    {
      title: "Actions",
      width: 90,
      render: (_, client) => (
        <Popconfirm
          title={`Delete ${client.name}?`}
          onConfirm={() => deleteClient(client)}
        >
          <Button danger icon={<DeleteOutlined />} aria-label="Delete client" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title="Client Names" style={{ marginTop: 10 }}>
      <Form
        form={form}
        layout="inline"
        onFinish={addClient}
        style={{ marginBottom: 16, gap: 8 }}
      >
        <Form.Item
          name="name"
          rules={[{ required: true, whitespace: true, message: "Enter a client name" }]}
        >
          <Input placeholder="Client name" maxLength={100} />
        </Form.Item>
        <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={saving}>
          Add Client
        </Button>
      </Form>
      <Table
        columns={columns}
        dataSource={clients}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default ClientList;