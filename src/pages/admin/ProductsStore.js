import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Badge,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Snackbar,
  Tooltip,
  LinearProgress,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Inventory as InventoryIcon,

  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon,
  Assignment as OrderIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import inventoryAPI from "../../api/inventoryAPI";
import api from "../../api/api";
import { fetchAdminProducts } from "../../store/slices/productSlice";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const ProductsStore = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { adminProducts, loading: productsLoading } = useSelector(
    (state) => state.products
  );
  const products = adminProducts.products || [];

  // Get orderId from URL params if coming from order management
  const urlParams = new URLSearchParams(location.search);
  const orderId = urlParams.get("orderId");

  const [tabValue, setTabValue] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const [openOrderDeliveryDialog, setOpenOrderDeliveryDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [selectedCredentials, setSelectedCredentials] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState("");


  const [newInventoryItem, setNewInventoryItem] = useState({
    product: "",
    accountCredentials: "",
    notes: "",
    maxAssignments: 1,
  });

  useEffect(() => {
    fetchInventory();

    dispatch(fetchAdminProducts()); // Fetch products for inventory management

    // If orderId is present, fetch order details and show delivery dialog
    if (orderId) {
      fetchOrderDetails();
      setOpenOrderDeliveryDialog(true);
    }
  }, [orderId, dispatch]);

  const fetchInventory = async () => {
    console.log('🔄 Starting inventory fetch...');
    setLoading(true);
    try {
      console.log('📡 Making API call to getInventory with params:', { limit: 100 });
      const response = await inventoryAPI.getInventory({ limit: 100 });
      console.log('✅ Inventory API response received:', response);
      console.log('📊 Response data structure:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'No data'
      });
      
      const inventoryData = response.data.data || [];
      console.log('📦 Processed inventory data:', {
        length: inventoryData.length,
        items: inventoryData.slice(0, 3) // Log first 3 items for debugging
      });
      
      setInventory(inventoryData);
      console.log('✅ Inventory state updated successfully');
    } catch (error) {
      console.error('❌ Inventory fetch error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      
      if (error.response) {
        console.error('🔍 Server response error:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          baseURL: error.config?.baseURL
        });
      } else if (error.request) {
        console.error('🌐 Network error - no response received:', error.request);
      } else {
        console.error('⚙️ Request setup error:', error.message);
      }
      
      toast.error(`Failed to fetch inventory: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('🏁 Inventory fetch completed');
    }
  };



  const fetchOrderDetails = async () => {
    console.log('📋 Fetching order details for orderId:', orderId);
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      console.log('✅ Order details response:', response.data);
      setOrderDetails(response.data.data);
    } catch (error) {
      console.error('❌ Failed to fetch order details:', error);
      toast.error(`Failed to fetch order details: ${error.message}`);
    }
  };

  const handleAddInventoryItem = async () => {
    if (!newInventoryItem.product || !newInventoryItem.accountCredentials) {
      toast.error("Please fill in all required fields");
      return;
    }

    console.log('➕ Adding new inventory item:', newInventoryItem);
    try {
      const response = await inventoryAPI.addInventory({
        product: newInventoryItem.product,
        accountCredentials: newInventoryItem.accountCredentials,
        notes: newInventoryItem.notes,
        maxAssignments: newInventoryItem.maxAssignments,
      });
      
      console.log('✅ Add inventory response:', response.data);
      setInventory((prev) => [...prev, response.data.data]);
      setNewInventoryItem({ product: "", accountCredentials: "", notes: "", maxAssignments: 1 });
      setOpenAddDialog(false);
      toast.success("Inventory item added successfully");
    } catch (error) {
      console.error('❌ Add inventory error:', error);
      toast.error(`Failed to add inventory item: ${error.message}`);
    }
  };

  const handleDeleteInventoryItem = async (itemId) => {
    try {
      await inventoryAPI.deleteInventory(itemId);
      setInventory((prev) => prev.filter((item) => item._id !== itemId));
      toast.success("Inventory item deleted successfully");
    } catch (error) {
      toast.error("Failed to delete inventory item");
    }
  };

  const handleEditInventoryItem = (item) => {
    setEditingItem({
      ...item,
      accountCredentials: item.accountCredentials,
      notes: item.notes || "",
      maxAssignments: item.maxAssignments || 1
    });
    setOpenEditDialog(true);
  };

  const handleUpdateInventoryItem = async () => {
    if (!editingItem.accountCredentials) {
      toast.error("Account credentials are required");
      return;
    }

    if (!editingItem.maxAssignments || editingItem.maxAssignments < 1 || editingItem.maxAssignments > 100) {
      toast.error("Maximum assignments must be between 1 and 100");
      return;
    }

    try {
      const response = await inventoryAPI.updateInventory(editingItem._id, {
        accountCredentials: editingItem.accountCredentials,
        notes: editingItem.notes,
        maxAssignments: editingItem.maxAssignments
      });
      
      setInventory((prev) => 
        prev.map((item) => 
          item._id === editingItem._id 
            ? { ...item, ...response.data.data }
            : item
        )
      );
      
      setOpenEditDialog(false);
      setEditingItem(null);
      toast.success("Inventory item updated successfully");
    } catch (error) {
      console.error('Update inventory error:', error);
      if (error.response?.status === 403) {
        toast.error(error.response.data.message || "Cannot update expired inventory item");
      } else {
        toast.error(`Failed to update inventory item: ${error.message}`);
      }
    }
  };

  const handleManualDelivery = async (itemId, orderId) => {
    try {
      // Use the proper assignment-based delivery system
      const response = await api.post(`/admin/inventory/${itemId}/assign`, {
        orderId: orderId,
        notes: `Manually delivered to order: ${orderId}`,
      });

      // Update local state based on server response
      setInventory((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? {
                ...item,
                assignmentCount: (item.assignmentCount || 0) + 1,
                status: response.data.data.status, // Server determines if it should be 'delivered' or still 'available'
                isUsed: response.data.data.isUsed,
                deliveredAt: response.data.data.deliveredAt,
              }
            : item
        )
      );
      toast.success("Item assigned successfully");
    } catch (error) {
      toast.error("Failed to assign item");
    }
  };

  const handleSelectCredentials = (itemId, selected) => {
    setSelectedCredentials((prev) => ({
      ...prev,
      [itemId]: selected,
    }));
  };

  const handleOrderDelivery = async () => {
    const selectedItems = Object.keys(selectedCredentials).filter(
      (key) => selectedCredentials[key]
    );

    if (selectedItems.length === 0) {
      toast.error("Please select at least one inventory item to deliver");
      return;
    }

    try {
      setLoading(true);

      // Create inventory assignments instead of directly updating status
      const inventoryAssignments = selectedItems.map(itemId => ({
        inventoryId: itemId,
        orderItemIndex: 0 // You may need to map this properly based on your order structure
      }));

      // Update order status with inventory assignments
      await api.put(`/admin/orders/${orderId}/status`, {
        status: "delivered",
        deliveryNotes: deliveryNotes,
        inventoryAssignments: inventoryAssignments,
      });

      // Update order status to delivered
      await api.put(`/admin/orders/${orderId}/status`, {
        status: "delivered",
        deliveryNotes: deliveryNotes,
      });

      // Send delivery email with credentials
      const selectedInventoryItems = inventory.filter(
        (item) => item && selectedItems.includes(item._id)
      );
      const credentialsText = selectedInventoryItems
        .map(
          (item) =>
            `Product: ${item.product?.title}\nCredentials: ${item.accountCredentials}`
        )
        .join("\n\n");

      // Here you would typically send an email to the customer
      // For now, we'll just show a success message

      toast.success(
        `Order delivered successfully! ${selectedItems.length} item(s) sent to customer.`
      );

      // Reset state
      setSelectedCredentials({});
      setDeliveryNotes("");
      setOpenOrderDeliveryDialog(false);

      // Refresh inventory
      fetchInventory();

      // Navigate back to order details
      setTimeout(() => {
        navigate(`/admin/orders/${orderId}`);
      }, 2000);
    } catch (error) {
      console.error("Delivery error:", error);
      toast.error("Failed to process delivery. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  const getInventoryStats = () => {
    // Add safety checks to prevent undefined errors
    const safeInventory = inventory.filter(
      (item) => item && typeof item === "object"
    );
    const available = safeInventory.filter(
      (item) => item.status === "available"
    ).length;
    const delivered = safeInventory.filter(
      (item) => item.status === "delivered"
    ).length;
    const pending = safeInventory.filter(
      (item) => item.status === "pending"
    ).length;
    const total = safeInventory.length;

    return { available, delivered, pending, total };
  };

  const stats = getInventoryStats();

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {orderId && (
              <IconButton onClick={() => navigate(`/admin/orders/${orderId}`)}>
                <BackIcon />
              </IconButton>
            )}
            <Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{ fontWeight: "bold" }}
              >
                {orderId ? "Order Inventory Management" : "Products Store"}
              </Typography>
              {orderId && orderDetails && (
                <Typography
                  variant="h6"
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <OrderIcon fontSize="small" />
                  Order #{orderDetails.orderNumber}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            {!orderId && (
              <>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddDialog(true)}
                >
                  Add Inventory
                </Button>
              </>
            )}
            {orderId && (
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={() => setOpenOrderDeliveryDialog(true)}
                color="success"
              >
                Process Order Delivery
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary">
          {orderId
            ? "Select inventory items to deliver to the customer for this order"
            : "Manage your product inventory and configure automatic delivery"}
        </Typography>

        {orderId && orderDetails && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Customer:</strong> {orderDetails.customer.firstName}{" "}
              {orderDetails.customer.lastName} ({orderDetails.customer.email})
              <br />
              <strong>Order Total:</strong> {orderDetails.currency}{" "}
              {orderDetails.total}
              <br />
              <strong>Items:</strong> {orderDetails.items?.length || 0}{" "}
              product(s)
            </Typography>
          </Alert>
        )}
      </MotionBox>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
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
                    sx={{ fontWeight: "bold", color: "success.main" }}
                  >
                    {stats.available}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Items
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: "success.main" }} />
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
                    sx={{ fontWeight: "bold", color: "primary.main" }}
                  >
                    {stats.delivered}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delivered Items
                  </Typography>
                </Box>
                <SendIcon sx={{ fontSize: 40, color: "primary.main" }} />
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
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
                    sx={{ fontWeight: "bold", color: "warning.main" }}
                  >
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Items
                  </Typography>
                </Box>
                <CircularProgress
                  sx={{ fontSize: 40, color: "warning.main" }}
                />
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
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
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Items
                  </Typography>
                </Box>
                <InventoryIcon sx={{ fontSize: 40, color: "text.secondary" }} />
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>



      {/* Inventory Table */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            Inventory Management
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Credentials</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assignments</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                <TableBody>
                  {inventory
                    .filter((item) => item && typeof item === "object")
                    .map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {item.product?.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {item.accountCredentials.substring(0, 20)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status}
                            color={
                              item.status === "available"
                                ? "success"
                                : item.status === "delivered"
                                ? "primary"
                                : "default"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.assignmentCount || 0} / {item.maxAssignments || 1}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(item.assignmentCount || 0) >= (item.maxAssignments || 1) ? "Full" : "Available"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditInventoryItem(item)}
                              title="Edit Credentials"
                            >
                              <EditIcon />
                            </IconButton>
                            {item.status === "available" && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() =>
                                  handleManualDelivery(item._id, "manual-order")
                                }
                                title="Manual Delivery"
                              >
                                <SendIcon />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteInventoryItem(item._id)
                              }
                              title="Delete"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </MotionCard>

      {/* Add Inventory Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={newInventoryItem.product}
                  label="Product"
                  onChange={(e) =>
                    setNewInventoryItem((prev) => ({
                      ...prev,
                      product: e.target.value,
                    }))
                  }
                  disabled={productsLoading}
                >
                  <MenuItem value="">
                    <em>
                      {productsLoading
                        ? "Loading products..."
                        : "Select a product"}
                    </em>
                  </MenuItem>
                  {products?.map((product) => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.title} (Usage Limit: {product.usageLimit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Credentials"
                value={newInventoryItem.accountCredentials}
                onChange={(e) =>
                  setNewInventoryItem((prev) => ({
                    ...prev,
                    accountCredentials: e.target.value,
                  }))
                }
                multiline
                rows={3}
                placeholder="Username: example@email.com\nPassword: password123\nAdditional info..."
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Assignments"
                type="number"
                value={newInventoryItem.maxAssignments}
                onChange={(e) =>
                  setNewInventoryItem((prev) => ({
                    ...prev,
                    maxAssignments: parseInt(e.target.value) || 1,
                  }))
                }
                inputProps={{ min: 1, max: 100 }}
                helperText="How many times this account can be assigned to customers"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={newInventoryItem.notes}
                onChange={(e) =>
                  setNewInventoryItem((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                multiline
                rows={2}
                placeholder="Any additional notes about this account..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddInventoryItem} variant="contained">
            Add Item
          </Button>
        </DialogActions>
      </Dialog>



      {/* Order Delivery Dialog */}
      <Dialog
        open={openOrderDeliveryDialog}
        onClose={() => setOpenOrderDeliveryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <OrderIcon />
            Process Order Delivery
            {orderDetails && (
              <Chip
                label={`Order #${orderDetails.orderNumber}`}
                color="primary"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {orderDetails && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Customer:</strong> {orderDetails.customer.firstName}{" "}
                  {orderDetails.customer.lastName}
                  <br />
                  <strong>Email:</strong> {orderDetails.customer.email}
                  <br />
                  <strong>Order Total:</strong> {orderDetails.currency}{" "}
                  {orderDetails.total}
                </Typography>
              </Alert>

              <Typography variant="h6" gutterBottom>
                Select Inventory Items to Deliver
              </Typography>

              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Select</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Credentials Preview</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory
                      .filter((item) => item && item.status === "available")
                      .map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={
                                    selectedCredentials[item._id] || false
                                  }
                                  onChange={(e) =>
                                    handleSelectCredentials(
                                      item._id,
                                      e.target.checked
                                    )
                                  }
                                />
                              }
                              label=""
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "medium" }}
                            >
                              {item.product?.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                              }}
                            >
                              {item.accountCredentials.substring(0, 30)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.status}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TextField
                fullWidth
                label="Delivery Notes (Optional)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="Add any special instructions or notes for the customer..."
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDeliveryDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleOrderDelivery}
            variant="contained"
            color="success"
            startIcon={<EmailIcon />}
            disabled={
              Object.keys(selectedCredentials).filter(
                (key) => selectedCredentials[key]
              ).length === 0
            }
          >
            Deliver Selected Items
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setEditingItem(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Inventory Item</DialogTitle>
        <DialogContent>
          {editingItem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Product"
                  value={editingItem.product?.title || ""}
                  disabled
                  helperText="Product cannot be changed"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Account Credentials"
                  value={editingItem.accountCredentials}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      accountCredentials: e.target.value,
                    }))
                  }
                  multiline
                  rows={4}
                  placeholder="Username: example@email.com\nPassword: password123\nAdditional info..."
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  value={editingItem.notes}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  multiline
                  rows={2}
                  placeholder="Any additional notes about this account..."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Assignments"
                  type="number"
                  value={editingItem.maxAssignments}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      maxAssignments: parseInt(e.target.value) || 1,
                    }))
                  }
                  inputProps={{ min: 1, max: 100 }}
                  helperText="Maximum number of times this item can be assigned (1-100)"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2, bgcolor: "background.default", borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {editingItem.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {new Date(editingItem.createdAt).toLocaleDateString()}
                  </Typography>
                  {editingItem.deliveredAt && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Delivered:</strong> {new Date(editingItem.deliveredAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenEditDialog(false);
              setEditingItem(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateInventoryItem} 
            variant="contained"
            startIcon={<EditIcon />}
          >
            Update Item
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductsStore;
