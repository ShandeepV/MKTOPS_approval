import React, { useEffect } from "react";
import { Card, Form, Input, Button, Row, Col, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../AxiosInstance";

const AddFinance = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const finance_info = useLocation().state?.finance_info;
  console.log(finance_info);
  const onFinish = async (values) => {
    try {
      let payload = { ...values, role: "finance" };
      if (finance_info?._id) {
        payload["id"] = finance_info?._id;
      }
      if (finance_info?._id) {
        if (values.password === finance_info.password) {
          delete payload["password"];
        }
        await axiosInstance.post("/update-user", payload);
        message.success("User updated successfully");
      } else {
        await axiosInstance.post("/create-user", payload);
        message.success("User added successfully");
      }

      form.resetFields();
      navigate("/finance-users");
    } catch (err) {
      message.error("Something went wrong");
    }
  };

  useEffect(() => {
    if (finance_info?._id) {
      form.setFieldsValue({
        name: finance_info?.name,
        email: finance_info?.email,
        password: finance_info?.password,
      });
    }
  }, [finance_info]);

  return (
    <div style={{ padding: 20 }}>
      <Card
        title="Add Finance User"
        style={{
          maxWidth: 600,
          margin: "auto",
          borderRadius: 12,
        }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            {/* Name */}
            <Col span={24}>
              <Form.Item
                label="Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter name" },
                  {
                    pattern: /^[A-Za-z ]+$/,
                    message: "Only alphabets allowed",
                  },
                ]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>
            </Col>

            {/* Email */}
            <Col span={24}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Invalid email" },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: "Please enter password" }]}
              >
                <Input placeholder="Enter password" />
              </Form.Item>
            </Col>
          </Row>

          {/* Buttons */}
          <Row justify="end" gutter={10}>
            <Col>
              <Button onClick={() => navigate("/finance-users")}>Cancel</Button>
            </Col>

            <Col>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default AddFinance;
