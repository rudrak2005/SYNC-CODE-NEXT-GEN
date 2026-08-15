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

  const [loading, setLoading] =
    useState(true);


  const fetchCurrentUser = async () => {

    const token =
      localStorage.getItem("token");

    if (!token) {
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


      setUser(
        response.data.user
      );


      localStorage.setItem(
        "user",
        JSON.stringify(
          response.data.user
        )
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


  useEffect(() => {

    fetchCurrentUser();

  }, []);


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
        logout
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