import React from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import axiosInstance from "../../AxiosInstance";
import Logo from "../../assets/ascendion-logo.webp";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      // Clear any old/stale login session before starting a new login
      localStorage.removeItem("user_info");

      const payload = {
        email: values.email.trim(),
        password: values.password,
      };

      const resp = await axiosInstance.post("/login", payload);

      const userData = resp.data?.data;

      // Make sure the backend returned a valid user
      if (!userData || !userData.role) {
        message.error("Login response is invalid. Please contact an admin.");
        return;
      }

      // Save the complete authenticated user data
      localStorage.setItem("user_info", JSON.stringify(userData));

      // Redirect according to role
      switch (userData.role) {
        case "super_admin":
          navigate("/access", { replace: true });
          break;

        case "admin":
          navigate("/admin-access", { replace: true });
          break;

        case "tmg":
          navigate("/my-request-rmg", { replace: true });
          break;

        case "finance":
          navigate("/my-request-finance", { replace: true });
          break;

        case "market_leader":
          navigate("/my-bgv", { replace: true });
          break;

        case "user":
          navigate("/my-requests", { replace: true });
          break;

        default:
          localStorage.removeItem("user_info");
          message.error(
            "Your account has no valid role assigned. Contact an admin."
          );
      }
    } catch (error) {
      console.error("Login error:", error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to login. Please check your email and password.";

      message.error(errorMessage);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        background:
          "linear-gradient(120deg, #0f172a, #1e3a8a, #1677ff)",
      }}
    >
      {/* Left Side Branding */}
      <div
        style={{
          flex: 1,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <img
          src={Logo}
          width="250px"
          style={{ marginTop: "-100px" }}
          alt="Ascendion Logo"
        />

        <Title
          style={{
            color: "#fff",
            fontSize: 40,
            marginBottom: 10,
            marginTop: 50,
          }}
        >
          Welcome Back 👋
        </Title>

        <Text style={{ color: "#cbd5f5", fontSize: 16 }}>
          Manage your requests, approvals, and workflows in one place.
        </Text>

        <div style={{ marginTop: 40 }}>
          <ul style={{ lineHeight: "2", color: "#e0e7ff" }}>
            <li>✔ Track Requests</li>
            <li>✔ Approval Workflow</li>
            <li>✔ Reports & Insights</li>
          </ul>
        </div>
      </div>

      {/* Right Side Login Card */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        <Card
          style={{
            width: 380,
            borderRadius: 16,
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <Title
            level={3}
            style={{
              textAlign: "center",
              color: "#fff",
              marginBottom: 24,
            }}
          >
            Login
          </Title>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: "Enter email",
                },
                {
                  type: "email",
                  message: "Invalid email",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email"
                size="large"
                style={{
                  background: "rgba(255,247,247)",
                  border: "none",
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: "Enter password",
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
                style={{
                  background: "rgba(255,247,247)",
                  border: "none",
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                style={{
                  height: 45,
                  borderRadius: 8,
                  background: "#FFC83D",
                  border: "none",
                  fontWeight: 600,
                  color: "black",
                }}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default Login;