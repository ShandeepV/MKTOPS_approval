import React, { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, Tooltip, message } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../AxiosInstance";

const Users = () => {
  const [userList, setUserList] = useState([]);

  const navigate = useNavigate();

  const handleEdit = (record) => {
    navigate("/add-rmg-user", { state: { tmg_info: record } });
  };

  const handleDelete = async (record) => {
    try {
      await axiosInstance.post("/delete-user", { id: record?._id });

      message.success("Deleted Successfully");
      handleGetList();
    } catch (error) {
      message.error("Failed to delete");
    }
  };

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
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit">
            <EditOutlined
              style={{ color: "#faad14", cursor: "pointer", fontSize: "20px" }}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure to delete?"
              onConfirm={() => handleDelete(record)}
            >
              <DeleteOutlined
                style={{
                  color: "#ff4d4f",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleGetList = async () => {
    try {
      let users = await axiosInstance.post("/get-user", { role: "user" });
      setUserList([]);
    } catch (error) {
      console.log(error);
      message.error("Failed to load");
    }
  };

  useEffect(() => {
    handleGetList();
  }, []);

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>Request Users</h3>

        <Button type="primary" onClick={() => navigate("/add-rmg-user")}>
          + Add New User
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={userList}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Users;
