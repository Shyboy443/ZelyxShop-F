import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { checkAuthStatus } from "../store/slices/authSlice";
import { CircularProgress, Box } from "@mui/material";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, initialized } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (!initialized) {
      dispatch(checkAuthStatus());
    }
  }, [dispatch, initialized]);

  // Show loading spinner while checking authentication
  if (!initialized || loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
