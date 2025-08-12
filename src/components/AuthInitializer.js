import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  checkAuthStatus,
  selectAuthInitialized,
} from "../store/slices/authSlice";
import { setGlobalLoading } from "../store/slices/uiSlice";
import { Box, CircularProgress, Typography } from "@mui/material";

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const initialized = useSelector(selectAuthInitialized);

  useEffect(() => {
    dispatch(setGlobalLoading(true));
    dispatch(checkAuthStatus()).finally(() => {
      dispatch(setGlobalLoading(false));
    });
  }, [dispatch]);

  if (!initialized) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Initializing application...
        </Typography>
      </Box>
    );
  }

  return children;
};

export default AuthInitializer;
