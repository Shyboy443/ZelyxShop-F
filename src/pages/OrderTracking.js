import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  ShoppingBag as ShoppingBagIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { fetchOrderByNumber } from "../store/slices/orderSlice";
import { useCurrency } from "../hooks/useCurrency";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const OrderTracking = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const location = useLocation();
  const { formatPrice } = useCurrency();

  const { currentOrder, orderLoading, error } = useSelector(
    (state) => state.orders
  );

  const [orderNumber, setOrderNumber] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Check for order number in URL query parameters and auto-load
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const orderNumberFromUrl = urlParams.get("orderNumber");
    if (orderNumberFromUrl) {
      setOrderNumber(orderNumberFromUrl);
      setSearchAttempted(true);
      dispatch(fetchOrderByNumber(orderNumberFromUrl));
    }
  }, [location.search, dispatch]);

  // Auto-hide search section if order is loaded from URL
  const shouldShowSearch =
    !location.search.includes("orderNumber") || !currentOrder;

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      return;
    }

    setSearchAttempted(true);
    dispatch(fetchOrderByNumber(orderNumber.trim()));
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
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

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "warning";
      case "paid":
        return "success";
      case "failed":
        return "error";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <ScheduleIcon />;
      case "confirmed":
      case "processing":
        return <ShippingIcon />;
      case "delivered":
        return <CheckCircleIcon />;
      case "cancelled":
        return <CancelIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getOrderSteps = () => {
    const steps = ["Order Placed", "Confirmed", "Processing", "Delivered"];
    const currentStatus = currentOrder?.status?.toLowerCase();

    let activeStep = 0;
    switch (currentStatus) {
      case "pending":
        activeStep = 0;
        break;
      case "confirmed":
        activeStep = 1;
        break;
      case "processing":
        activeStep = 2;
        break;
      case "delivered":
        activeStep = 3;
        break;
      case "cancelled":
        activeStep = -1;
        break;
      default:
        activeStep = 0;
    }

    return { steps, activeStep };
  };

  const canViewProducts = () => {
    return (
      (currentOrder?.paymentStatus === "paid" ||
        currentOrder?.paymentStatus === "confirmed") &&
      currentOrder?.status !== "cancelled"
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ textAlign: "center", mb: 4 }}
      >
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Track Your Order
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Enter your order number to check the status and details
        </Typography>
      </MotionBox>

      {/* Search Section - Only show if not auto-loaded */}
      {shouldShowSearch && (
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          sx={{ mb: 4 }}
        >
          <CardContent>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                fullWidth
                label="Order Number"
                placeholder="e.g., ZLXAB12CD34EF"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                variant="outlined"
                disabled={orderLoading}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={orderLoading || !orderNumber.trim()}
                startIcon={
                  orderLoading ? <CircularProgress size={20} /> : <SearchIcon />
                }
                sx={{ minWidth: 120, height: 56 }}
              >
                {orderLoading ? "Searching..." : "Search"}
              </Button>
            </Box>
          </CardContent>
        </MotionCard>
      )}

      {/* Error Message */}
      {error && searchAttempted && (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{ mb: 4 }}
        >
          <Alert severity="error">{error}</Alert>
        </MotionBox>
      )}

      {/* Order Details */}
      {currentOrder && (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Order Status Overview */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Order #{currentOrder.orderNumber}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Order Date:</strong>{" "}
                    {new Date(currentOrder.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total:</strong>{" "}
                    {formatPrice(currentOrder.total, currentOrder.currency)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Payment Method:</strong>{" "}
                    {currentOrder.paymentMethod
                      ? currentOrder.paymentMethod
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())
                      : "Credit Card"}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Chip
                      label={currentOrder.status}
                      color={getStatusColor(currentOrder.status)}
                      icon={getStatusIcon(currentOrder.status)}
                    />
                    <Chip
                      label={`Payment: ${currentOrder.paymentStatus}`}
                      color={getPaymentStatusColor(currentOrder.paymentStatus)}
                      icon={<PaymentIcon />}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Customer Information
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {currentOrder.customer.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {currentOrder.customer.email}
                  </Typography>
                  <Typography variant="body2">
                    {currentOrder.customer.phone}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Order Progress */}
          {currentOrder.status !== "cancelled" && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  Order Progress
                </Typography>
                <Stepper
                  activeStep={getOrderSteps().activeStep}
                  alternativeLabel={!isMobile}
                  orientation={isMobile ? "vertical" : "horizontal"}
                >
                  {getOrderSteps().steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Status Messages */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: "background.default",
                    borderRadius: 1,
                  }}
                >
                  {currentOrder.status === "pending" && (
                    <Typography variant="body2" color="text.secondary">
                      ⏳ Your order is awaiting payment confirmation.
                    </Typography>
                  )}
                  {currentOrder.status === "confirmed" && (
                    <Typography variant="body2" color="primary">
                      ✅ Payment confirmed! Your order is being prepared for
                      processing.
                    </Typography>
                  )}
                  {currentOrder.status === "processing" && (
                    <Typography variant="body2" color="primary">
                      🚀 Your order is being processed by our auto-delivery
                      system.
                    </Typography>
                  )}
                  {currentOrder.status === "delivered" && (
                    <Typography variant="body2" color="success.main">
                      🎉 Your order has been delivered! Check your account
                      credentials below.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Order Items
              </Typography>

              {!canViewProducts() && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {currentOrder.paymentStatus === "pending"
                    ? "Product details will be available after payment confirmation."
                    : currentOrder.status === "cancelled"
                    ? "Product access is not available for cancelled orders."
                    : "Product details will be available once payment is confirmed."}
                </Alert>
              )}

              <List>
                {currentOrder.items.map((item, index) => (
                  <ListItem
                    key={index}
                    divider={index < currentOrder.items.length - 1}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={canViewProducts() ? item.image : undefined}
                        sx={{ bgcolor: "primary.main" }}
                      >
                        <ShoppingBagIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "medium" }}
                        >
                          {canViewProducts()
                            ? item.title
                            : "Product details hidden"}
                        </Typography>
                      }
                      secondary={
                        canViewProducts() ? (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Quantity: {item.quantity}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Unit Price:{" "}
                              {formatPrice(item.price, currentOrder.currency)}
                            </Typography>
                            {item.duration && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Duration: {item.duration}
                              </Typography>
                            )}
                            {item.features && item.features.length > 0 && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Features: {item.features.join(", ")}
                              </Typography>
                            )}
                            {(() => {
                              const effectiveStatus = item.delivered
                                ? "delivered"
                                : item.deliveryStatus || "pending";
                              return (
                                <Box sx={{ mt: 1 }}>
                                  <Chip
                                    size="small"
                                    label={`Delivery: ${effectiveStatus}`}
                                    color={
                                      effectiveStatus === "delivered"
                                        ? "success"
                                        : effectiveStatus === "processing"
                                        ? "primary"
                                        : "default"
                                    }
                                    variant="outlined"
                                  />
                                </Box>
                              );
                            })()}
                            {item.autoDelivery && (
                              <Typography
                                variant="caption"
                                color="primary"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                🤖 Auto-delivery enabled
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Payment required to view details
                          </Typography>
                        )
                      }
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {canViewProducts()
                        ? formatPrice(
                            item.price * item.quantity,
                            currentOrder.currency
                          )
                        : "***"}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Delivered Products - Enhanced for auto-loaded orders */}
          {canViewProducts() &&
            currentOrder.status === "delivered" &&
            currentOrder.deliveredInventory &&
            currentOrder.deliveredInventory.length > 0 && (
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                sx={{ mb: 4, border: "2px solid", borderColor: "success.main" }}
              >
                <CardContent>
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Typography
                      variant="h4"
                      gutterBottom
                      sx={{ fontWeight: "bold", color: "success.main" }}
                    >
                      🎉 Your Digital Products Are Ready!
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Order #{currentOrder.orderNumber} - Delivered Successfully
                    </Typography>
                  </Box>

                  <Alert severity="success" sx={{ mb: 4, fontSize: "1.1rem" }}>
                    <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                      🔐 Your account credentials are ready! Save these details
                      securely and enjoy your purchase.
                    </Typography>
                  </Alert>

                  {currentOrder.deliveredInventory.map(
                    (inventoryItem, index) => (
                      <MotionCard
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                        variant="outlined"
                        sx={{
                          mb: 3,
                          bgcolor: "success.light",
                          border: "2px solid",
                          borderColor: "success.main",
                          "&:hover": {
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardContent>
                          <Box sx={{ textAlign: "center", mb: 3 }}>
                            <Typography
                              variant="h5"
                              sx={{ fontWeight: "bold", color: "success.dark" }}
                            >
                              {inventoryItem.product?.title ||
                                "Digital Product"}
                            </Typography>
                            <Typography
                              variant="subtitle1"
                              color="text.secondary"
                            >
                              Account Credentials
                            </Typography>
                          </Box>

                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <Box sx={{ textAlign: "center" }}>
                                <Typography
                                  variant="h6"
                                  color="text.secondary"
                                  gutterBottom
                                >
                                  👤 Account Details
                                </Typography>
                                <Box
                                  sx={{
                                    bgcolor: "background.paper",
                                    p: 3,
                                    borderRadius: 2,
                                    border: "2px solid",
                                    borderColor: "success.main",
                                    fontFamily: "monospace",
                                    fontSize: "1.2rem",
                                    fontWeight: "bold",
                                    textAlign: "left",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {typeof inventoryItem.accountCredentials ===
                                  "object" ? (
                                    Object.entries(
                                      inventoryItem.accountCredentials
                                    ).map(([key, value]) => (
                                      <Typography key={key} variant="body1">
                                        {key.charAt(0).toUpperCase() +
                                          key.slice(1)}
                                        : {value}
                                      </Typography>
                                    ))
                                  ) : (
                                    <Typography variant="body1">
                                      {inventoryItem.accountCredentials ||
                                        "N/A"}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>

                          {inventoryItem.notes && (
                            <Box sx={{ mt: 3, textAlign: "center" }}>
                              <Typography
                                variant="h6"
                                color="text.secondary"
                                gutterBottom
                              >
                                📝 Additional Information
                              </Typography>
                              <Box
                                sx={{
                                  bgcolor: "background.paper",
                                  p: 2,
                                  borderRadius: 2,
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <Typography variant="body1">
                                  {inventoryItem.notes}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          <Divider sx={{ my: 3 }} />

                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              flexWrap: "wrap",
                              justifyContent: "center",
                            }}
                          >
                            <Chip
                              size="medium"
                              label={`✅ Status: ${
                                inventoryItem.status || "Delivered"
                              }`}
                              color="success"
                              sx={{ fontWeight: "bold" }}
                            />
                            <Chip
                              size="medium"
                              label={`📅 Delivered: ${new Date(
                                inventoryItem.deliveredAt ||
                                  inventoryItem.createdAt
                              ).toLocaleDateString()}`}
                              color="info"
                              sx={{ fontWeight: "bold" }}
                            />
                            {inventoryItem.usageLimit && (
                              <Chip
                                size="medium"
                                label={`👥 Usage Limit: ${inventoryItem.usageLimit} users`}
                                color="primary"
                                sx={{ fontWeight: "bold" }}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </MotionCard>
                    )
                  )}

                  <Alert severity="warning" sx={{ mt: 4, fontSize: "1.1rem" }}>
                    <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                      <strong>🔒 Security Notice:</strong> Please save these
                      credentials securely and do not share them with others.
                      You can always return to this page using your order
                      number: <strong>{currentOrder.orderNumber}</strong>
                    </Typography>
                  </Alert>

                  <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => window.print()}
                      sx={{ mr: 2 }}
                    >
                      🖨️ Print Credentials
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => {
                        const credentials = currentOrder.deliveredInventory
                          .map(
                            (item) =>
                              `${item.product?.title || "Product"}:\nAccount: ${
                                item.accountCredentials?.username ||
                                item.accountCredentials?.email ||
                                item.accountCredentials ||
                                "N/A"
                              }${item.notes ? "\nNotes: " + item.notes : ""}`
                          )
                          .join("\n\n");
                        navigator.clipboard.writeText(credentials);
                        alert("Credentials copied to clipboard!");
                      }}
                    >
                      📋 Copy All Credentials
                    </Button>
                  </Box>
                </CardContent>
              </MotionCard>
            )}

          {/* Order Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Order Summary
              </Typography>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">
                  {formatPrice(currentOrder.subtotal, currentOrder.currency)}
                </Typography>
              </Box>

              {currentOrder.shipping > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Shipping:</Typography>
                  <Typography variant="body2">
                    {formatPrice(currentOrder.shipping, currentOrder.currency)}
                  </Typography>
                </Box>
              )}

              {currentOrder.tax > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2">
                    {formatPrice(currentOrder.tax, currentOrder.currency)}
                  </Typography>
                </Box>
              )}

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

              {currentOrder.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Order Notes:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentOrder.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </MotionBox>
      )}
    </Container>
  );
};

export default OrderTracking;
