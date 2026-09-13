import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
   * =========================================
   * FETCH CURRENT USER
   * =========================================
   */

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(
        "/users/me",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const currentUser =
        response.data?.user;

      if (!currentUser) {
        throw new Error(
          "User data not returned"
        );
      }

      setUser(currentUser);

      localStorage.setItem(
        "user",
        JSON.stringify(currentUser)
      );

    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error
      );

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);

    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================================
   * INITIAL AUTH CHECK
   * =========================================
   */

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  /*
   * =========================================
   * LOGIN / REGISTER SESSION
   * =========================================
   *
   * Login/Register ke baad ye function
   * Context ko immediately update karega.
   */

  const setAuthenticatedUser = (
    token,
    authenticatedUser
  ) => {
    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(
        authenticatedUser
      )
    );

    setUser(authenticatedUser);
  };

  /*
   * =========================================
   * LOGOUT
   * =========================================
   */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        setAuthenticatedUser,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}