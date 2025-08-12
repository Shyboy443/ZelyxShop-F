import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Alert,
  Chip,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Grid,
  Divider,
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  Phone as PhoneIcon,
  AccountBalance as BankIcon,
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { toast } from "react-hot-toast";
import api from "../api/api";

const BankTransferPayment = ({ orderNumber, onReceiptUpload }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expirationTime, setExpirationTime] = useState(null);

  const fetchOrderData = useCallback(async () => {
    try {
      const response = await api.get(`/orders/${orderNumber}`);
      if (response.data.success) {
        const orderData = response.data.data;
        // Check if receipt has already been uploaded
        if (orderData.receipt) {
          setReceiptUploaded(true);
        }
      }
    } catch (error) {
      console.error("Error fetching order data:", error);
    }
  }, [orderNumber]);

  const fetchTimeRemaining = useCallback(async () => {
    try {
      const response = await api.get(`/orders/${orderNumber}/timeout`);
      if (response.data.success) {
        const data = response.data.data;
        setTimeRemaining(data);

        // Store expiration time in localStorage for persistence
        if (data.timeRemainingMs && data.timeRemainingMs > 0) {
          const expTime = Date.now() + data.timeRemainingMs;
          setExpirationTime(expTime);
          localStorage.setItem(
            `order_${orderNumber}_expiration`,
            expTime.toString()
          );
        }
      }
    } catch (error) {
      console.error("Error fetching timeout info:", error);
      // Try to get expiration time from localStorage if API fails
      const storedExpiration = localStorage.getItem(
        `order_${orderNumber}_expiration`
      );
      if (storedExpiration) {
        setExpirationTime(parseInt(storedExpiration));
      }
    }
  }, [orderNumber]);

  const updateLocalTimer = useCallback(() => {
    // Check localStorage first for expiration time
    const storedExpiration = localStorage.getItem(
      `order_${orderNumber}_expiration`
    );
    const expTime =
      expirationTime || (storedExpiration ? parseInt(storedExpiration) : null);

    if (expTime) {
      const now = Date.now();
      const remaining = expTime - now;

      if (remaining <= 0) {
        setTimeRemaining((prev) =>
          prev ? { ...prev, timeRemainingMs: 0, expired: true } : null
        );
        localStorage.removeItem(`order_${orderNumber}_expiration`);
      } else {
        setTimeRemaining((prev) =>
          prev ? { ...prev, timeRemainingMs: remaining, expired: false } : null
        );
      }
    }
  }, [orderNumber, expirationTime]);

  useEffect(() => {
    if (orderNumber) {
      fetchOrderData();
      fetchTimeRemaining();
      const interval = setInterval(updateLocalTimer, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [orderNumber, fetchOrderData, fetchTimeRemaining, updateLocalTimer]);

  const handleReceiptUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setReceiptFile(file);
      toast.success("Receipt selected successfully");
    }
  };

  const uploadReceipt = async () => {
    if (!receiptFile) {
      toast.error("Please select a receipt file first");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", receiptFile);

      const response = await api.post(
        `/payments/upload-receipt/${orderNumber}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        setReceiptUploaded(true);
        toast.success("Receipt uploaded successfully!");
        if (onReceiptUpload) onReceiptUpload();
      }
    } catch (error) {
      toast.error("Failed to upload receipt. Please try again.");
      console.error("Receipt upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return "00:00:00";

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    if (!timeRemaining) return 0;
    const totalTime = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    const remaining = timeRemaining.timeRemainingMs;
    return Math.max(0, Math.min(100, (remaining / totalTime) * 100));
  };

  const isExpired = timeRemaining && timeRemaining.timeRemainingMs <= 0;

  // If receipt is uploaded, show only confirmation message
  if (receiptUploaded) {
    return (
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <CheckIcon sx={{ fontSize: 60, color: "success.main", mb: 2 }} />

            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", mb: 2, color: "success.main" }}
            >
              Receipt Uploaded Successfully!
            </Typography>

            <Typography
              variant="body1"
              sx={{ mb: 3, maxWidth: 600, mx: "auto" }}
            >
              ✅ We are now reviewing your receipt and will confirm your payment
              within <strong>1 hour during working hours</strong>.
            </Typography>

            <Typography variant="body1" sx={{ mb: 3 }}>
              ⏰ <strong>Working Hours:</strong> Monday - Sunday, 9:00 AM -
              11:00 PM (Sri Lanka Time)
            </Typography>

            <Alert severity="info" sx={{ mb: 3, maxWidth: 500, mx: "auto" }}>
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                Please wait for confirmation. You will receive an email
                notification once verified.
              </Typography>
            </Alert>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Need Help?
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Chip
                icon={<PhoneIcon />}
                label="WhatsApp: +94 71 084 6293"
                color="success"
                variant="filled"
                sx={{ fontSize: "1rem", py: 2, px: 1 }}
                onClick={() =>
                  window.open("https://wa.me/94710846293", "_blank")
                }
                clickable
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Contact us on WhatsApp for any issues or questions
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Payment Countdown */}
      {timeRemaining && (
        <Card
          sx={{ mb: 3, bgcolor: isExpired ? "error.light" : "warning.light" }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              <AccessTimeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
              Payment Deadline
            </Typography>

            {isExpired ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                Payment time has expired. This order has been cancelled.
              </Alert>
            ) : (
              <>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "error.main", mb: 2 }}
                >
                  {formatTime(timeRemaining.timeRemainingMs)}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={getProgressPercentage()}
                  sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  color={getProgressPercentage() > 25 ? "primary" : "error"}
                />

                <Alert severity="warning">
                  Please complete your payment within the time limit. Orders not
                  paid within 6 hours will be automatically cancelled.
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bank Details */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: "bold", color: "primary.main" }}
          >
            <BankIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Bank Transfer Details
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                Bank Name:
              </Typography>
              <Typography variant="body1">Commercial Bank Kandy</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                Account Name:
              </Typography>
              <Typography variant="body1">T.M.A.S.B Tennakoon</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                Account Number:
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", color: "primary.main" }}
              >
                8003500657
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                Branch:
              </Typography>
              <Typography variant="body1">Kandy</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              Payment Note Instructions:
            </Typography>
            <Typography variant="body2">
              When making the transfer, please include your{" "}
              <strong>Order Number: {orderNumber}</strong> in the payment
              reference/note field.
            </Typography>
          </Alert>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              icon={<AccessTimeIcon />}
              label="Approval Time: Within 1 hour"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<PhoneIcon />}
              label="Support: +94 77 123 4567"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Receipt Upload */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            <UploadIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Upload Payment Receipt
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            After completing the bank transfer, please upload your payment
            receipt to expedite the verification process.
          </Alert>

          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleReceiptUpload}
              style={{ display: "none" }}
              id="receipt-upload"
            />
            <label htmlFor="receipt-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                sx={{ mr: 2, mb: 1 }}
              >
                Choose Receipt File
              </Button>
            </label>

            {receiptFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {receiptFile.name}
              </Typography>
            )}
          </Box>

          {receiptFile && !receiptUploaded && (
            <Button
              variant="contained"
              onClick={uploadReceipt}
              disabled={uploading}
              startIcon={uploading ? null : <UploadIcon />}
              sx={{ mb: 2 }}
            >
              {uploading ? "Uploading..." : "Upload Receipt"}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default BankTransferPayment;
