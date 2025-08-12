import React, { useState, useEffect } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Pagination,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CheckCircle as ResolveIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { deliveryLogsAPI } from '../../api/api';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const DeliveryLogs = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    eventType: '',
    status: '',
    orderId: '',
    customerEmail: '',
    productId: '',
    startDate: '',
    endDate: '',
    isResolved: '',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      };

      const response = await deliveryLogsAPI.getDeliveryLogs(params);
      if (response.data.success) {
        setLogs(response.data.data.logs || []);
        setPagination({
          ...pagination,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch delivery logs');
      console.error('Error fetching delivery logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await deliveryLogsAPI.getDeliveryStats('24h');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching delivery log stats:', error);
    }
  };

  const handlePageChange = (event, value) => {
    setPagination({ ...pagination, page: value });
  };

  const handleFilterChange = (event) => {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  };

  const handleFilterSubmit = () => {
    setPagination({ ...pagination, page: 1 }); // Reset to first page
    fetchLogs();
    setFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({
      eventType: '',
      status: '',
      orderId: '',
      customerEmail: '',
      productId: '',
      startDate: '',
      endDate: '',
      isResolved: '',
    });
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleResolveLog = async (logId) => {
    try {
      const response = await deliveryLogsAPI.resolveDeliveryLog(logId);
      if (response.data.success) {
        toast.success('Log marked as resolved');
        fetchLogs();
        if (detailDialogOpen) {
          setDetailDialogOpen(false);
        }
      }
    } catch (error) {
      toast.error('Failed to resolve log');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getEventTypeLabel = (eventType) => {
    switch (eventType) {
      case 'delivery_started':
        return 'Delivery Started';
      case 'delivery_success':
        return 'Delivery Success';
      case 'delivery_failed':
        return 'Delivery Failed';
      case 'email_sent':
        return 'Email Sent';
      case 'email_failed':
        return 'Email Failed';
      case 'inventory_allocated':
        return 'Inventory Allocated';
      case 'insufficient_inventory':
        return 'Insufficient Inventory';
      default:
        return eventType.replace(/_/g, ' ');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && logs.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Delivery Logs
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialogOpen(true)}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchLogs();
                fetchStats();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Monitor and track all delivery events and issues
        </Typography>
      </MotionBox>

      {/* Stats Cards */}
      {stats && (
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 'bold', color: 'success.main' }}
                    >
                      {stats.success || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Successful Deliveries
                    </Typography>
                  </Box>
                  <CheckCircle
                    sx={{ fontSize: 40, color: 'success.main', opacity: 0.8 }}
                  />
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 'bold', color: 'error.main' }}
                    >
                      {stats.error || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Failed Deliveries
                    </Typography>
                  </Box>
                  <ErrorIcon
                    sx={{ fontSize: 40, color: 'error.main', opacity: 0.8 }}
                  />
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 'bold', color: 'warning.main' }}
                    >
                      {stats.warning || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Warnings
                    </Typography>
                  </Box>
                  <WarningIcon
                    sx={{ fontSize: 40, color: 'warning.main', opacity: 0.8 }}
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 'bold', color: 'info.main' }}
                    >
                      {stats.total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events
                    </Typography>
                  </Box>
                  <InfoIcon
                    sx={{ fontSize: 40, color: 'info.main', opacity: 0.8 }}
                  />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      )}

      {/* Logs Table */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <CardContent>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Order #</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell>{log.orderNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={getEventTypeLabel(log.eventType)}
                          size="small"
                          color={log.eventType.includes('failed') ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          color={getStatusColor(log.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 300,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {log.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(log)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        {log.status === 'error' && !log.isResolved && (
                          <Tooltip title="Mark as Resolved">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleResolveLog(log._id)}
                            >
                              <ResolveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2,
            }}
          >
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </CardContent>
      </MotionCard>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Filter Delivery Logs</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  name="eventType"
                  value={filters.eventType}
                  onChange={handleFilterChange}
                  label="Event Type"
                >
                  <MenuItem value="">All Events</MenuItem>
                  <MenuItem value="delivery_started">Delivery Started</MenuItem>
                  <MenuItem value="delivery_success">Delivery Success</MenuItem>
                  <MenuItem value="delivery_failed">Delivery Failed</MenuItem>
                  <MenuItem value="email_sent">Email Sent</MenuItem>
                  <MenuItem value="email_failed">Email Failed</MenuItem>
                  <MenuItem value="inventory_allocated">Inventory Allocated</MenuItem>
                  <MenuItem value="insufficient_inventory">Insufficient Inventory</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Order ID"
                name="orderId"
                value={filters.orderId}
                onChange={handleFilterChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Customer Email"
                name="customerEmail"
                value={filters.customerEmail}
                onChange={handleFilterChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Resolution Status</InputLabel>
                <Select
                  name="isResolved"
                  value={filters.isResolved}
                  onChange={handleFilterChange}
                  label="Resolution Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Resolved</MenuItem>
                  <MenuItem value="false">Unresolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            color="inherit"
          >
            Clear
          </Button>
          <Button
            startIcon={<SearchIcon />}
            onClick={handleFilterSubmit}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Delivery Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography variant="body1">{selectedLog.orderNumber}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Time
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedLog.createdAt)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Event Type
                  </Typography>
                  <Chip
                    label={getEventTypeLabel(selectedLog.eventType)}
                    color={selectedLog.eventType.includes('failed') ? 'error' : 'default'}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedLog.status}
                    color={getStatusColor(selectedLog.status)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Message
                  </Typography>
                  <Typography variant="body1">{selectedLog.message}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Product
                  </Typography>
                  <Typography variant="body1">{selectedLog.productTitle}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer Email
                  </Typography>
                  <Typography variant="body1">{selectedLog.customerEmail}</Typography>
                </Grid>

                {selectedLog.processingTime > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Processing Time
                    </Typography>
                    <Typography variant="body1">
                      {selectedLog.processingTime} ms
                    </Typography>
                  </Grid>
                )}

                {selectedLog.retryCount > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Retry Count
                    </Typography>
                    <Typography variant="body1">{selectedLog.retryCount}</Typography>
                  </Grid>
                )}

                {selectedLog.errorCode && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Error Code
                    </Typography>
                    <Typography variant="body1" color="error.main">
                      {selectedLog.errorCode}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resolution Status
                  </Typography>
                  <Chip
                    label={selectedLog.isResolved ? 'Resolved' : 'Unresolved'}
                    color={selectedLog.isResolved ? 'success' : 'default'}
                  />
                </Grid>
              </Grid>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Additional Details
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedLog && selectedLog.status === 'error' && !selectedLog.isResolved && (
            <Button
              startIcon={<ResolveIcon />}
              onClick={() => handleResolveLog(selectedLog._id)}
              color="success"
            >
              Mark as Resolved
            </Button>
          )}
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DeliveryLogs;