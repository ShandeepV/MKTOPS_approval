import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import ReportList from "./pages/finance/FinanceUsers";
import Settings from "./pages/settings/Settings";
import Login from "./pages/login/Login";
import LoginLayout from "./pages/login/LoginLayout";
import AddRequest from "./pages/requests/AddRequest";
import RequestList from "./pages/requests/RequestList";
import AppLayout from "./layout/AppLayout";
import TMGUsers from "./pages/tmg/TMGUsers";
import FinanceUsers from "./pages/finance/FinanceUsers";
import AddTMG from "./pages/tmg/AddTMG";
import AddFinance from "./pages/finance/AddFinance";
import MyRequestTmg from "./pages/myrequesttmg/MyRequestTmg";
import MyRequestFinance from "./pages/myrequestfinance/MyRequestFinance";
import Users from "./pages/users/Users";
import Access from "./pages/access/Access";
import AdminAccess from "./pages/access/AdminAccess";
import BGV from "./pages/bgv/BGV";
import ClientList from "./pages/clientlist/ClientList";
import MarketLeaderBGV from "./pages/marketleader/MarketLeaderBGV";
import MyRequestUser from "./pages/myrequestuser/MyRequestUser";

// Sends a logged-in user who hit a route that isn't theirs to their own
// home page instead of bouncing them out to /login.
const homeForRole = (role) => {
  if (role === "super_admin") return "/access";
  if (role === "admin") return "/admin-access";
  if (role === "tmg") return "/my-request-rmg";
  if (role === "finance") return "/my-request-finance";
  if (role === "market_leader") return "/my-bgv";
  if (role === "user") return "/my-requests";
  return "/login";
};

const TmgProtectRoute = () => {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;
  if (!role || role !== "tmg") {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <Outlet />;
};
const FinanceProtectRoute = () => {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;
  if (!role || role !== "finance") {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <Outlet />;
};
const MarketLeaderProtectRoute = () => {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;
  if (!role || role !== "market_leader") {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <Outlet />;
};
const AdminProtectRoute = () => {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;
  if (!role || role !== "admin") {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <Outlet />;
};
const AdminOrSuperAdminProtectRoute = () => {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;
  if (role !== "admin" && role !== "super_admin") {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <Outlet />;
};
const SuperAdminProtectRoute = () => {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  if (userData?.role !== "super_admin") {
    return <Navigate to={homeForRole(userData?.role)} replace />;
  }
  return <Outlet />;
};
const UserProtectRoute = () => {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;
  if (!role || role !== "user") {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <Outlet />;
};

const RootRedirect = () => {
  let userData = JSON.parse(localStorage.getItem("user_info"));
  const role = userData?.role;

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role === "super_admin") {
    return <Navigate to="/access" replace />;
  }

  if (role === "admin") return <Navigate to="/admin-access" replace />;

  if (role === "tmg") {
    return <Navigate to="/my-request-rmg" replace />;
  }

  if (role === "finance") {
    return <Navigate to="/my-request-finance" replace />;
  }

  if (role === "market_leader") {
    return <Navigate to="/my-bgv" replace />;
  }

  if (role === "user") {
    return <Navigate to="/my-requests" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route element={<AppLayout />}>
        <Route element={<AdminOrSuperAdminProtectRoute />}>
          <Route path="/bgv" element={<BGV />} />
          <Route path="/requests" element={<RequestList />} />
          <Route path="/client-list" element={<ClientList />} />
        </Route>
        <Route element={<SuperAdminProtectRoute />}>
          <Route path="/access" element={<Access allowAdminCreation />} />
          <Route path="/add-request" element={<AddRequest />} />
        </Route>
        <Route element={<AdminProtectRoute />}>
          <Route path="/admin-access" element={<AdminAccess />} />
          <Route path="/add-request" element={<AddRequest />} />
          <Route path="/rmg-users" element={<TMGUsers />} />
          <Route path="/add-rmg-user" element={<AddTMG />} />
          <Route path="/finance-users" element={<FinanceUsers />} />
          <Route path="/add-finance-user" element={<AddFinance />} />
          <Route path="/request-user" element={<Users />} />
        </Route>
        <Route element={<TmgProtectRoute />}>
          <Route path="/my-request-rmg" element={<MyRequestTmg />} />
        </Route>
        <Route element={<FinanceProtectRoute />}>
          <Route path="/my-request-finance" element={<MyRequestFinance />} />
        </Route>
        <Route element={<MarketLeaderProtectRoute />}>
          <Route path="/my-bgv" element={<MarketLeaderBGV />} />
        </Route>
        <Route element={<UserProtectRoute />}>
          <Route path="/my-requests" element={<MyRequestUser />} />
          <Route path="/my-add-request" element={<AddRequest />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;