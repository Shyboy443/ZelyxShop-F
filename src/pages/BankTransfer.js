import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Chip,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  AccessTime as AccessTimeIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import BankTransferPayment from "../components/BankTransferPayment";
import api from "../api/api";

const MotionBox = motion(Box);

const BankTransfer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderNumber } = useParams();
  const [orderData, setOrderData] = useState(location.state);
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [manualRefreshCount, setManualRefreshCount] = useState(0);

  useEffect(() => {
    const validateOrder = async () => {
      // If we have order data from location state and it matches the URL parameter
      if (orderData && orderData.orderNumber === orderNumber) {
        return;
      }

      // If no order data or mismatched order number, try to fetch from API
      if (orderNumber) {
        setLoading(true);
        try {
          const response = await api.get(`/orders/${orderNumber}`);
          const fetchedOrder = response.data.data;

          // Transform API data to match expected format
          const transformedOrderData = {
            orderNumber: fetchedOrder.orderNumber,
            productTitle: fetchedOrder.items?.[0]?.title || "Product",
            quantity: fetchedOrder.items?.[0]?.quantity || 1,
            total: `${fetchedOrder.currency} ${fetchedOrder.total?.toFixed(2)}`,
            paymentMethod: fetchedOrder.paymentMethod,
            customerEmail: fetchedOrder.customer?.email,
            customerPhone: fetchedOrder.customer?.phone,
            ...fetchedOrder, // Include all other fields
          };

          setOrderData(transformedOrderData);
        } catch (error) {
          console.error("Error fetching order:", error);
          navigate("/services");
          toast.error("Invalid order or order not found");
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/services");
        toast.error("Invalid order session");
      }
    };

    validateOrder();
  }, [orderNumber, orderData, navigate]);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      handleManualRefresh();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(pollInterval);
  }, [orderNumber, navigate]);

  const handleReceiptUpload = () => {
    // Refresh or update UI after receipt upload
    toast.success(
      "Receipt uploaded! We are reviewing your payment and will confirm within 1 hour during working hours (Mon-Sun, 9AM-11PM)."
    );
  };

  const handleManualRefresh = async () => {
    if (checkingPayment) return; // Prevent multiple simultaneous requests

    setManualRefreshCount((prev) => prev + 1);
    setCheckingPayment(true);

    try {
      const response = await api.get(`/orders/${orderNumber}`);
      const updatedOrder = response.data.data;

      // If payment is confirmed, redirect to order status
      if (
        updatedOrder.paymentStatus === "confirmed" ||
        updatedOrder.paymentStatus === "paid"
      ) {
        toast.success("Payment confirmed! Redirecting to order status...");
        setTimeout(() => {
          navigate(`/order-status/${orderNumber}`, {
            state: updatedOrder,
            replace: true,
          });
        }, 2000);
        return;
      }

      // Transform API data to match expected format
      const transformedOrderData = {
        orderNumber: updatedOrder.orderNumber,
        productTitle: updatedOrder.items?.[0]?.title || "Product",
        quantity: updatedOrder.items?.[0]?.quantity || 1,
        total: `${updatedOrder.currency} ${updatedOrder.total?.toFixed(2)}`,
        paymentMethod: updatedOrder.paymentMethod,
        customerEmail: updatedOrder.customer?.email,
        customerPhone: updatedOrder.customer?.phone,
        ...updatedOrder, // Include all other fields
      };

      // Update order data
      setOrderData(transformedOrderData);
      toast.success("Payment status refreshed");
    } catch (error) {
      console.error("Error checking payment status:", error);
      toast.error("Failed to refresh payment status");
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleBackToServices = () => {
    navigate("/services");
  };

  const handleViewOrderStatus = () => {
    navigate("/order-status", { state: orderData });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Typography>Loading order details...</Typography>
      </Container>
    );
  }

  if (!orderData || orderData.orderNumber !== orderNumber) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <MotionBox
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          Complete Your Bank Transfer
        </Typography>

        <Grid container spacing={4}>
          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ position: "sticky", top: 20 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  <ReceiptIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Order Summary
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{ fontWeight: "bold", mb: 2 }}
                  >
                    Order #{orderData.orderNumber}
                  </Typography>

                  <Typography variant="subtitle1" gutterBottom>
                    {orderData.productTitle}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Quantity: {orderData.quantity}
                  </Typography>

                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ fontWeight: "bold", mt: 2 }}
                  >
                    {orderData.total}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Customer Information
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Email: {orderData.customerEmail}
                  </Typography>
                  {orderData.customerPhone && (
                    <Typography variant="body2" gutterBottom>
                      Mobile: {orderData.customerPhone}
                    </Typography>
                  )}

                  <Chip
                    label={`Payment: ${orderData.paymentMethod
                      .replace("_", " ")
                      .toUpperCase()}`}
                    color="primary"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleManualRefresh}
                    disabled={checkingPayment}
                    sx={{ mb: 2 }}
                    startIcon={
                      checkingPayment ? <AccessTimeIcon /> : <CheckCircleIcon />
                    }
                  >
                    {checkingPayment ? "Checking..." : "Check Payment Status"}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleViewOrderStatus}
                    sx={{ mb: 2 }}
                  >
                    View Order Status
                  </Button>

                  <Button
                    variant="text"
                    fullWidth
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBackToServices}
                  >
                    Back to Services
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Bank Transfer Details */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: "bold", mb: 3 }}
              >
                Bank Transfer Instructions
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Please follow the instructions below to complete your payment.
                Your order will be processed once we receive and verify your
                payment.
                {checkingPayment && (
                  <Box
                    sx={{
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="caption" color="primary">
                      🔄 Checking payment status...
                    </Typography>
                  </Box>
                )}
              </Typography>

              <BankTransferPayment
                orderNumber={orderData.orderNumber}
                onReceiptUpload={handleReceiptUpload}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Important Notes */}
        <Paper elevation={1} sx={{ mt: 4, p: 3, bgcolor: (theme) => theme.palette.background.paper }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Important Notes:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" gutterBottom>
              Payment must be completed within 6 hours or your order will be
              automatically cancelled.
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              Please include your order number ({orderData.orderNumber}) in the
              payment reference.
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              Upload your payment receipt to expedite the verification process.
            </Typography>
            <Typography component="li" variant="body2" gutterBottom>
              You will receive order confirmation within 1 hour after payment
              verification.
            </Typography>
            <Typography component="li" variant="body2">
              For any assistance, contact our support team at +94 77 123 4567.
            </Typography>
          </Box>
        </Paper>
      </MotionBox>
    </Container>
  );
};

export default BankTransfer;
