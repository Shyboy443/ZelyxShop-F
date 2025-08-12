import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  useTheme,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Inventory as InventoryIcon,
  LocalShipping as DeliveryIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import api from "../../api/api";
import inventoryAPI from "../../api/inventoryAPI";
import { useCurrency } from "../../hooks/useCurrency";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const OrderDetail = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusDialog, setStatusDialog] = useState({ open: false });
  const [inventoryDialog, setInventoryDialog] = useState({
    open: false,
    item: null,
  });
  const [deliveryDialog, setDeliveryDialog] = useState({ open: false });
  const [newStatus, setNewStatus] = useState("");
  const [selectedCredentials, setSelectedCredentials] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [autoDeliveryStatus, setAutoDeliveryStatus] = useState(null);
  const [updatingAutoDelivery, setUpdatingAutoDelivery] = useState(false);

  const [showManualDelivery, setShowManualDelivery] = useState(false);
  const [manualDeliveryText, setManualDeliveryText] = useState("");

  const orderStatuses = [
    { value: "pending", label: "Pending", color: "warning" },
    { value: "confirmed", label: "Confirmed", color: "info" },
    { value: "processing", label: "Processing", color: "primary" },
    { value: "delivered", label: "Delivered", color: "success" },
    { value: "cancelled", label: "Cancelled", color: "error" },
  ];

  const paymentStatuses = [
    { value: "pending", label: "Pending", color: "warning" },
    { value: "paid", label: "Paid", color: "success" },
    { value: "failed", label: "Failed", color: "error" },
  ];

  const loadOrderDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [orderResponse, inventoryResponse, autoDeliveryResponse] =
        await Promise.all([
          api.get(`/admin/orders/${id}`),
          inventoryAPI.getInventory({ orderId: id }),
          api
            .get(`/admin/orders/${id}/auto-delivery`)
            .catch(() => ({ data: { data: null } })),
        ]);

      setOrder(orderResponse.data.data);
      setInventory(inventoryResponse.data.data || []);
      setNewStatus(orderResponse.data.data.status);
      setAutoDeliveryStatus(autoDeliveryResponse.data.data);
    } catch (error) {
      console.error("Failed to load order details:", error);
      toast.error("Failed to load order details");
      navigate("/admin/orders");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order.status) {
      setStatusDialog({ open: false });
      return;
    }

    setUpdating(true);
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      setStatusDialog({ open: false });
      loadOrderDetails();

      // If order is marked as delivered, load inventory details without navigating
      if (newStatus === "delivered") {
        toast.success(
          "Order marked as delivered! Loading inventory details..."
        );
        loadOrderDetails();
      }
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignCredentials = async (itemId, credentialsId) => {
    try {
      await api.put(`/admin/orders/${id}/assign-credentials`, {
        itemId,
        credentialsId,
      });
      toast.success("Credentials assigned successfully");
      loadOrderDetails();
      setInventoryDialog({ open: false, item: null });

      // Auto-update status to processing if credentials are assigned
      if (order.status === "confirmed") {
        setNewStatus("processing");
        setTimeout(() => handleStatusUpdate(), 1000);
      }
    } catch (error) {
      toast.error("Failed to assign credentials");
    }
  };

  const handleTriggerDelivery = async () => {
    setUpdating(true);
    try {
      const response = await inventoryAPI.triggerOrderDelivery(id);
      if (response.data.success) {
        toast.success("Delivery triggered successfully");
        loadOrderDetails();

        // Auto-update status to delivered if delivery is triggered
        if (order.status === "processing") {
          setNewStatus("delivered");
          setTimeout(() => handleStatusUpdate(), 1000);
        }
      } else {
        toast.error(response.data.message || "Failed to trigger delivery");
      }
    } catch (error) {
      toast.error("Failed to trigger delivery");
    } finally {
      setUpdating(false);
      setDeliveryDialog({ open: false });
    }
  };

  const handleManualDelivery = async () => {
    if (Object.keys(selectedCredentials).length === 0) {
      toast.error("Please select credentials for all items");
      return;
    }

    setUpdating(true);
    try {
      await api.post(`/admin/orders/${id}/manual-delivery`, {
        credentials: selectedCredentials,
        notes: deliveryNotes,
      });
      toast.success("Manual delivery completed successfully");
      loadOrderDetails();
      setDeliveryDialog({ open: false });
      setSelectedCredentials({});
      setDeliveryNotes("");
    } catch (error) {
      toast.error("Failed to complete manual delivery");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmPayment = async () => {
    setUpdating(true);
    try {
      await api.put(`/admin/orders/${id}/confirm-payment`);
      toast.success("Payment confirmed successfully");
      loadOrderDetails();
    } catch (error) {
      toast.error("Failed to confirm payment");
    } finally {
      setUpdating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleAutoDeliveryToggle = async (enabled) => {
    setUpdatingAutoDelivery(true);
    try {
      const response = await api.put(`/admin/orders/${id}/auto-delivery`, {
        enabled,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        // Reload auto-delivery status
        const autoDeliveryResponse = await api.get(
          `/admin/orders/${id}/auto-delivery`
        );
        setAutoDeliveryStatus(autoDeliveryResponse.data.data);
        // Also reload order details to get any status changes
        loadOrderDetails();
      } else {
        toast.error(
          response.data.message || "Failed to update auto-delivery settings"
        );
      }
    } catch (error) {
      console.error("Failed to update auto-delivery:", error);
      toast.error("Failed to update auto-delivery settings");
    } finally {
      setUpdatingAutoDelivery(false);
    }
  };

  const getStatusColor = (status, type = "order") => {
    const statuses = type === "payment" ? paymentStatuses : orderStatuses;
    return statuses.find((s) => s.value === status)?.color || "default";
  };

  const getStatusLabel = (status, type = "order") => {
    const statuses = type === "payment" ? paymentStatuses : orderStatuses;
    return statuses.find((s) => s.value === status)?.label || status;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading order details...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Order Not Found
          </Typography>
          <Typography variant="body2">
            The requested order could not be found or you don't have permission
            to view it.
          </Typography>
        </Alert>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={() => navigate("/admin/orders")}>
            Back to Orders
          </Button>
          <Button variant="outlined" onClick={loadOrderDetails}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ mb: 4 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={() => navigate("/admin/orders")} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: "bold", flexGrow: 1 }}>
            Order #{order.orderNumber}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setStatusDialog({ open: true })}
            sx={{ mr: 2 }}
          >
            Update Status
          </Button>
          <Button
            variant="contained"
            startIcon={<InventoryIcon />}
            onClick={() => navigate(`/admin/products-store?orderId=${id}`)}
            disabled={order.status === "delivered"}
            color="secondary"
          >
            Manage Inventory
          </Button>
          <Button
            variant="contained"
            startIcon={<DeliveryIcon />}
            onClick={() => setDeliveryDialog({ open: true })}
            disabled={
              order.status === "delivered" || order.paymentStatus !== "paid"
            }
          >
            Process Delivery
          </Button>
        </Box>
      </MotionBox>

      <Grid container spacing={3}>
        {/* Order Information */}
        <Grid item xs={12} md={8}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Order Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {order.orderNumber}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Order Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {order.paymentMethod?.replace("_", " ") || "Credit Card"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{ fontWeight: "bold" }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setStatusDialog({ open: true })}
                      sx={{ ml: 1 }}
                    >
                      Update Status
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(order.paymentStatus, "payment")}
                    color={getStatusColor(order.paymentStatus, "payment")}
                    size="small"
                  />
                </Grid>
                {order.paymentMethod === "bank_deposit" && order.receipt && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Receipt
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}/${order.receipt}`}
                        alt="Payment Receipt"
                        style={{
                          maxWidth: "300px",
                          maxHeight: "300px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <Typography color="error" sx={{ display: "none", mt: 1 }}>
                        Receipt image could not be loaded
                      </Typography>
                      {order.paymentStatus === "pending" && (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleConfirmPayment}
                          disabled={updating}
                          sx={{ mt: 2, display: "block" }}
                        >
                          {updating
                            ? "Confirming..."
                            : "Verify & Confirm Payment"}
                        </Button>
                      )}
                      {order.paymentStatus === "confirmed" &&
                        order.receiptVerification && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="success.main">
                              ✅ Payment verified by{" "}
                              {order.receiptVerification.adminName} on{" "}
                              {new Date(
                                order.receiptVerification.verifiedAt
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      color: theme.palette.primary.main,
                    }}
                  >
                    {formatPrice(order.total, order.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Currency
                  </Typography>
                  <Typography variant="body1">{order.currency}</Typography>
                </Grid>
              </Grid>

              {order.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">{order.notes}</Typography>
                </Box>
              )}

              {order.status === "delivered" && inventory.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Inventory Details
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventory.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item.productName || "Unknown"}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                color={
                                  item.status === "assigned"
                                    ? "success"
                                    : "warning"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={showManualDelivery}
                        onChange={(e) =>
                          setShowManualDelivery(e.target.checked)
                        }
                      />
                    }
                    label="Enable Manual Delivery Input"
                    sx={{ mt: 2 }}
                  />

                  {showManualDelivery && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={manualDeliveryText}
                        onChange={(e) => setManualDeliveryText(e.target.value)}
                        label="Enter Manual Delivery Details (optional)"
                        variant="outlined"
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          // Implement manual delivery submission if needed
                          toast.success("Manual delivery details submitted");
                          setShowManualDelivery(false);
                        }}
                        sx={{ mt: 2 }}
                      >
                        Submit Delivery
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {order.status === "delivered" && inventory.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Inventory Details
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventory.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item.productName || "Unknown"}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                color={
                                  item.status === "assigned"
                                    ? "success"
                                    : "warning"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={showManualDelivery}
                        onChange={(e) =>
                          setShowManualDelivery(e.target.checked)
                        }
                      />
                    }
                    label="Enable Manual Delivery Input"
                    sx={{ mt: 2 }}
                  />

                  {showManualDelivery && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={manualDeliveryText}
                        onChange={(e) => setManualDeliveryText(e.target.value)}
                        label="Enter Manual Delivery Details (optional)"
                        variant="outlined"
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          // Implement manual delivery submission if needed
                          toast.success("Manual delivery details submitted");
                          setShowManualDelivery(false);
                        }}
                        sx={{ mt: 2 }}
                      >
                        Submit Delivery
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {/* Auto-Delivery Settings */}
              {autoDeliveryStatus && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Auto-Delivery Settings
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                        Auto-Delivery Status
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {autoDeliveryStatus.autoDeliveryEnabled
                          ? "Auto-delivery is enabled for this order"
                          : "Auto-delivery is disabled - manual delivery required"}
                      </Typography>
                      {autoDeliveryStatus.itemsBreakdown && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.5 }}
                        >
                          Items:{" "}
                          {autoDeliveryStatus.itemsBreakdown.autoDeliveryItems}{" "}
                          auto-delivery,{" "}
                          {
                            autoDeliveryStatus.itemsBreakdown
                              .manualDeliveryItems
                          }{" "}
                          manual delivery
                        </Typography>
                      )}
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={
                            autoDeliveryStatus.autoDeliveryEnabled || false
                          }
                          onChange={(e) =>
                            handleAutoDeliveryToggle(e.target.checked)
                          }
                          disabled={
                            updatingAutoDelivery ||
                            !autoDeliveryStatus.canChangeAutoDelivery
                          }
                          color="primary"
                        />
                      }
                      label={
                        autoDeliveryStatus.autoDeliveryEnabled
                          ? "Enabled"
                          : "Disabled"
                      }
                      labelPlacement="start"
                    />
                  </Box>
                  {!autoDeliveryStatus.canChangeAutoDelivery && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Auto-delivery settings cannot be changed for delivered
                      orders.
                    </Alert>
                  )}
                </Box>
              )}

              {/* Order Workflow Actions */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Management
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {/* Status-based action buttons */}
                  {order.status === "pending" && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setNewStatus("confirmed");
                        handleStatusUpdate();
                      }}
                      disabled={updating}
                    >
                      Confirm Order
                    </Button>
                  )}

                  {order.status === "confirmed" && (
                    <>
                      <Button
                        variant="contained"
                        color="info"
                        onClick={() => {
                          setNewStatus("processing");
                          handleStatusUpdate();
                        }}
                        disabled={updating}
                      >
                        Start Processing
                      </Button>
                      {order.items?.some((item) => !item.credentials) && (
                        <Button
                          variant="outlined"
                          onClick={() =>
                            setInventoryDialog({
                              open: true,
                              item: order.items.find(
                                (item) => !item.credentials
                              ),
                            })
                          }
                        >
                          Assign Credentials
                        </Button>
                      )}
                    </>
                  )}

                  {order.status === "processing" && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                          setNewStatus("delivered");
                          handleStatusUpdate();
                        }}
                        disabled={updating}
                        startIcon={<CheckIcon />}
                      >
                        Mark as Delivered
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<InventoryIcon />}
                        onClick={() =>
                          navigate(`/admin/products-store?orderId=${id}`)
                        }
                        disabled={updating}
                        color="secondary"
                      >
                        Select Inventory
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DeliveryIcon />}
                        onClick={() => setDeliveryDialog({ open: true })}
                        disabled={updating}
                      >
                        Process Delivery
                      </Button>
                    </>
                  )}

                  {order.status !== "cancelled" &&
                    order.status !== "delivered" && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          setNewStatus("cancelled");
                          handleStatusUpdate();
                        }}
                        disabled={updating}
                      >
                        Cancel Order
                      </Button>
                    )}

                  {/* Manual status update button */}
                  <Button
                    variant="outlined"
                    onClick={() => setStatusDialog({ open: true })}
                    disabled={updating}
                  >
                    Custom Status Update
                  </Button>
                </Box>

                {/* Order completion status */}
                {order.status === "delivered" && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ✅ Order completed successfully! Customer has been
                      notified.
                    </Typography>
                  </Alert>
                )}

                {order.status === "cancelled" && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ❌ Order has been cancelled.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </CardContent>
          </MotionCard>

          {/* Order Items */}
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            sx={{ mt: 3 }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Order Items
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Delivery Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: "bold" }}
                          >
                            {item.title}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">
                          {formatPrice(item.price, order.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatPrice(
                            item.price * item.quantity,
                            order.currency
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.deliveryStatus || "Pending"}
                            color={
                              item.deliveryStatus === "delivered"
                                ? "success"
                                : "warning"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Manage Inventory">
                            <IconButton
                              onClick={() =>
                                setInventoryDialog({ open: true, item })
                              }
                              size="small"
                            >
                              <InventoryIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Customer Information */}
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Customer Information
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {order.customer.firstName} {order.customer.lastName}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {order.customer.email}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(order.customer.email)}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {order.customer.phone}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(order.customer.phone)}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </MotionCard>

          {/* Delivery Information */}
          {order.deliveryInfo && (
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              sx={{ mt: 3 }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                  Delivery Information
                </Typography>

                {order.deliveryInfo.deliveredAt && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Delivered At
                    </Typography>
                    <Typography variant="body1">
                      {new Date(
                        order.deliveryInfo.deliveredAt
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {order.deliveryInfo.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Notes
                    </Typography>
                    <Typography variant="body1">
                      {order.deliveryInfo.notes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </MotionCard>
          )}
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false })}
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="Status"
            >
              {orderStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Management Dialog */}
      <Dialog
        open={deliveryDialog.open}
        onClose={() => setDeliveryDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Manage Delivery</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleTriggerDelivery}
              disabled={updating}
              sx={{ mr: 2, mb: 2 }}
            >
              {updating ? (
                <CircularProgress size={20} />
              ) : (
                "Auto Trigger Delivery"
              )}
            </Button>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Manual Delivery
            </Typography>

            {order.items.map((item, index) => (
              <Accordion key={index} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {item.title} (Qty: {item.quantity})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Credentials</InputLabel>
                    <Select
                      value={selectedCredentials[item._id] || ""}
                      onChange={(e) =>
                        setSelectedCredentials({
                          ...selectedCredentials,
                          [item._id]: e.target.value,
                        })
                      }
                      label="Select Credentials"
                    >
                      {inventory
                        .filter(
                          (inv) =>
                            inv.product._id === item.product && inv.isAvailable
                        )
                        .map((inv) => (
                          <MenuItem key={inv._id} value={inv._id}>
                            {inv.accountCredentials.substring(0, 50)}...
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </AccordionDetails>
              </Accordion>
            ))}

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Delivery Notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialog({ open: false })}>
            Cancel
          </Button>
          <Button
            onClick={handleManualDelivery}
            variant="contained"
            disabled={updating || Object.keys(selectedCredentials).length === 0}
          >
            {updating ? (
              <CircularProgress size={20} />
            ) : (
              "Complete Manual Delivery"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Management Dialog */}
      <Dialog
        open={inventoryDialog.open}
        onClose={() => setInventoryDialog({ open: false, item: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manage Inventory - {inventoryDialog.item?.title}
        </DialogTitle>
        <DialogContent>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Credentials</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory
                  .filter(
                    (inv) => inv.product._id === inventoryDialog.item?.product
                  )
                  .map((inv) => (
                    <TableRow key={inv._id}>
                      <TableCell>
                        <Typography variant="body2">
                          {inv.accountCredentials.substring(0, 100)}...
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={inv.status}
                          color={inv.isAvailable ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {inv.isAvailable && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              handleAssignCredentials(
                                inventoryDialog.item._id,
                                inv._id
                              )
                            }
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setInventoryDialog({ open: false, item: null })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderDetail;
