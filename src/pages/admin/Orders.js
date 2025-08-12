import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Print as PrintIcon,
} from "@mui/icons-material";
import inventoryAPI from "../../api/inventoryAPI";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  clearError,
} from "../../store/slices/orderSlice";

import { useCurrency } from "../../hooks/useCurrency";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const { adminOrders, loading, error } = useSelector((state) => state.orders);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    order: null,
  });
  const [newStatus, setNewStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [terminateDialog, setTerminateDialog] = useState({
    open: false,
    order: null,
  });
  const [terminateReason, setTerminateReason] = useState("");
  const [terminating, setTerminating] = useState(false);

  const [showManualDelivery, setShowManualDelivery] = useState(false);
  const [manualDeliveryText, setManualDeliveryText] = useState("");

  // Inventory selection state
  const [availableInventory, setAvailableInventory] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState({});
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showInventorySelection, setShowInventorySelection] = useState(false);

  const orderStatuses = [
    { value: "processing", label: "Processing", color: "primary" },
    { value: "delivered", label: "Delivered", color: "success" },
    { value: "cancelled", label: "Cancelled", color: "error" },
  ];

  const loadOrders = useCallback(async () => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      status: statusFilter,
    };

    // Remove empty params
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });

    dispatch(fetchAdminOrders(params));
  }, [dispatch, page, rowsPerPage, searchTerm, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSearch = () => {
    setPage(0);
    loadOrders();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
    toast.success("Orders refreshed");
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExpandOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleStatusDialogOpen = (order) => {
    setStatusDialog({ open: true, order });
    setNewStatus(order.status);
    setShowInventorySelection(false);
    setAvailableInventory(null);
    setSelectedInventory({});
    setShowManualDelivery(false);
    setManualDeliveryText("");
  };

  const handleStatusDialogClose = () => {
    setStatusDialog({ open: false, order: null });
    setNewStatus("");
    setShowInventorySelection(false);
    setAvailableInventory(null);
    setSelectedInventory({});
  };

  // Load available inventory for order
  const loadAvailableInventory = async (orderId) => {
    setLoadingInventory(true);
    try {
      const response = await inventoryAPI.getAvailableInventoryForOrder(
        orderId
      );
      setAvailableInventory(response.data.data);
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Failed to load available inventory");
    } finally {
      setLoadingInventory(false);
    }
  };

  // Handle status change and show inventory selection if needed
  const handleStatusChange = async (newStatusValue) => {
    setNewStatus(newStatusValue);

    if (newStatusValue === "delivered" && statusDialog.order) {
      setShowInventorySelection(true);
      await loadAvailableInventory(statusDialog.order._id);
      setShowManualDelivery(false);
      setManualDeliveryText("");
    } else {
      setShowInventorySelection(false);
      setAvailableInventory(null);
      setSelectedInventory({});
      setShowManualDelivery(false);
      setManualDeliveryText("");
    }
  };

  // Handle inventory selection for a product
  const handleInventorySelection = (productId, inventoryId, orderItemIndex) => {
    setSelectedInventory((prev) => ({
      ...prev,
      [productId]: {
        inventoryId,
        orderItemIndex,
      },
    }));
  };

  // Get order item for a product ID
  const getOrderItemForProduct = (productId) => {
    if (!statusDialog.order?.items) return null;
    return statusDialog.order.items.find(
      (item) => item.product === productId || item.productId === productId
    );
  };

  // Get quantity needed for a product
  const getQuantityNeeded = (productId) => {
    const orderItem = getOrderItemForProduct(productId);
    return orderItem ? orderItem.quantity : 1;
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === statusDialog.order.status) {
      handleStatusDialogClose();
      return;
    }

    // Validate inventory selection for delivered status
    if (newStatus === "delivered") {
      if (showManualDelivery) {
        if (!manualDeliveryText.trim()) {
          toast.error("Please enter manual delivery details");
          return;
        }
      } else if (availableInventory) {
        const requiredProducts = Object.keys(
          availableInventory.inventoryByProduct
        );
        const selectedProducts = Object.keys(selectedInventory);

        if (requiredProducts.length > 0 && selectedProducts.length === 0) {
          toast.error("Please select inventory items for delivery");
          return;
        }

        // Check if all required products have inventory selected
        const missingSelections = requiredProducts.filter(
          (productId) => !selectedInventory[productId]
        );
        if (missingSelections.length > 0) {
          const missingProductNames = missingSelections
            .map((productId) => {
              const productData =
                availableInventory.inventoryByProduct[productId];
              return productData?.product?.title || "Unknown Product";
            })
            .join(", ");
          toast.error(`Please select inventory for: ${missingProductNames}`);
          return;
        }

        // Validate quantity requirements
        for (const [productId, _selection] of Object.entries(
          selectedInventory
        )) {
          const quantityNeeded = getQuantityNeeded(productId);
          if (quantityNeeded > 1) {
            toast.warning(
              `Note: Order requires ${quantityNeeded} units of this product, but only 1 inventory item will be assigned.`
            );
          }
        }
      }
    }

    setUpdatingStatus(true);

    try {
      const updateData = {
        id: statusDialog.order._id,
        status: newStatus,
      };

      if (newStatus === "delivered") {
        if (showManualDelivery) {
          updateData.manualDelivery = manualDeliveryText;
        } else if (Object.keys(selectedInventory).length > 0) {
          updateData.inventoryAssignments = Object.values(
            selectedInventory
          ).map((selection) => ({
            inventoryId: selection.inventoryId,
            orderItemIndex: selection.orderItemIndex,
          }));
        }
      }

      await dispatch(updateAdminOrderStatus(updateData)).unwrap();

      toast.success("Order status updated successfully");
      handleStatusDialogClose();
      loadOrders();
    } catch (error) {
      toast.error(error || "Failed to update order status");
    } finally {
      setUpdatingStatus(false);
    }
  };



  const handleTerminateDialogClose = () => {
    setTerminateDialog({ open: false, order: null });
    setTerminateReason("");
  };

  const handleTerminateOrder = async () => {
    if (!terminateReason.trim()) {
      toast.error("Please provide a reason for termination");
      return;
    }

    setTerminating(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${terminateDialog.order._id}/terminate`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ reason: terminateReason }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Order terminated successfully");
        handleTerminateDialogClose();
        loadOrders();
      } else {
        toast.error(data.message || "Failed to terminate order");
      }
    } catch (error) {
      toast.error("Error terminating order");
      console.error("Error:", error);
    } finally {
      setTerminating(false);
    }
  };




  const getStatusColor = (status) => {
    const statusObj = orderStatuses.find(
      (s) => s.value === status?.toLowerCase()
    );
    return statusObj?.color || "default";
  };

  const getStatusLabel = (status) => {
    const statusObj = orderStatuses.find(
      (s) => s.value === status?.toLowerCase()
    );
    return statusObj?.label || status;
  };

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
            mb: 2,
          }}
        >
          <Typography variant="h3" component="h1" sx={{ fontWeight: "bold" }}>
            Orders
          </Typography>
          <Button
            variant="outlined"
            startIcon={
              refreshing ? <CircularProgress size={20} /> : <RefreshIcon />
            }
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Manage customer orders and track fulfillment
        </Typography>
      </MotionBox>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        sx={{ mb: 3 }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                {orderStatuses.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Orders Table */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : adminOrders?.orders?.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminOrders.orders.map((order) => (
                      <React.Fragment key={order._id}>
                        <TableRow hover>
                          <TableCell>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold" }}
                            >
                              #{order.orderNumber}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "medium" }}
                              >
                                {order.customer?.firstName || "N/A"}{" "}
                                {order.customer?.lastName || ""}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block" }}
                              >
                                {order.customer?.email || "No email provided"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block" }}
                              >
                                {order.customer?.phone || "No mobile provided"}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={getStatusLabel(order.status)}
                              color={getStatusColor(order.status)}
                              size="small"
                              onClick={() => handleStatusDialogOpen(order)}
                              sx={{ cursor: "pointer" }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {formatPrice(order.total, order.currency)}
                            </Typography>
                            {order.currency !== "LKR" && order.exchangeRate && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Rate: {order.exchangeRate.toFixed(2)}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Box>
                              {order.items.map((item, index) => (
                                <Typography
                                  key={index}
                                  variant="body2"
                                  sx={{
                                    display: index > 0 ? "block" : "initial",
                                    mt: index > 0 ? 0.5 : 0,
                                  }}
                                >
                                  {item.title}
                                </Typography>
                              ))}
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "center",
                              }}
                            >
                              <Tooltip title="View Order Details">
                                <IconButton
                                  onClick={() =>
                                    navigate(`/admin/orders/${order._id}`)
                                  }
                                  size="small"
                                  color="primary"
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Expand Details">
                                <IconButton
                                  onClick={() => handleExpandOrder(order._id)}
                                  size="small"
                                  color="info"
                                >
                                  {expandedOrder === order._id ? (
                                    <ExpandLessIcon />
                                  ) : (
                                    <ExpandMoreIcon />
                                  )}
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Print Order">
                                <IconButton
                                  onClick={() => window.print()}
                                  size="small"
                                  color="secondary"
                                >
                                  <PrintIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Order Details */}
                        <TableRow>
                          <TableCell colSpan={8} sx={{ p: 0 }}>
                            <Collapse in={expandedOrder === order._id}>
                              <Box sx={{ p: 3, bgcolor: "background.default" }}>
                                <Typography
                                  variant="h6"
                                  gutterBottom
                                  sx={{ fontWeight: "bold" }}
                                >
                                  Order Details
                                </Typography>

                                {/* Payment Method and Status */}
                                <Box sx={{ mb: 3 }}>
                                  <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    Payment & Order Information
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                                    <Typography variant="body2">
                                      <strong>Payment Method:</strong>{" "}
                                      {order.paymentMethod
                                        ? order.paymentMethod
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase()
                                            )
                                        : "Credit Card"}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Order Status:</strong>{" "}
                                      <Chip
                                        label={getStatusLabel(order.status)}
                                        color={getStatusColor(order.status)}
                                        size="small"
                                        sx={{ ml: 1 }}
                                      />
                                    </Typography>
                                  </Box>
                                </Box>

                                <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
                                  {/* Customer Info */}
                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      variant="subtitle2"
                                      gutterBottom
                                      sx={{ fontWeight: "bold" }}
                                    >
                                      Customer Information
                                    </Typography>
                                    <Typography variant="body2">
                                      {order.customer?.firstName || "N/A"}{" "}
                                      {order.customer?.lastName || ""}
                                    </Typography>
                                    <Typography variant="body2">
                                      {order.customer?.email ||
                                        "No email provided"}
                                    </Typography>
                                    <Typography variant="body2">
                                      {order.customer?.phone ||
                                        "No mobile provided"}
                                    </Typography>
                                  </Box>

                                  {/* Shipping Address */}
                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      variant="subtitle2"
                                      gutterBottom
                                      sx={{ fontWeight: "bold" }}
                                    >
                                      Shipping Address
                                    </Typography>
                                    {order.customer.address ? (
                                      <>
                                        <Typography variant="body2">
                                          {order.customer.address.street}
                                        </Typography>
                                        <Typography variant="body2">
                                          {order.customer.address.city},{" "}
                                          {order.customer.address.state}{" "}
                                          {order.customer.address.zipCode}
                                        </Typography>
                                        <Typography variant="body2">
                                          {order.customer.address.country}
                                        </Typography>
                                      </>
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        No address provided
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>

                                {/* Assigned Account & Inventory Details */}
                                {order.status === "delivered" && (
                                  <Box sx={{ mb: 3 }}>
                                    <Typography
                                      variant="subtitle2"
                                      gutterBottom
                                      sx={{ fontWeight: "bold" }}
                                    >
                                      Assigned Account & Inventory Details
                                    </Typography>
                                    <Box sx={{ display: "flex", gap: 4 }}>
                                      {/* Assigned Account */}
                                      <Box sx={{ flex: 1 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{ fontWeight: "medium", mb: 1 }}
                                        >
                                          Assigned Account:
                                        </Typography>
                                        {order.assignedAccount ? (
                                          <Box
                                            sx={{
                                              p: 2,
                                              bgcolor: "success.light",
                                              borderRadius: 1,
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              sx={{ fontWeight: "bold" }}
                                            >
                                              {order.assignedAccount.username ||
                                                order.assignedAccount.email}
                                            </Typography>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              {order.assignedAccount
                                                .accountType ||
                                                "Digital Account"}
                                            </Typography>
                                            {order.assignedAccount.password && (
                                              <Typography
                                                variant="body2"
                                                sx={{ mt: 0.5 }}
                                              >
                                                Password:{" "}
                                                {order.assignedAccount.password}
                                              </Typography>
                                            )}
                                          </Box>
                                        ) : (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            No account assigned
                                          </Typography>
                                        )}
                                      </Box>

                                      {/* Inventory Assignments */}
                                      <Box sx={{ flex: 1 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{ fontWeight: "medium", mb: 1 }}
                                        >
                                          Inventory Assigned:
                                        </Typography>
                                        {order.inventoryAssignments &&
                                        order.inventoryAssignments.length >
                                          0 ? (
                                          <Box>
                                            {order.inventoryAssignments.map(
                                              (assignment, index) => (
                                                <Box
                                                  key={index}
                                                  sx={{
                                                    p: 1.5,
                                                    bgcolor: "info.light",
                                                    borderRadius: 1,
                                                    mb: 1,
                                                  }}
                                                >
                                                  <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: "bold" }}
                                                  >
                                                    {assignment.inventoryItem
                                                      ?.productTitle ||
                                                      "Product"}
                                                  </Typography>
                                                  <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                  >
                                                    Inventory ID:{" "}
                                                    {assignment.inventoryId}
                                                  </Typography>
                                                  {assignment.inventoryItem
                                                    ?.serialNumber && (
                                                    <Typography
                                                      variant="body2"
                                                      sx={{ mt: 0.5 }}
                                                    >
                                                      Serial:{" "}
                                                      {
                                                        assignment.inventoryItem
                                                          .serialNumber
                                                      }
                                                    </Typography>
                                                  )}
                                                  {assignment.inventoryItem
                                                    ?.credentials && (
                                                    <Typography
                                                      variant="body2"
                                                      sx={{ mt: 0.5 }}
                                                    >
                                                      Credentials:{" "}
                                                      {
                                                        assignment.inventoryItem
                                                          .credentials
                                                      }
                                                    </Typography>
                                                  )}
                                                </Box>
                                              )
                                            )}
                                          </Box>
                                        ) : (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            No inventory assigned
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                )}

                                {/* Order Items */}
                                <Typography
                                  variant="subtitle2"
                                  gutterBottom
                                  sx={{ fontWeight: "bold" }}
                                >
                                  Order Items
                                </Typography>
                                <List dense>
                                  {order.items.map((item, index) => (
                                    <ListItem
                                      key={index}
                                      divider={index < order.items.length - 1}
                                    >
                                      <ListItemText
                                        primary={item.title}
                                        secondary={`Quantity: ${
                                          item.quantity
                                        } × ${formatPrice(
                                          item.price,
                                          order.currency
                                        )}`}
                                      />
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        {formatPrice(
                                          item.price * item.quantity,
                                          order.currency
                                        )}
                                      </Typography>
                                    </ListItem>
                                  ))}
                                </List>

                                <Divider sx={{ my: 2 }} />

                                {/* Order Summary */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <Box sx={{ minWidth: 200 }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 1,
                                      }}
                                    >
                                      <Typography variant="body2">
                                        Subtotal:
                                      </Typography>
                                      <Typography variant="body2">
                                        {formatPrice(
                                          order.subtotal,
                                          order.currency
                                        )}
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 1,
                                      }}
                                    >
                                      <Typography variant="body2">
                                        Shipping:
                                      </Typography>
                                      <Typography variant="body2">
                                        {formatPrice(
                                          order.shipping,
                                          order.currency
                                        )}
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 1,
                                      }}
                                    >
                                      <Typography variant="body2">
                                        Tax:
                                      </Typography>
                                      <Typography variant="body2">
                                        {formatPrice(order.tax, order.currency)}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle1"
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Total:
                                      </Typography>
                                      <Typography
                                        variant="subtitle1"
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        {formatPrice(
                                          order.total,
                                          order.currency
                                        )}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>

                                {order.notes && (
                                  <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography
                                      variant="subtitle2"
                                      gutterBottom
                                      sx={{ fontWeight: "bold" }}
                                    >
                                      Order Notes
                                    </Typography>
                                    <Typography variant="body2">
                                      {order.notes}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={adminOrders.pagination?.total || 0}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No orders found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || statusFilter
                  ? "Try adjusting your filters"
                  : "Orders will appear here when customers place them"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </MotionCard>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog.open}
        onClose={handleStatusDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Order #{statusDialog.order?.orderNumber}
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {orderStatuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {newStatus === "delivered" && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showManualDelivery}
                    onChange={(e) => setShowManualDelivery(e.target.checked)}
                  />
                }
                label="Use Manual Delivery"
              />
              {showManualDelivery && (
                <TextField
                  value={manualDeliveryText}
                  onChange={(e) => setManualDeliveryText(e.target.value)}
                  label="Manual Delivery Details"
                  multiline
                  rows={4}
                  fullWidth
                  sx={{ mt: 2 }}
                  helperText="Enter delivery information, credentials, or notes here"
                />
              )}
            </Box>
          )}

          {/* Inventory Selection for Delivered Status */}
          {showInventorySelection && !showManualDelivery && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Select Inventory for Delivery
              </Typography>

              {/* Order Items Summary */}
              {statusDialog.order?.items && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: "background.default",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
                    Order Items to Fulfill:
                  </Typography>
                  {statusDialog.order.items.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 0.5,
                      }}
                    >
                      <Typography variant="body2">{item.title}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        Qty: {item.quantity}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {loadingInventory ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ ml: 1 }}>
                    Loading available inventory...
                  </Typography>
                </Box>
              ) : availableInventory &&
                Object.keys(availableInventory.inventoryByProduct).length >
                  0 ? (
                <Box>
                  {Object.entries(availableInventory.inventoryByProduct).map(
                    ([productId, productData], productIndex) => {
                      const orderItem = getOrderItemForProduct(productId);
                      const quantityNeeded = getQuantityNeeded(productId);

                      return (
                        <Accordion key={productId} defaultExpanded>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {productData.product.title}
                                </Typography>
                                {orderItem && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Order Quantity: {quantityNeeded} • Price:{" "}
                                    {orderItem.price}
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Chip
                                  label={`${productData.inventory.length} available`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                {quantityNeeded > 1 && (
                                  <Chip
                                    label={`Need ${quantityNeeded}`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            {quantityNeeded > 1 && (
                              <Alert severity="info" sx={{ mb: 2 }}>
                                This order requires {quantityNeeded} units of
                                this product. Please select the best available
                                inventory item. Note: Only 1 inventory item will
                                be assigned per product.
                              </Alert>
                            )}

                            <RadioGroup
                              value={
                                selectedInventory[productId]?.inventoryId || ""
                              }
                              onChange={(e) =>
                                handleInventorySelection(
                                  productId,
                                  e.target.value,
                                  productIndex
                                )
                              }
                            >
                              {productData.inventory.map((item) => (
                                <FormControlLabel
                                  key={item._id}
                                  value={item._id}
                                  control={<Radio />}
                                  label={
                                    <Box sx={{ py: 1 }}>
                                      <Typography
                                        variant="body2"
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Account:{" "}
                                        {item.accountCredentials?.substring(
                                          0,
                                          50
                                        ) || "N/A"}
                                        {item.accountCredentials?.length > 50 &&
                                          "..."}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Added:{" "}
                                        {new Date(
                                          item.createdAt
                                        ).toLocaleDateString()}{" "}
                                        • Status: {item.status || "available"}
                                      </Typography>
                                      {item.notes && (
                                        <Typography
                                          variant="caption"
                                          display="block"
                                          color="text.secondary"
                                        >
                                          Notes: {item.notes}
                                        </Typography>
                                      )}
                                      {item.usageLimit && (
                                        <Typography
                                          variant="caption"
                                          display="block"
                                          color="primary.main"
                                        >
                                          Usage Limit: {item.usageLimit} users
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  sx={{
                                    border:
                                      selectedInventory[productId]
                                        ?.inventoryId === item._id
                                        ? "2px solid"
                                        : "1px solid transparent",
                                    borderColor:
                                      selectedInventory[productId]
                                        ?.inventoryId === item._id
                                        ? "primary.main"
                                        : "transparent",
                                    borderRadius: 1,
                                    mb: 1,
                                    p: 1,
                                  }}
                                />
                              ))}
                            </RadioGroup>

                            {productData.inventory.length === 0 && (
                              <Alert severity="warning">
                                No inventory available for this product. Please
                                add inventory items first.
                              </Alert>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      );
                    }
                  )}

                  {/* Selection Summary */}
                  {Object.keys(selectedInventory).length > 0 && (
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: "success.light",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ fontWeight: "bold" }}
                      >
                        Selected Inventory Summary:
                      </Typography>
                      {Object.entries(selectedInventory).map(
                        ([productId, selection]) => {
                          const productData =
                            availableInventory.inventoryByProduct[productId];
                          const selectedItem = productData?.inventory.find(
                            (item) => item._id === selection.inventoryId
                          );
                          return (
                            <Typography
                              key={productId}
                              variant="body2"
                              sx={{ py: 0.5 }}
                            >
                              • {productData?.product?.title}:{" "}
                              {selectedItem?.accountCredentials?.substring(
                                0,
                                30
                              ) || "N/A"}
                              ...
                            </Typography>
                          );
                        }
                      )}
                    </Box>
                  )}
                </Box>
              ) : availableInventory &&
                Object.keys(availableInventory.inventoryByProduct).length ===
                  0 ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No inventory available for the products in this order. Please
                  add inventory items before marking as delivered.
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate("/admin/products-store")}
                    >
                      Go to Inventory Management
                    </Button>
                  </Box>
                </Alert>
              ) : null}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose}>Cancel</Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={
              updatingStatus || newStatus === statusDialog.order?.status
            }
          >
            {updatingStatus ? <CircularProgress size={24} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terminate Order Dialog */}
      <Dialog
        open={terminateDialog.open}
        onClose={handleTerminateDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Terminate Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Order #{terminateDialog.order?.orderNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This action will cancel the order and notify the customer. Please
            provide a reason for termination.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for termination"
            value={terminateReason}
            onChange={(e) => setTerminateReason(e.target.value)}
            placeholder="Please explain why this order is being terminated..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTerminateDialogClose}>Cancel</Button>
          <Button
            onClick={handleTerminateOrder}
            variant="contained"
            color="error"
            disabled={terminating || !terminateReason.trim()}
          >
            {terminating ? <CircularProgress size={24} /> : "Terminate Order"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Orders;
