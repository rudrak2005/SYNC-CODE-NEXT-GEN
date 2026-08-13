import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import CreateProject from "../pages/CreateProject/CreateProject";
import JoinRoom from "../pages/JoinRoom/JoinRoom";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import Dashboard from "../pages/Dashboard/Dashboard";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
        <Route
  path="/create-project"
  element={<CreateProject />}
/>

<Route
  path="/join-room"
  element={<JoinRoom />}
/>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;