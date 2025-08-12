import React from "react";
import {
  Backdrop,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import { selectGlobalLoading } from "../store/slices/uiSlice";
import { useTheme } from "@mui/material/styles";

const GlobalLoading = () => {
  const loading = useSelector(selectGlobalLoading);
  const theme = useTheme();

  if (!loading.isLoading) return null;

  return (
    <Backdrop
      sx={{
        color: theme.palette.primary.contrastText,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backdropFilter: "blur(3px)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
      }}
      open={true}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.primary.contrastText,
            fontWeight: 500,
          }}
        >
          {loading.message || "Loading..."}
        </Typography>
      </Box>
    </Backdrop>
  );
};

export default GlobalLoading;
