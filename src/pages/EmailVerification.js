import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Container,
} from "@mui/material";
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationData, setVerificationData] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    orderNumber: "",
    email: "",
    verificationCode: "",
    verificationMethod: "otp",
  });

  const steps = [
    "Enter Order Details",
    "Choose Verification Method",
    "Verify Email",
  ];

  useEffect(() => {
    // If token is provided in URL, verify automatically
    if (token) {
      verifyWithToken();
    }
  }, [token]);

  const verifyWithToken = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/email-verification/verify-link/${token}`
      );
      const data = await response.json();

      if (data.success) {
        setSuccess("Email verification successful!");
        setVerificationData(data.data);
        setActiveStep(3); // Skip to success step
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to verify email with link");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/email-verification/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: formData.orderNumber,
          email: formData.email,
          verificationMethod: formData.verificationMethod,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(
          `Verification ${formData.verificationMethod} sent to your email`
        );
        setVerificationData(data.data);
        if (formData.verificationMethod === "otp") {
          setActiveStep(2); // Go to OTP input step
        } else {
          setActiveStep(3); // Go to success step for link method
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to request verification");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/email-verification/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: formData.orderNumber,
          email: formData.email,
          verificationCode: formData.verificationCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Email verification successful!");
        setVerificationData(data.data);
        setActiveStep(3); // Go to success step
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch(
        `/api/email-verification/status/${
          formData.orderNumber
        }?email=${encodeURIComponent(formData.email)}`
      );

      const data = await response.json();
      if (data.success && data.data.verified) {
        setSuccess("Email is already verified!");
        setVerificationData(data.data);
        setActiveStep(3);
      }
    } catch (err) {
      // Ignore errors for status check
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Check if order exists and email matches
      checkVerificationStatus();
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError("");
    setSuccess("");
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      orderNumber: "",
      email: "",
      verificationCode: "",
      verificationMethod: "otp",
    });
    setError("");
    setSuccess("");
    setVerificationData(null);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            <Typography variant="h6" gutterBottom>
              Enter Your Order Information
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Please provide your order number and email address to verify your
              order.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Order Number"
                  value={formData.orderNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, orderNumber: e.target.value })
                  }
                  required
                  placeholder="e.g., ORD-123456"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="your.email@example.com"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!formData.orderNumber || !formData.email}
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box component="form" onSubmit={handleRequestVerification}>
            <Typography variant="h6" gutterBottom>
              Choose Verification Method
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              How would you like to receive your verification?
            </Typography>

            <FormControl component="fieldset">
              <FormLabel component="legend">Verification Method</FormLabel>
              <RadioGroup
                value={formData.verificationMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    verificationMethod: e.target.value,
                  })
                }
              >
                <FormControlLabel
                  value="otp"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Email Code (OTP)</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Receive a 6-digit code via email that you'll enter on
                        the next step
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="link"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Email Link</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Receive a verification link via email that you can click
                        to verify
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Box
              sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}
            >
              <Button onClick={handleBack}>Back</Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : "Send Verification"}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box component="form" onSubmit={handleVerifyCode}>
            <Typography variant="h6" gutterBottom>
              Enter Verification Code
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              We've sent a 6-digit verification code to {formData.email}. Please
              enter it below.
            </Typography>

            <TextField
              fullWidth
              label="Verification Code"
              value={formData.verificationCode}
              onChange={(e) =>
                setFormData({ ...formData, verificationCode: e.target.value })
              }
              required
              placeholder="123456"
              inputProps={{
                maxLength: 6,
                pattern: "[0-9]{6}",
                style: {
                  textAlign: "center",
                  fontSize: "1.5rem",
                  letterSpacing: "0.5rem",
                },
              }}
              sx={{ mb: 3 }}
            />

            <Alert severity="info" sx={{ mb: 3 }}>
              The verification code will expire in 15 minutes. If you don't
              receive it, please check your spam folder or go back to request a
              new one.
            </Alert>

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button onClick={handleBack}>Back</Button>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  onClick={() => {
                    setActiveStep(1);
                    setFormData({ ...formData, verificationCode: "" });
                  }}
                  variant="outlined"
                >
                  Resend Code
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={formData.verificationCode.length !== 6 || loading}
                >
                  {loading ? <CircularProgress size={20} /> : "Verify"}
                </Button>
              </Box>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: "center" }}>
            <CheckCircleIcon
              sx={{ fontSize: 80, color: "success.main", mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              Email Verification Successful!
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Your email has been verified successfully for order{" "}
              {verificationData?.orderNumber}.
            </Typography>

            {verificationData && (
              <Paper sx={{ p: 2, mb: 3, backgroundColor: "success.50" }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Order Number
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {verificationData.orderNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Payment Status
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {verificationData.paymentStatus}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Verified At
                    </Typography>
                    <Typography variant="body1">
                      {new Date(verificationData.verifiedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button variant="outlined" onClick={handleReset}>
                Verify Another Order
              </Button>
              <Button variant="contained" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  if (token && loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6">Verifying your email...</Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <VerifiedIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                Email Verification
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Verify your email address to confirm your order
              </Typography>
            </Box>
          </Box>

          {!token && (
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {renderStepContent(activeStep)}
        </CardContent>
      </Card>
    </Container>
  );
};

export default EmailVerification;
