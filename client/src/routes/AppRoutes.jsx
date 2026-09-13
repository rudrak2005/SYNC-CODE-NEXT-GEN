import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import Home from "../pages/Home/Home";
import Loading from "../pages/Loading/Loading";

import Room from "../pages/Room/Room";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import Dashboard from "../pages/Dashboard/Dashboard";
import CreateProject from "../pages/CreateProject/CreateProject";
import JoinRoom from "../pages/JoinRoom/JoinRoom";
import Editor from "../pages/Editor/Editor";

import ProtectedRoute from "./ProtectedRoute";


function Startup() {

  const [showLoading, setShowLoading] =
    useState(true);

  useEffect(() => {

    const timer =
      setTimeout(() => {
        setShowLoading(false);
      }, 1800);

    return () => {
      clearTimeout(timer);
    };

  }, []);

  if (showLoading) {
    return <Loading />;
  }

  return <Home />;
}


function AppRoutes() {

  return (
    <BrowserRouter>

      <Routes>

        {/* ===============================
            STARTUP
        =============================== */}

        <Route
          path="/"
          element={<Startup />}
        />


        {/* ===============================
            AUTH
        =============================== */}

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


        {/* ===============================
            ROOM
        =============================== */}

        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <Room />
            </ProtectedRoute>
          }
        />


        <Route
          path="/room/:roomId/editor"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />


        {/* ===============================
            DASHBOARD
        =============================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* ===============================
            CREATE PROJECT
        =============================== */}

        <Route
          path="/create-project"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />


        {/* ===============================
            JOIN ROOM
        =============================== */}

        <Route
          path="/join-room"
          element={
            <ProtectedRoute>
              <JoinRoom />
            </ProtectedRoute>
          }
        />


        {/* ===============================
            FALLBACK
        =============================== */}

        <Route
          path="*"
          element={<Startup />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default AppRoutes;