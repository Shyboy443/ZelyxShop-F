import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  PlayArrow as TriggerIcon,
  Assessment as StatsIcon,
  Settings as SettingsIcon,
  LocalShipping as DeliveryIcon,
  Inventory as InventoryIcon,
  Assessment as LogsIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import inventoryAPI from "../../api/inventoryAPI";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const DeliveryManagement = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [processingDelivery, setProcessingDelivery] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deliveryDialog, setDeliveryDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDeliveryStats(),
        loadAutoDeliveryProducts(),
        loadPendingDeliveries(),
      ]);
    } catch (error) {
      toast.error("Failed to load delivery data");
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryStats = async () => {
    try {
      const response = await inventoryAPI.getDeliveryStats();
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to load delivery stats:", error);
    }
  };

  const loadAutoDeliveryProducts = async () => {
    try {
      const response = await inventoryAPI.getAutoDeliverySettings();
      const products = response.data.data || [];
      setProducts(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error("Failed to load auto-delivery products:", error);
      setProducts([]);
    }
  };

  const loadPendingDeliveries = async () => {
    try {
      const response = await inventoryAPI.getPendingDeliveries();
      const deliveries = response.data.data?.orders || [];
      setPendingDeliveries(Array.isArray(deliveries) ? deliveries : []);
    } catch (error) {
      console.error("Failed to load pending deliveries:", error);
      setPendingDeliveries([]);
    }
  };

  const handleToggleAutoDelivery = async (productId, currentValue) => {
    try {
      await inventoryAPI.updateAutoDeliverySettings(productId, {
        autoDelivery: !currentValue,
      });
      toast.success("Auto-delivery setting updated");
      loadAutoDeliveryProducts();
    } catch (error) {
      toast.error("Failed to update auto-delivery setting");
    }
  };

  const handleProcessAllDeliveries = async () => {
    setProcessingDelivery(true);
    try {
      const response = await inventoryAPI.processDeliveries();
      toast.success(
        `Processed ${response.data.data.processedOrders} orders successfully`
      );
      loadData();
    } catch (error) {
      toast.error("Failed to process deliveries");
    } finally {
      setProcessingDelivery(false);
    }
  };

  const handleTriggerOrderDelivery = async (orderId) => {
    try {
      const response = await inventoryAPI.triggerOrderDelivery(orderId);
      if (response.data.success) {
        toast.success("Delivery triggered successfully");
        loadData();
      } else {
        toast.error(response.data.message || "Failed to trigger delivery");
      }
    } catch (error) {
      toast.error("Failed to trigger delivery");
    }
  };

  const handleViewOrderDelivery = async (orderId) => {
    try {
      const response = await inventoryAPI.getOrderDeliveryStatus(orderId);
      setSelectedOrder(response.data.data);
      setDeliveryDialog(true);
    } catch (error) {
      toast.error("Failed to load order delivery status");
    }
  };

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        background: `linear-gradient(135deg, ${theme.palette[color].main}20, ${theme.palette[color].main}10)`,
        border: `1px solid ${theme.palette[color].main}30`,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: theme.palette[color].main }}
            >
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box sx={{ color: theme.palette[color].main }}>{icon}</Box>
        </Box>
      </CardContent>
    </MotionCard>
  );

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
          <CircularProgress />
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            Delivery Management
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<TriggerIcon />}
              onClick={handleProcessAllDeliveries}
              disabled={processingDelivery}
            >
              {processingDelivery ? "Processing..." : "Process All Deliveries"}
            </Button>
            <Button
              component={Link}
              to="/admin/delivery-logs"
              variant="outlined"
              startIcon={<LogsIcon />}
              color="secondary"
            >
              View Delivery Logs
            </Button>
          </Box>
        </Box>
      </MotionBox>

      {/* Statistics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Auto-Delivery Items"
              value={stats.totalAutoDeliveryItems || 0}
              icon={<DeliveryIcon sx={{ fontSize: 40 }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Delivered Items"
              value={stats.deliveredItems || 0}
              icon={<StatsIcon sx={{ fontSize: 40 }} />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Deliveries"
              value={stats.pendingDeliveries || 0}
              icon={<InventoryIcon sx={{ fontSize: 40 }} />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Available Inventory"
              value={Object.values(stats.inventoryStats || {}).reduce(
                (sum, product) => sum + (product.available || 0),
                0
              )}
              icon={<InventoryIcon sx={{ fontSize: 40 }} />}
              color="info"
            />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Auto-Delivery Products */}
        <Grid item xs={12} md={6}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center" }}
              >
                <SettingsIcon sx={{ mr: 1 }} />
                Auto-Delivery Settings
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Auto-Delivery</TableCell>
                      <TableCell>Available Inventory</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>{product.title}</TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={product.autoDelivery || false}
                                onChange={() =>
                                  handleToggleAutoDelivery(
                                    product._id,
                                    product.autoDelivery
                                  )
                                }
                                size="small"
                              />
                            }
                            label={
                              product.autoDelivery ? "Enabled" : "Disabled"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              stats?.inventoryStats?.[product._id]?.available ||
                              0
                            }
                            color={
                              stats?.inventoryStats?.[product._id]?.available >
                              0
                                ? "success"
                                : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Pending Deliveries */}
        <Grid item xs={12} md={6}>
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center" }}
              >
                <DeliveryIcon sx={{ mr: 1 }} />
                Pending Deliveries
              </Typography>
              {!Array.isArray(pendingDeliveries) ||
              pendingDeliveries.length === 0 ? (
                <Alert severity="info">No pending deliveries found</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingDeliveries.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell>{order.orderNumber}</TableCell>
                          <TableCell>
                            {order.customer?.name || order.customer?.email}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${
                                order.items?.filter(
                                  (item) =>
                                    item.autoDelivery &&
                                    item.deliveryStatus !== "delivered"
                                ).length || 0
                              } pending`}
                              color="warning"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleViewOrderDelivery(order._id)
                                }
                              >
                                <StatsIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Trigger Delivery">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleTriggerOrderDelivery(order._id)
                                }
                                color="primary"
                              >
                                <TriggerIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Order Delivery Details Dialog */}
      <Dialog
        open={deliveryDialog}
        onClose={() => setDeliveryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Order Delivery Status</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order #{selectedOrder.orderNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Customer:{" "}
                {selectedOrder.customer?.name || selectedOrder.customer?.email}
              </Typography>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Auto-Delivery</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Delivered At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {item.product?.title || "Unknown Product"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.autoDelivery ? "Yes" : "No"}
                            color={item.autoDelivery ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.deliveryStatus || "pending"}
                            color={
                              item.deliveryStatus === "delivered"
                                ? "success"
                                : item.deliveryStatus === "failed"
                                ? "error"
                                : "warning"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {item.deliveredAt
                            ? new Date(item.deliveredAt).toLocaleString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DeliveryManagement;
