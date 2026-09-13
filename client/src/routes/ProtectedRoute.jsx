import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {

  const {
    user,
    loading
  } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0B1020",
          color: "#94A3B8",
          fontFamily: "Inter, sans-serif"
        }}
      >
        <div
          style={{
            textAlign: "center"
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              border: "3px solid #2A3248",
              borderTopColor: "#7C3AED",
              borderRadius: "50%",
              margin: "0 auto 15px",
              animation:
                "spin 0.8s linear infinite"
            }}
          />

          <div>
            Loading SyncCode...
          </div>

          <style>
            {`
              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;