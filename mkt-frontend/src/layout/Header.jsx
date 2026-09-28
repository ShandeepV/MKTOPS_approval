import { Layout, Typography, Avatar, Space, Modal, message } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

function Header() {
  const navigate = useNavigate();
  let userData = JSON.parse(localStorage.getItem("user_info"));

  const getGreeting = () => {
    // const hour = new Date().getHours();
    // if (hour < 12) return "Good Morning";
    // if (hour < 18) return "Good Afternoon";
    // return "Good Evening";
    const role = userData?.role;

    if (role === "super_admin") return "SUPER ADMIN ACCESS";
    if (role === "admin") return "ADMIN ACCESS";
    if (role === "user") return "REQUESTOR VIEW";

    // Keep the persisted role key stable while showing the RMG brand.
    if (role === "tmg") return "RMG View";

    // "market_leader" -> "MARKET LEADER View"
    const roleLabel = role?.replace(/_/g, " ").toUpperCase();
    return roleLabel ? `${roleLabel} View` : "List";
  };

  // ✅ Full page confirm
  const showLogoutConfirm = () => {
    Modal.confirm({
      title: "Confirm Logout",
      content: "Are you sure you want to logout?",
      okText: "Yes, Logout",
      cancelText: "Cancel",
      centered: true,
      okButtonProps: { danger: true },
      onOk() {
        localStorage.removeItem("user_info");

        message.success("Logged out successfully");
        navigate("/login");
      },
    });
  };

  return (
    <AntHeader
      style={{
        background: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Left */}
      <Text strong style={{ fontSize: 18, textTransform: "capitalize" }}>
        {getGreeting()}
      </Text>

      {/* Right */}
      <Space size="large" align="center">
        <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />

        <Space size="small" align="center">
          <Avatar
            style={{ backgroundColor: "#1677ff" }}
            size={30}
            icon={<UserOutlined />}
          />
          <Text>{userData?.name}</Text>
        </Space>

        {/* ✅ Logout Icon */}
        <LogoutOutlined
          onClick={showLogoutConfirm}
          style={{
            fontSize: 20,
            cursor: "pointer",
            color: "#ff4d4f",
          }}
        />
      </Space>
    </AntHeader>
  );
}

export default Header;