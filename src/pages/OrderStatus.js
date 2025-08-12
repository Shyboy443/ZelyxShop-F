import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Phone as PhoneIcon,
  HourglassEmpty as PendingIcon,
  Payment as PaymentIcon,
  Build as ProcessingIcon,
  LocalShipping as DeliveredIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/api";
import { toast } from "react-hot-toast";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const OrderStatus = () => {
  const navigate = useNavigate();
  const { orderNumber } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [appealFile, setAppealFile] = useState(null);
  const [appealUploading, setAppealUploading] = useState(false);

  const handleFileChange = (file) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", selectedFile);
      await api.post(`/payments/upload-receipt/${orderNumber}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Receipt uploaded successfully");
      setSelectedFile(null);
      fetchOrder();
    } catch (err) {
      toast.error("Failed to upload receipt");
    } finally {
      setUploading(false);
    }
  };

  const handleAppealUpload = async () => {
    if (!appealFile) return;
    setAppealUploading(true);
    try {
      const formData = new FormData();
      formData.append("receipt", appealFile);
      await api.post(`/payments/appeal-receipt/${orderNumber}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        "Appeal receipt uploaded successfully. Your payment is now under review again."
      );
      setAppealFile(null);
      fetchOrder();
    } catch (err) {
      toast.error("Failed to upload appeal receipt");
    } finally {
      setAppealUploading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderNumber}`);
      setOrderData(response.data.data);
      setError(null);

      // Fetch current credentials if order has delivered items
      const hasDeliveredItems = response.data.data.items?.some(
        (item) => item.deliveryStatus === "delivered" || item.delivered
      );

      if (hasDeliveredItems) {
        setCredentialsLoading(true);
        try {
          const credentials = await fetchCurrentCredentials();
          setCurrentCredentials(credentials);
        } catch (credError) {
          console.error("Error fetching credentials:", credError);
          // Fallback to static credentials from the order data
          const fallbackCredentials = response.data.data.items
            ?.filter(
              (item) =>
                (item.deliveryStatus === "delivered" || item.delivered) &&
                (item.accountCredentials || item.credentials)
            )
            .map((item) => ({
              title: item.title,
              credentials: item.accountCredentials || item.credentials,
            }));
          setCurrentCredentials(fallbackCredentials || []);
        } finally {
          setCredentialsLoading(false);
        }
      }
    } catch (err) {
      setError("Failed to fetch order status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();

      // Auto-refresh for pending payments and processing orders
      const interval = setInterval(() => {
        if (
          orderData &&
          ((!orderData.paymentConfirmed &&
            orderData.paymentMethod === "bank_deposit" &&
            orderData.paymentStatus !== "declined") ||
            orderData.status === "processing" ||
            orderData.status === "confirmed")
        ) {
          fetchOrder();
        }
      }, 10000); // Refresh every 10 seconds for active orders

      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setError("No order number provided");
    }
  }, [orderNumber, orderData?.paymentConfirmed, orderData?.paymentStatus]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading order status...
        </Typography>
      </Container>
    );
  }

  if (error || !orderData) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            {error || "Order Not Found"}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Please check your order number or try again later.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/services")}
            size="large"
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  const isBankDeposit = orderData.paymentMethod === "bank_deposit";
  const isConfirmed = orderData.paymentConfirmed || !isBankDeposit;
  const isDeclined = orderData.paymentStatus === "declined";

  // Determine current step based on order status and payment confirmation
  const getCurrentStep = () => {
    if (!isConfirmed) return 0; // Payment pending
    if (orderData.status === "confirmed" || orderData.status === "pending")
      return 1; // Payment confirmed
    if (orderData.status === "processing") return 2; // Processing
    if (orderData.status === "delivered") return 3; // Delivered
    return 1;
  };

  const currentStep = getCurrentStep();

  // Check if any items have been delivered
  const hasDeliveredItems = orderData.items?.some(
    (item) => item.deliveryStatus === "delivered" || item.delivered
  );

  // Get delivery credentials for display
  const getDeliveryCredentials = () => {
    return orderData.items
      ?.filter(
        (item) =>
          (item.deliveryStatus === "delivered" || item.delivered) &&
          (item.accountCredentials || item.credentials)
      )
      .map((item) => ({
        title: item.title,
        credentials: item.accountCredentials || item.credentials,
      }));
  };

  // New function to fetch current credentials dynamically
  const fetchCurrentCredentials = async () => {
    try {
      const response = await fetch(
        `/api/orders/${orderNumber}/current-credentials`
      );
      const result = await response.json();

      if (result.success) {
        return result.data.credentials || [];
      } else {
        console.error("Failed to fetch current credentials:", result.message);
        return getDeliveryCredentials(); // Fallback to static credentials
      }
    } catch (error) {
      console.error("Error fetching current credentials:", error);
      return getDeliveryCredentials(); // Fallback to static credentials
    }
  };

  const deliveredCredentials =
    currentCredentials.length > 0
      ? currentCredentials
      : getDeliveryCredentials();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <MotionCard
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          sx={{ textAlign: "center", p: 4 }}
        >
          <CardContent>
            {/* Status Icon */}
            {currentStep === 0 && (
              <PendingIcon
                sx={{ fontSize: 80, color: "warning.main", mb: 3 }}
              />
            )}
            {currentStep === 1 && (
              <CheckCircleIcon
                sx={{ fontSize: 80, color: "success.main", mb: 3 }}
              />
            )}
            {currentStep === 2 && (
              <ProcessingIcon
                sx={{ fontSize: 80, color: "info.main", mb: 3 }}
              />
            )}
            {currentStep === 3 && (
              <DeliveredIcon
                sx={{ fontSize: 80, color: "success.main", mb: 3 }}
              />
            )}

            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: currentStep === 0 ? "warning.main" : "success.main",
              }}
            >
              {currentStep === 0 && "Payment Pending Confirmation"}
              {currentStep === 1 && "Order Confirmed!"}
              {currentStep === 2 && "Order Processing"}
              {currentStep === 3 && "Order Delivered!"}
            </Typography>

            <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
              Order #{orderData.orderNumber}
            </Typography>

            {/* Order Progress Stepper */}
            <Box sx={{ mb: 4 }}>
              <Stepper activeStep={currentStep} orientation="vertical">
                <Step>
                  <StepLabel
                    icon={<PaymentIcon />}
                    sx={{
                      "& .MuiStepLabel-label": {
                        color:
                          currentStep >= 0 ? "primary.main" : "text.secondary",
                      },
                    }}
                  >
                    Payment Confirmation
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {currentStep > 0
                        ? "Payment confirmed successfully"
                        : "Awaiting payment confirmation"}
                    </Typography>
                  </StepContent>
                </Step>

                <Step>
                  <StepLabel
                    icon={<CheckCircleIcon />}
                    sx={{
                      "& .MuiStepLabel-label": {
                        color:
                          currentStep >= 1 ? "primary.main" : "text.secondary",
                      },
                    }}
                  >
                    Order Confirmed
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {currentStep > 1
                        ? "Order confirmed and queued for processing"
                        : currentStep === 1
                        ? "Order confirmed, preparing for processing"
                        : "Pending payment confirmation"}
                    </Typography>
                  </StepContent>
                </Step>

                <Step>
                  <StepLabel
                    icon={<ProcessingIcon />}
                    sx={{
                      "& .MuiStepLabel-label": {
                        color:
                          currentStep >= 2 ? "primary.main" : "text.secondary",
                      },
                    }}
                  >
                    Processing & Delivery
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {currentStep > 2
                        ? "Processing completed, credentials delivered"
                        : currentStep === 2
                        ? "Auto-delivery system processing your order"
                        : "Waiting for processing"}
                    </Typography>
                  </StepContent>
                </Step>

                <Step>
                  <StepLabel
                    icon={<DeliveredIcon />}
                    sx={{
                      "& .MuiStepLabel-label": {
                        color:
                          currentStep >= 3 ? "success.main" : "text.secondary",
                      },
                    }}
                  >
                    Delivered
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {currentStep === 3
                        ? "Order delivered successfully"
                        : "Pending delivery"}
                    </Typography>
                  </StepContent>
                </Step>
              </Stepper>
            </Box>

            {/* Order Details */}
            <Box sx={{ mb: 4, p: 3, bgcolor: "background.default", borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Order Details
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Product:</strong>{" "}
                {orderData.items[0]?.title || orderData.productTitle}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Quantity:</strong>{" "}
                {orderData.items[0]?.quantity || orderData.quantity}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Total:</strong> {orderData.currency}{" "}
                {(Number(orderData.total) || 0).toFixed(2)}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Payment Method:</strong>{" "}
                {orderData.paymentMethod
                  ?.replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong>{" "}
                {orderData.customer.email || orderData.customerEmail}
              </Typography>
            </Box>



            {isBankDeposit && currentStep !== 3 && (
              <Box
                sx={{
                  mb: 4,
                  p: 3,
                  bgcolor: isDeclined
                    ? "error.light"
                    : isConfirmed
                    ? "success.light"
                    : "warning.light",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {isDeclined
                    ? "Payment Declined"
                    : isConfirmed
                    ? "Payment Confirmed"
                    : "Awaiting Payment Confirmation"}
                </Typography>

                {isDeclined && (
                  <>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                        Payment Declined
                      </Typography>
                      <Typography variant="body2">
                        Reason:{" "}
                        {orderData.receiptVerification?.declineReason ||
                          "Receipt verification failed"}
                      </Typography>
                    </Alert>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      You can upload a new receipt to appeal this decision:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography>Bank: Commercial Bank of Ceylon</Typography>
                      <Typography>
                        Account Name: Zelyx Digital Services
                      </Typography>
                      <Typography>Account Number: 8001234567</Typography>
                      <Typography>Branch: Colombo Main</Typography>
                    </Box>
                    <input
                      type="file"
                      onChange={(e) => setAppealFile(e.target.files[0])}
                      accept="image/*,.pdf"
                      style={{ marginBottom: "16px" }}
                    />
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAppealUpload}
                        disabled={!appealFile || appealUploading}
                        sx={{ mb: 2 }}
                      >
                        {appealUploading
                          ? "Uploading Appeal..."
                          : "Upload New Receipt (Appeal)"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={fetchOrder}
                        sx={{ mb: 2 }}
                      >
                        Refresh Status
                      </Button>
                    </Box>
                  </>
                )}

                {!isConfirmed && !isDeclined && (
                  <>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Please deposit to the following bank account and upload
                      your receipt:
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography>Bank: Commercial Bank of Ceylon</Typography>
                      <Typography>
                        Account Name: Zelyx Digital Services
                      </Typography>
                      <Typography>Account Number: 8001234567</Typography>
                      <Typography>Branch: Colombo Main</Typography>
                    </Box>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e.target.files[0])}
                      accept="image/*,.pdf"
                    />
                    <Button
                      variant="contained"
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      sx={{ mt: 2, mb: 2 }}
                    >
                      {uploading ? "Uploading..." : "Upload Receipt"}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={fetchOrder}
                      sx={{ mb: 2, ml: 2 }}
                    >
                      Refresh Status
                    </Button>
                  </>
                )}

                {isConfirmed && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body1"
                      sx={{ mb: 1, color: "success.main", fontWeight: "bold" }}
                    >
                      ✅ Payment Successfully Confirmed!
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Your order is now being processed and you will receive
                      delivery instructions shortly.
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    icon={<AccessTimeIcon />}
                    label="Processing time: 1 hour"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<PhoneIcon />}
                    label="Contact: +94 71 084 6293"
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}

            {currentStep !== 3 && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {currentStep === 0 &&
                  isDeclined &&
                  "Your payment was declined. Please upload a new receipt to appeal this decision."}
                {currentStep === 0 &&
                  !isDeclined &&
                  "We will update the status once payment is confirmed. This page refreshes automatically."}
                {currentStep === 1 &&
                  "Thank you for your purchase! Your order is confirmed and will be processed shortly."}
                {currentStep === 2 &&
                  "Your order is being processed by our auto-delivery system. You will receive your credentials soon."}
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {currentStep === 3 ? (
                // Delivered state - single clean section for navigation
                <Box sx={{ textAlign: "center", width: "100%" }}>
                  <Box
                    sx={{
                      mb: 3,
                      p: 4,
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      borderRadius: 4,
                      boxShadow: (theme) => theme.shadows[8],
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: 'primary.contrastText',
                        fontWeight: '700',
                        mb: 2,
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      🎉 Order Complete!
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'primary.contrastText',
                        opacity: 0.9,
                        mb: 4,
                        fontSize: '1.2rem',
                        fontWeight: '400',
                        lineHeight: 1.6,
                      }}
                    >
                      Your digital products are ready! Access your credentials and product details securely through the tracking page.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() =>
                        navigate(
                          `/track-order?orderNumber=${orderData.orderNumber}`
                        )
                      }
                      sx={{
                        bgcolor: 'background.paper',
                        color: 'primary.main',
                        fontWeight: '600',
                        fontSize: '1.2rem',
                        py: 2,
                        px: 5,
                        borderRadius: 3,
                        boxShadow: (theme) => theme.shadows[6],
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.action.hover,
                          transform: 'translateY(-3px)',
                          boxShadow: (theme) => theme.shadows[8],
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      🚀 View Your Products
                    </Button>
                  </Box>
                  <Button
                    variant="text"
                    size="medium"
                    onClick={() => navigate("/services")}
                    sx={{
                      color: 'primary.contrastText',
                      fontWeight: '500',
                      fontSize: '1rem',
                      '&:hover': {
                        color: 'primary.contrastText',
                        bgcolor: (theme) => theme.palette.action.hover,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Continue Shopping →
                  </Button>
                </Box>
              ) : (
                // Other states - show normal buttons with improved styling
                <>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/services")}
                    sx={{
                      bgcolor: 'primary.main',
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: '600',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/orders")}
                    sx={{
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: '600',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        color: 'primary.dark',
                        bgcolor: (theme) => theme.palette.action.hover,
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    View Orders
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </MotionCard>
      </MotionBox>
    </Container>
  );
};

export default OrderStatus;
