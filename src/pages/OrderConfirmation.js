import React, { useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Home as HomeIcon,
  ShoppingBag as ShoppingBagIcon,
} from "@mui/icons-material";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchOrderByNumber } from "../store/slices/orderSlice";
import { useCurrency } from "../hooks/useCurrency";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const OrderConfirmation = () => {
  const theme = useTheme();
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { formatPrice } = useCurrency();

  const { currentOrder, loading, error } = useSelector((state) => state.orders);
  const { selectedCurrency } = useSelector((state) => state.currency);

  useEffect(() => {
    if (orderNumber) {
      dispatch(fetchOrderByNumber(orderNumber));
    }
  }, [dispatch, orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "processing":
        return "primary";
      case "shipped":
        return "secondary";
      case "delivered":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error || !currentOrder) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Alert severity="error" sx={{ mb: 4 }}>
            {error || "Order not found"}
          </Alert>
          <Box sx={{ textAlign: "center" }}>
            <Button
              variant="contained"
              component={RouterLink}
              to="/"
              startIcon={<HomeIcon />}
            >
              Go Home
            </Button>
          </Box>
        </MotionBox>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Success Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ textAlign: "center", mb: 4 }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: 80,
            color: "success.main",
            mb: 2,
            filter: "drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))",
          }}
        />
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Order Confirmed!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Thank you for your order
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Order #{currentOrder.orderNumber}
        </Typography>
      </MotionBox>

      {/* Order Details */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        sx={{ mb: 4 }}
      >
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Order Information
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Order Number:</strong> {currentOrder.orderNumber}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Order Date:</strong>{" "}
                {new Date(currentOrder.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Payment Method:</strong>{" "}
                {currentOrder.paymentMethod
                  ? currentOrder.paymentMethod
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                  : "Credit Card"}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong>{" "}
                <Chip
                  label={currentOrder.status}
                  color={getStatusColor(currentOrder.status)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Currency:</strong> {currentOrder.currency}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Shipping Address
              </Typography>
              <Typography variant="body2" gutterBottom>
                {currentOrder.customer.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {currentOrder.customer.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {currentOrder.customer.phone}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {currentOrder.customer.address.street}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {currentOrder.customer.address.city},{" "}
                {currentOrder.customer.address.state}{" "}
                {currentOrder.customer.address.zipCode}
              </Typography>
              <Typography variant="body2">
                {currentOrder.customer.address.country}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </MotionCard>

      {/* Order Items */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        sx={{ mb: 4 }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Order Items
          </Typography>

          <List>
            {currentOrder.items.map((item, index) => (
              <ListItem
                key={index}
                divider={index < currentOrder.items.length - 1}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "medium" }}
                    >
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {item.quantity}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Unit Price:{" "}
                        {formatPrice(item.price, currentOrder.currency)}
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {formatPrice(
                    item.price * item.quantity,
                    currentOrder.currency
                  )}
                </Typography>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </MotionCard>

      {/* Order Summary */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        sx={{ mb: 4 }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Order Summary
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Subtotal:</Typography>
            <Typography variant="body2">
              {formatPrice(currentOrder.subtotal, currentOrder.currency)}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Shipping:</Typography>
            <Typography variant="body2">
              {formatPrice(currentOrder.shipping, currentOrder.currency)}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Tax:</Typography>
            <Typography variant="body2">
              {formatPrice(currentOrder.tax, currentOrder.currency)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Total:
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold" }}
              color="primary"
            >
              {formatPrice(currentOrder.total, currentOrder.currency)}
            </Typography>
          </Box>

          {currentOrder.currency !== "LKR" && currentOrder.exchangeRate && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Exchange rate used: 1 USD = {currentOrder.exchangeRate.toFixed(2)}{" "}
              LKR
            </Typography>
          )}
        </CardContent>
      </MotionCard>

      {/* Order Notes */}
      {currentOrder.notes && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          sx={{ mb: 4 }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Order Notes
            </Typography>
            <Typography variant="body2">{currentOrder.notes}</Typography>
          </CardContent>
        </MotionCard>
      )}

      {/* Action Buttons */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "center",
          flexWrap: "wrap",
          "@media print": {
            display: "none",
          },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Order
        </Button>

        <Button
          variant="outlined"
          component={RouterLink}
          to="/services"
          startIcon={<ShoppingBagIcon />}
        >
          Continue Shopping
        </Button>

        <Button
          variant="contained"
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
        >
          Go Home
        </Button>
      </MotionBox>

      {/* What's Next Section */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        sx={{
          mt: 4,
          "@media print": {
            display: "none",
          },
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            What's Next?
          </Typography>

          <Typography variant="body2" gutterBottom>
            • You will receive an email confirmation shortly
          </Typography>
          <Typography variant="body2" gutterBottom>
            • We'll notify you when your order is being processed
          </Typography>
          <Typography variant="body2" gutterBottom>
            • Track your order status using the order number above
          </Typography>
          <Typography variant="body2">
            • Contact us if you have any questions about your order
          </Typography>
        </CardContent>
      </MotionCard>
    </Container>
  );
};

export default OrderConfirmation;
