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
  Upload,
} from "antd";
import { DeleteOutlined, FileExcelOutlined, PlusOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import axiosInstance from "../../AxiosInstance";

const ClientList = () => {
  const [form] = Form.useForm();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const importClients = async (file) => {
    setImporting(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        message.error("The spreadsheet has no worksheets");
        return false;
      }

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
      const headerIndex = (rows[0] || []).findIndex((cell) =>
        ["client name", "name"].includes(String(cell).trim().toLowerCase()),
      );
      const columnIndex = headerIndex >= 0 ? headerIndex : 0;
      const names = rows
        .slice(headerIndex >= 0 ? 1 : 0)
        .map((row) => String(row[columnIndex] ?? "").trim())
        .filter(Boolean);

      if (names.length === 0) {
        message.error("No client names found in the first worksheet");
        return false;
      }
      if (names.length > 1000) {
        message.error("Import is limited to 1000 client names");
        return false;
      }

      const response = await axiosInstance.post("/bulk-create-clients", { names });
      const { created = 0, duplicates = 0, ignored = 0 } = response.data?.data || {};
      message.success(`${created} clients added; ${duplicates} duplicates and ${ignored} blank rows skipped`);
      await loadClients();
    } catch (error) {
      message.error(error.response?.data?.message || "Failed to import clients");
    } finally {
      setImporting(false);
    }
    return false;
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
        <Upload
          accept=".xlsx,.xls"
          beforeUpload={(file) => {
            void importClients(file);
            return false;
          }}
          disabled={importing}
          showUploadList={false}
        >
          <Button icon={<FileExcelOutlined />} loading={importing}>
            Import Excel
          </Button>
        </Upload>
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