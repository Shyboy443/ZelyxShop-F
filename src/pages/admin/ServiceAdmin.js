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
  Avatar,
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
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  fetchAdminProducts,
  deleteAdminProduct,
  clearError,
} from "../../store/slices/productSlice";
import { fetchAdminCategories } from "../../store/slices/categorySlice";
import { useCurrency } from "../../hooks/useCurrency";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const ServiceAdmin = () => {
  const dispatch = useDispatch();
  const { formatPrice } = useCurrency();

  const { adminProducts, loading, error } = useSelector(
    (state) => state.products
  );
  const { adminCategories } = useSelector((state) => state.categories);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    product: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAutoDelivery, setUpdatingAutoDelivery] = useState({});

  const loadProducts = useCallback(async () => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
    };

    // Remove empty params
    Object.keys(params).forEach((key) => {
      if (!params[key]) delete params[key];
    });

    dispatch(fetchAdminProducts(params));
  }, [dispatch, page, rowsPerPage, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    loadProducts();
    dispatch(fetchAdminCategories());
  }, [loadProducts, dispatch]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSearch = () => {
    setPage(0);
    loadProducts();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
    toast.success("Services refreshed");
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (product) => {
    setDeleteDialog({ open: true, product });
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteAdminProduct(deleteDialog.product._id)).unwrap();
      toast.success("Service deleted successfully");
      setDeleteDialog({ open: false, product: null });
      loadProducts();
    } catch (error) {
      toast.error(error || "Failed to delete service");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, product: null });
  };

  const handleAutoDeliveryToggle = async (productId, currentValue) => {
    setUpdatingAutoDelivery(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ autoDelivery: !currentValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update auto-delivery setting');
      }

      toast.success(`Auto-delivery ${!currentValue ? 'enabled' : 'disabled'} successfully`);
      loadProducts(); // Refresh the products list
    } catch (error) {
      console.error('Error updating auto-delivery:', error);
      toast.error('Failed to update auto-delivery setting');
    } finally {
      setUpdatingAutoDelivery(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handlePriorityChange = async (productId, newPriority) => {
    setUpdatingAutoDelivery(prev => ({ ...prev, [productId]: true }));
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ deliveryPriority: newPriority }),
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery priority');
      }

      toast.success('Delivery priority updated successfully');
      loadProducts();
    } catch (error) {
      console.error('Error updating delivery priority:', error);
      toast.error('Failed to update delivery priority');
    } finally {
      setUpdatingAutoDelivery(prev => ({ ...prev, [productId]: false }));
    }
  };

  const getPriorityLabel = (priority) => {
    if (priority <= 3) return 'High';
    if (priority <= 7) return 'Medium';
    return 'Low';
  };

  const getPriorityColor = (priority) => {
    if (priority <= 3) return 'error';
    if (priority <= 7) return 'warning';
    return 'success';
  };

  const getStatusChip = (product) => {
    if (product.availability === 0) {
      return <Chip label="Unavailable" color="error" size="small" />;
    }
    if (product.featured) {
      return <Chip label="Featured" color="primary" size="small" />;
    }
    if (product.onSale) {
      return <Chip label="On Sale" color="secondary" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
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
            Services
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
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
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={RouterLink}
              to="/admin/products/new"
            >
              Add Service
            </Button>
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Manage your service catalog
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
              placeholder="Search services..."
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
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {adminCategories?.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={handleSearch}
            >
              Filter
            </Button>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Products Table */}
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
          ) : adminProducts?.products?.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Availability</TableCell>
                      <TableCell>Auto-Delivery</TableCell>
                      <TableCell>Delivery Priority</TableCell>
                      <TableCell>Available Inventory</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminProducts.products.map((product) => (
                      <TableRow key={product._id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              src={product.images?.[0]}
                              variant="rounded"
                              sx={{ width: 50, height: 50 }}
                            >
                              {product.title?.charAt(0) || "?"}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: "bold" }}
                              >
                                {product.title}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {product.slug}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  mt: 0.5,
                                }}
                              >
                                {product.featured && (
                                  <Tooltip title="Featured Service">
                                    <StarIcon
                                      sx={{
                                        fontSize: 16,
                                        color: "primary.main",
                                      }}
                                    />
                                  </Tooltip>
                                )}
                                {product.onSale && (
                                  <Chip
                                    label="Sale"
                                    color="secondary"
                                    size="small"
                                    sx={{ height: 16, fontSize: "0.7rem" }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {product.category?.name || "Uncategorized"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {formatPrice(product.price, "LKR")}
                            </Typography>
                            {product.salePrice && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ textDecoration: "line-through" }}
                              >
                                {formatPrice(product.salePrice, "LKR")}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              product.availability > 0
                                ? "Available"
                                : "Unavailable"
                            }
                            color={
                              product.availability > 0 ? "success" : "error"
                            }
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={product.autoDelivery || false}
                                onChange={() => handleAutoDeliveryToggle(product._id, product.autoDelivery)}
                                disabled={updatingAutoDelivery[product._id]}
                                size="small"
                                color="primary"
                              />
                            }
                            label={product.autoDelivery ? "Enabled" : "Disabled"}
                            labelPlacement="end"
                            sx={{ margin: 0 }}
                          />
                        </TableCell>

                        <TableCell>
                          {product.autoDelivery ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FormControl size="small" sx={{ minWidth: 80 }}>
                                <Select
                                  value={product.deliveryPriority || 5}
                                  onChange={(e) => handlePriorityChange(product._id, e.target.value)}
                                  disabled={updatingAutoDelivery[product._id]}
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((priority) => (
                                    <MenuItem key={priority} value={priority}>
                                      {priority} {priority === 1 ? '(Highest)' : priority === 10 ? '(Lowest)' : ''}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <Chip
                                label={getPriorityLabel(product.deliveryPriority || 5)}
                                color={getPriorityColor(product.deliveryPriority || 5)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          {product.autoDelivery ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={`${product.availableCount || 0} Ready to Assign`}
                                color={
                                  (product.availableCount || 0) === 0
                                    ? 'error'
                                    : (product.availableCount || 0) < 5
                                    ? 'warning'
                                    : 'success'
                                }
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                Max: {product.maxAssignments || 0}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Manual delivery
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>{getStatusChip(product)}</TableCell>

                        <TableCell>
                          <Typography variant="body2">
                            {new Date(product.createdAt).toLocaleDateString()}
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
                            <Tooltip title="View Service">
                              <IconButton
                                component={RouterLink}
                                to={`/services/${product.slug}`}
                                target="_blank"
                                size="small"
                                color="info"
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit Service">
                              <IconButton
                                component={RouterLink}
                                to={`/admin/products/${product._id}/edit`}
                                size="small"
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Service">
                              <IconButton
                                onClick={() => handleDeleteClick(product)}
                                size="small"
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={adminProducts.pagination?.total || 0}
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
                No services found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || categoryFilter || statusFilter
                  ? "Try adjusting your filters"
                  : "Create your first service to get started"}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/admin/products/new"
              >
                Add Service
              </Button>
            </Box>
          )}
        </CardContent>
      </MotionCard>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Service</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.product?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServiceAdmin;
