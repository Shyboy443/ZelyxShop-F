import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
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
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  CircularProgress,
  TextField,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  AccessTime as AccessTimeIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { createOrder } from "../store/slices/orderSlice";
import api from "../api/api";
import { useCurrency } from "../hooks/useCurrency";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const steps = [
  "Cart Review",
  "Contact Information",
  "Order Summary",
  "Payment",
  "Order Complete",
];

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get checkout data from location state (passed from ProductDetail)
  const checkoutData = useMemo(() => location.state || {}, [location.state]);
  const { selectedCurrency, rates, formatPrice } = useCurrency();

  const [paymentMethod, setPaymentMethod] = useState("bank_deposit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(
    checkoutData.customer.mobile || ""
  );
  // Removed receipt upload from checkout - now handled in bank transfer page

  // Redirect if no checkout data
  useEffect(() => {
    if (!checkoutData.product || !checkoutData.customer) {
      navigate("/services");
      toast.error("Invalid checkout session");
    }
  }, [checkoutData, navigate]);

  // Prevent page refresh and redirect to product page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      navigate(`/services/${checkoutData.product?._id}`);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, checkoutData.product]);

  if (!checkoutData.product || !checkoutData.customer) {
    return null;
  }

  // Calculate total price
  const totalPrice = checkoutData.product.price * checkoutData.quantity;
  const convertedPrice = formatPrice(
    totalPrice,
    selectedCurrency,
    rates[selectedCurrency] || 1
  );

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  // Receipt upload moved to bank transfer page

  const handleConfirmOrder = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Receipt upload is now handled on the bank transfer page

    setIsProcessing(true);

    try {
      if (!customerPhone) {
        toast.error("Please enter your mobile phone number");
        setIsProcessing(false);
        return;
      }
      // Check for testing override
      const skipPaymentCheck =
        process.env.REACT_APP_SKIP_PAYMENT_CHECK === "true";

      const orderData = {
        customer: {
          email: checkoutData.customer.email,
          phone: customerPhone, // Backend expects 'phone' field
        },
        items: [
          {
            product: checkoutData.product._id,
            quantity: checkoutData.quantity,
          },
        ],
        currency: selectedCurrency,
        exchangeRate: rates[selectedCurrency] || 1,
        paymentMethod: paymentMethod,
        notes: `Payment Method: ${paymentMethod}`,
      };

      const result = await dispatch(createOrder(orderData)).unwrap();

      // Show appropriate message based on payment method
      if (paymentMethod === "bank_deposit") {
        toast.success(
          `Order created! Redirecting to payment page. Order ID: ${result.orderNumber}`
        );
      } else {
        toast.success(
          `Order created successfully! Order ID: ${result.orderNumber}`
        );
      }

      // Navigate based on payment method
      if (paymentMethod === "bank_deposit") {
        // Navigate to bank transfer page for bank deposits
        navigate(`/bank-transfer/${result.orderNumber}`, {
          state: {
            orderNumber: result.orderNumber,
            productTitle: checkoutData.product.title,
            quantity: checkoutData.quantity,
            total: convertedPrice,
            paymentMethod,
            customerEmail: checkoutData.customer.email,
            customerPhone: customerPhone,
          },
        });
      } else {
        // Navigate to order status page for other payment methods
        navigate("/order-status", {
          state: {
            orderNumber: result.orderNumber,
            productTitle: checkoutData.product.title,
            quantity: checkoutData.quantity,
            total: convertedPrice,
            paymentMethod,
            customerEmail: checkoutData.customer.email,
            customerPhone: customerPhone,
          },
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentMethodDetails = () => {
    switch (paymentMethod) {
      case "bank_deposit":
        return (
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: (theme) => theme.palette.background.default,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "primary.main", fontWeight: "bold" }}
            >
              Bank Deposit Instructions
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              Click "Pay Now" to proceed to the payment page where you can
              upload your receipt after making the bank transfer.
            </Alert>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<AccessTimeIcon />}
                label="Processing: 2-4 hours"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<PhoneIcon />}
                label="Contact: +94 77 123 4567"
                color="secondary"
                variant="outlined"
              />
            </Box>
          </Box>
        );
      case "paypal":
        return (
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: (theme) => theme.palette.background.default,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="h6" gutterBottom>
              PayPal Payment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PayPal integration coming soon. Please use Bank Deposit for now.
            </Typography>
          </Box>
        );
      case "cryptocurrency":
        return (
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: (theme) => theme.palette.background.default,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Cryptocurrency Payment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cryptocurrency payment integration coming soon. Please use Bank
              Deposit for now.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
          Payment Confirmation
        </Typography>

        <Grid container spacing={4}>
          {/* Order Summary */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  Order Summary
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar
                    src={checkoutData.product.images?.[0]}
                    variant="rounded"
                    sx={{ width: 80, height: 80, mr: 2 }}
                  >
                    {checkoutData.product.title?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {checkoutData.product.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quantity: {checkoutData.quantity}
                    </Typography>
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    >
                      {convertedPrice}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Customer Information
                  </Typography>
                  <Typography variant="body2">
                    Email: {checkoutData.customer.email}
                  </Typography>
                  <TextField
                    label="Mobile Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    fullWidth
                    required
                    sx={{ mt: 2 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment Methods */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  <PaymentIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                  Payment Method
                </Typography>

                <FormControl component="fieldset" sx={{ width: "100%" }}>
                  <RadioGroup
                    value={paymentMethod}
                    onChange={handlePaymentMethodChange}
                  >
                    <FormControlLabel
                      value="bank_deposit"
                      control={<Radio />}
                      label="Bank Deposit"
                    />
                    <FormControlLabel
                      value="paypal"
                      control={<Radio />}
                      label="PayPal"
                    />
                    <FormControlLabel
                      value="cryptocurrency"
                      control={<Radio />}
                      label="Cryptocurrency"
                    />
                  </RadioGroup>
                </FormControl>

                {renderPaymentMethodDetails()}

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleConfirmOrder}
                    disabled={isProcessing}
                    sx={{ py: 1.5, fontSize: "1.1rem" }}
                  >
                    {isProcessing ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Processing...
                      </>
                    ) : paymentMethod === "bank_deposit" ? (
                      "Pay Now"
                    ) : (
                      "Confirm Order"
                    )}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={() => navigate(-1)}
                    sx={{ mt: 2 }}
                  >
                    Back to Product
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </MotionBox>
    </Container>
  );
};

export default Checkout;
