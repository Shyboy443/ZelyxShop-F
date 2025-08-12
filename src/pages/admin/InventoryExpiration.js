import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  TablePagination,
} from "@mui/material";
import {
  AccessTime as ExpiryIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { toast } from "react-hot-toast";
import inventoryAPI from "../../api/inventoryAPI";
import api from "../../api/api";

const InventoryExpiration = () => {
  const [inventory, setInventory] = useState([]);
  const [expiredInventory, setExpiredInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Dialog states
  const [openExpirationDialog, setOpenExpirationDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({ maxAssignments: 1 });
  
  // Form states
  const [expirationForm, setExpirationForm] = useState({
    durationDays: 30,
    allowUpdatesAfterExpiry: false,
  });
  const [bulkForm, setBulkForm] = useState({
    expirationDate: '',
    allowUpdatesAfterExpiry: false,
  });

  useEffect(() => {
    fetchProducts();
    fetchInventory();
    fetchExpiredInventory();
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchExpiredInventory();
  }, [page, rowsPerPage, selectedProduct]);

  const fetchProducts = async () => {
    console.log('🔄 Fetching products for filter...');
    setProductsLoading(true);
    try {
      const response = await api.get('/admin/products', {
        params: { limit: 1000, status: 'active' }
      });
      console.log('✅ Products response:', response.data);
      const productsData = response.data.data || [];
      // Ensure we always set an array
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast.error(`Failed to fetch products: ${error.message}`);
      // Ensure products is set to empty array on error
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchInventory = async () => {
    console.log('🔄 Fetching all inventory for expiration management...');
    setLoading(true);
    try {
      const params = { 
        page: page + 1, 
        limit: rowsPerPage,
        includeExpired: true 
      };
      
      if (selectedProduct) {
        params.product = selectedProduct;
      }
      
      const response = await inventoryAPI.getInventory(params);
      console.log('✅ All inventory response:', response.data);
      setInventory(response.data.data || []);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
      toast.error(`Failed to fetch inventory: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiredInventory = async () => {
    console.log('🔄 Fetching expired inventory...');
    try {
      const response = await inventoryAPI.getExpiredInventory({ 
        page: 1, 
        limit: 100 
      });
      console.log('✅ Expired inventory response:', response.data);
      setExpiredInventory(response.data.data || []);
    } catch (error) {
      console.error('❌ Error fetching expired inventory:', error);
      toast.error(`Failed to fetch expired inventory: ${error.message}`);
    }
  };

  const handleSetExpiration = async () => {
    if (!selectedInventoryItem) return;
    
    console.log('⏰ Setting expiration for item:', selectedInventoryItem._id, expirationForm);
    try {
      await inventoryAPI.setInventoryExpiration(selectedInventoryItem._id, expirationForm);
      toast.success('Expiration date set successfully');
      setOpenExpirationDialog(false);
      fetchInventory();
      fetchExpiredInventory();
    } catch (error) {
      console.error('❌ Error setting expiration:', error);
      toast.error(`Failed to set expiration: ${error.message}`);
    }
  };

  const handleSetAssignmentSettings = async () => {
    try {
      await api.put(`/admin/inventory/${selectedInventoryItem._id}/assignment-settings`, {
        maxAssignments: assignmentForm.maxAssignments,
      });
      
      toast.success('Assignment settings updated successfully');
      
      setOpenAssignmentDialog(false);
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update assignment settings');
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to update');
      return;
    }
    
    console.log('📦 Bulk updating expiration for items:', selectedItems, bulkForm);
    try {
      await inventoryAPI.bulkUpdateExpiration({
        inventoryIds: selectedItems,
        ...bulkForm
      });
      toast.success(`Updated ${selectedItems.length} items successfully`);
      setOpenBulkDialog(false);
      setSelectedItems([]);
      fetchInventory();
      fetchExpiredInventory();
    } catch (error) {
      console.error('❌ Error bulk updating:', error);
      toast.error(`Failed to update items: ${error.message}`);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(inventory.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const getExpirationStatus = (item) => {
    if (!item.expirationDate) return { status: 'none', color: 'default', text: 'No Expiration' };
    
    const now = new Date();
    const expiry = new Date(item.expirationDate);
    const isExpired = now > expiry;
    
    if (isExpired) {
      return { 
        status: 'expired', 
        color: 'error', 
        text: `Expired ${Math.floor((now - expiry) / (1000 * 60 * 60 * 24))} days ago` 
      };
    } else {
      const daysLeft = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
      return { 
        status: 'active', 
        color: daysLeft <= 7 ? 'warning' : 'success', 
        text: `${daysLeft} days left` 
      };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Inventory Expiration Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage expiration dates and update permissions for inventory items. 
        Expired products with disabled updates will not receive new credentials.
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ExpiryIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">{inventory.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Inventory Items
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">{expiredInventory.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expired Items
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BlockIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">
                    {expiredInventory.filter(item => !item.allowUpdatesAfterExpiry).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update Blocked Items
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Product</InputLabel>
                <Select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setPage(0); // Reset to first page when filtering
                  }}
                  label="Filter by Product"
                  disabled={productsLoading}
                >
                  <MenuItem value="">
                    <em>All Products</em>
                  </MenuItem>
                  {Array.isArray(products) && products.map((product) => (
                    <MenuItem key={product._id} value={product._id}>
                      {product.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedProduct('');
                  setPage(0);
                }}
                disabled={!selectedProduct}
              >
                Clear Filter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => setOpenBulkDialog(true)}
          disabled={selectedItems.length === 0}
          startIcon={<ScheduleIcon />}
        >
          Bulk Update Expiration ({selectedItems.length})
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            fetchInventory();
            fetchExpiredInventory();
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inventory Items
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedItems.length > 0 && selectedItems.length < inventory.length}
                      checked={inventory.length > 0 && selectedItems.length === inventory.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Product</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expiration Date</TableCell>
                    <TableCell>Expiration Status</TableCell>
                    <TableCell>Updates Allowed</TableCell>
                    <TableCell>Delivered Date</TableCell>
                    <TableCell>Assignments</TableCell>
                    <TableCell>Order IDs</TableCell>
                    <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item) => {
                  const expirationStatus = getExpirationStatus(item);
                  return (
                    <TableRow key={item._id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedItems.includes(item._id)}
                          onChange={() => handleSelectItem(item._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.product?.title || 'Unknown Product'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={item.status === 'delivered' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            item.assignments && item.assignments.length > 0 ? (
                              <div>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Assignment History:</Typography>
                                {item.assignments.map((assignment, index) => (
                                  <div key={index} style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                      Order ID: {assignment.orderNumber}
                                    </Typography>
                                    <Typography variant="body2">
                                      Customer: {assignment.customerName}
                                    </Typography>
                                    <Typography variant="body2">
                                      Email: {assignment.customerEmail}
                                    </Typography>
                                    <Typography variant="body2">
                                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()} at {new Date(assignment.assignedAt).toLocaleTimeString()}
                                    </Typography>
                                  </div>
                                ))}
                                <Typography variant="caption" sx={{ mt: 1, fontStyle: 'italic' }}>
                                  Total Assignments: {item.assignments.length}
                                </Typography>
                              </div>
                            ) : 'No assignments yet'
                          }
                        >
                          <Chip
                            label={`${item.assignmentCount || 0}/${item.maxAssignments || 1}`}
                            color={item.assignmentCount > 0 ? 'primary' : 'default'}
                            size="small"
                            variant={item.assignmentCount >= (item.maxAssignments || 1) ? 'filled' : 'outlined'}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>{formatDate(item.expirationDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={expirationStatus.text}
                          color={expirationStatus.color}
                          size="small"
                          icon={expirationStatus.status === 'expired' ? <WarningIcon /> : <CheckIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.allowUpdatesAfterExpiry ? 'Yes' : 'No'}
                          color={item.allowUpdatesAfterExpiry ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.deliveredAt)}</TableCell>
                      <TableCell>
                        {item.assignments && item.assignments.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {item.assignments.map((assignment, index) => (
                              <Chip
                                key={index}
                                label={assignment.orderNumber}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </div>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No orders
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Set Expiration">
                          <IconButton
                            onClick={() => {
                              setSelectedInventoryItem(item);
                              setOpenExpirationDialog(true);
                            }}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Assignment Settings">
                          <IconButton
                            onClick={() => {
                              setSelectedInventoryItem(item);
                              setAssignmentForm({ maxAssignments: item.maxAssignments || 1 });
                              setOpenAssignmentDialog(true);
                            }}
                            size="small"
                          >
                            <ScheduleIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Set Expiration Dialog */}
      <Dialog open={openExpirationDialog} onClose={() => setOpenExpirationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Set Expiration for {selectedInventoryItem?.product?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Duration (Days)"
              type="number"
              value={expirationForm.durationDays}
              onChange={(e) => setExpirationForm(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
              helperText="Number of days from delivery date until expiration"
              fullWidth
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={expirationForm.allowUpdatesAfterExpiry}
                  onChange={(e) => setExpirationForm(prev => ({ ...prev, allowUpdatesAfterExpiry: e.target.checked }))}
                />
              }
              label="Allow credential updates after expiration"
            />
            
            <Alert severity="info">
              If updates are disabled after expiration, users will not receive new credentials 
              when inventory is updated for this expired product.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpirationDialog(false)}>Cancel</Button>
          <Button onClick={handleSetExpiration} variant="contained">
            Set Expiration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Bulk Update Expiration ({selectedItems.length} items)
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Expiration Date"
              type="date"
              value={bulkForm.expirationDate}
              onChange={(e) => setBulkForm(prev => ({ ...prev, expirationDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={bulkForm.allowUpdatesAfterExpiry}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, allowUpdatesAfterExpiry: e.target.checked }))}
                />
              }
              label="Allow credential updates after expiration"
            />
            
            <Alert severity="warning">
              This will update expiration settings for {selectedItems.length} selected items.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkUpdate} variant="contained">
            Update Selected Items
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Settings Dialog */}
      <Dialog open={openAssignmentDialog} onClose={() => setOpenAssignmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assignment Settings for {selectedInventoryItem?.product?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Maximum Assignments"
              type="number"
              value={assignmentForm.maxAssignments}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, maxAssignments: parseInt(e.target.value) }))}
              helperText="Maximum number of times this inventory item can be assigned"
              inputProps={{ min: 1 }}
              fullWidth
            />
            
            <Alert severity="info">
              This setting controls how many times this inventory item can be assigned to customers.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignmentDialog(false)}>Cancel</Button>
          <Button onClick={handleSetAssignmentSettings} variant="contained">
            Update Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryExpiration;