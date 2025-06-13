import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

const AuthGaurd = () => {
  const { authToken } = useAuth();

  return authToken() ? <Outlet /> : <Navigate to="/auth" replace />;
};

export default AuthGaurd;
