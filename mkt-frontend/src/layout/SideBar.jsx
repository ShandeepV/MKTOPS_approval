import { useState } from "react";
import { Layout, Menu } from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  FolderOutlined,
  ProfileOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Sider } = Layout;

export const SIDEBAR_COLLAPSED_WIDTH = 64;
export const SIDEBAR_EXPANDED_WIDTH = 200;

const sideBarList = [
  {
    key: "/access",
    icon: <AppstoreOutlined />,
    label: "Super Admin Access",
    roles: ["super_admin"],
  },
  {
    key: "/admin-access",
    icon: <AppstoreOutlined />,
    label: "Admin Access",
    roles: ["admin"],
  },
  {
    key: "/requests",
    icon: <UnorderedListOutlined />,
    label: "NBL Approval",
    roles: ["admin", "super_admin"],
  },
  {
    key: "/bgv",
    icon: <FolderOutlined />,
    label: "BGV",
    roles: ["admin", "super_admin"],
  },
  {
    key: "/client-list",
    icon: <ProfileOutlined />,
    label: "Client List",
    roles: ["admin", "super_admin"],
  },
  {
    key: "/my-request-rmg",
    icon: <SettingOutlined />,
    label: "My Request",
    roles: ["tmg"],
  },
  {
    key: "/my-request-finance",
    icon: <SettingOutlined />,
    label: "My Request",
    roles: ["finance"],
  },
  {
    key: "/my-requests",
    icon: <UnorderedListOutlined />,
    label: "My Requests",
    roles: ["user"],
  },
  {
    key: "/my-bgv",
    icon: <FolderOutlined />,
    label: "BGV Approval",
    roles: ["market_leader"],
  },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const userData = JSON.parse(localStorage.getItem("user_info") || "null");
  const role = userData?.role;

  const filteredMenu = sideBarList.filter((item) => item.roles.includes(role));

  return (
    <Sider
      width={expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH}
      collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
      collapsed={!expanded}
      trigger={null}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        overflow: "hidden",
        zIndex: 1000,
        transition: "width 0.25s ease",
        boxShadow: "2px 0 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "flex-start" : "center",
          paddingLeft: expanded ? 24 : 0,
          color: "#222",
          fontSize: 18,
          fontWeight: "bold",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {expanded ? "Admin Panel" : "AP"}
      </div>

      <Menu
        mode="inline"
        inlineCollapsed={!expanded}
        selectedKeys={[location.pathname]}
        items={filteredMenu}
        onClick={({ key }) => navigate(key)}
        style={{ border: "none" }}
      />
    </Sider>
  );
}

export default Sidebar;