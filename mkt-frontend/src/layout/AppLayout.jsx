import { Layout } from "antd";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar, { SIDEBAR_COLLAPSED_WIDTH } from "./SideBar";
import Header from "./Header";

const { Content } = Layout;

function AppLayout() {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;
  const location = useLocation();

  const showSidebar = ["admin", "super_admin", "finance"].includes(role);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {showSidebar && <Sidebar />}

      {/* Right Section */}
      <Layout
        style={{
          marginLeft: showSidebar ? SIDEBAR_COLLAPSED_WIDTH : 0,
          minWidth: 0,
        }}
      >
        {/* Header (always visible) */}
        <Header />

        <Content
          style={{
            margin: "10px",
            padding: "5px",
            background: "#f5f5f5",
            borderRadius: "12px",
            minHeight: "calc(100vh - 80px)",
            overflowY: "auto",
          }}
        >
          {/* Keying by pathname re-triggers the fade-in animation (see
              index.css .page-transition) on every navigation */}
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;