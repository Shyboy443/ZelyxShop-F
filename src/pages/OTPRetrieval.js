import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";

// Utility function to format timestamps
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const OTPRetrieval = () => {
  const [searchParams] = useSearchParams();
  const [accessToken, setAccessToken] = useState(
    searchParams.get("token") || ""
  );
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [otpResult, setOtpResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (accessToken) {
      fetchTokenInfo();
    }
  }, [accessToken]);

  const fetchTokenInfo = async () => {
    try {
      setError("");
      const response = await fetch(
        `/api/otp/token-info?accessToken=${accessToken}`
      );
      const data = await response.json();

      if (data.success) {
        setTokenInfo(data.data);
        if (data.data.isExpired || !data.data.isActive) {
          setError("Access token is expired or inactive");
        }
      } else {
        setError(data.message);
        setTokenInfo(null);
      }
    } catch (err) {
      setError("Failed to fetch token information");
      setTokenInfo(null);
    }
  };

  const handleGetOTP = async () => {
    if (!accessToken || !email) {
      setError("Please provide both access token and email");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setOtpResult(null);

    try {
      const response = await fetch("/api/otp/get-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpResult(data.data);
        setSuccess("OTP retrieved successfully!");
        // Refresh token info to show updated usage
        fetchTokenInfo();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to retrieve OTP");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess("OTP copied to clipboard!");
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Box sx={{ maxWidth: 1000, mx: "auto", px: 2 }}>
        <Typography variant="h4" gutterBottom align="center" color="primary">
          OTP Retrieval Service
        </Typography>

        <Typography
          variant="body1"
          align="center"
          color="textSecondary"
          sx={{ mb: 4 }}
        >
          Retrieve OTP codes from your email
        </Typography>
        {/* Token Information Card */}
        {tokenInfo && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <InfoIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Access Token Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Usage: {tokenInfo.usageCount} / {tokenInfo.usageLimit}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    Remaining Uses: {tokenInfo.remainingUses}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Chip
                    label={tokenInfo.isActive ? "Active" : "Inactive"}
                    color={tokenInfo.isActive ? "success" : "error"}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Chip
                    label={tokenInfo.isExpired ? "Expired" : "Valid"}
                    color={tokenInfo.isExpired ? "error" : "success"}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Expires: {formatTimestamp(tokenInfo.expiresAt)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Main OTP Retrieval Card */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Retrieve OTP Code
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Access Token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter your access token"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Refresh token info">
                      <IconButton
                        onClick={fetchTokenInfo}
                        disabled={!accessToken}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the email address to search for OTP"
                type="email"
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleGetOTP}
                disabled={
                  loading ||
                  !accessToken ||
                  !email ||
                  (tokenInfo &&
                    (tokenInfo.isExpired ||
                      !tokenInfo.isActive ||
                      tokenInfo.remainingUses <= 0))
                }
                sx={{ py: 1.5 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Searching for OTP...
                  </>
                ) : (
                  "Get OTP"
                )}
              </Button>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {/* OTP Result */}
            {otpResult && (
              <Paper
                sx={{
                  p: 3,
                  bgcolor: "success.light",
                  color: "success.contrastText",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  OTP Found!
                </Typography>

                <Divider
                  sx={{ my: 2, bgcolor: "success.contrastText", opacity: 0.3 }}
                />

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography
                      variant="h4"
                      sx={{ fontFamily: "monospace", letterSpacing: 2 }}
                    >
                      {otpResult.otp}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="inherit"
                      startIcon={<CopyIcon />}
                      onClick={() => copyToClipboard(otpResult.otp)}
                      sx={{ color: "success.main" }}
                    >
                      Copy OTP
                    </Button>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Service:</strong> {otpResult.service}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Retrieved at:</strong>{" "}
                    {formatTimestamp(otpResult.timestamp)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Remaining uses:</strong> {otpResult.remainingUses}
                  </Typography>
                </Box>
              </Paper>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How to Use
            </Typography>
            <Typography variant="body2" paragraph>
              1. Enter your access token (provided after purchase)
            </Typography>
            <Typography variant="body2" paragraph>
              2. Enter the email address you want to retrieve OTP for
            </Typography>
            <Typography variant="body2" paragraph>
              3. Click "Get OTP" to search for recent OTP codes
            </Typography>

            <Typography variant="body2" color="warning.main">
              <strong>Note:</strong> Each access token has a limited number of
              uses.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default OTPRetrieval;
