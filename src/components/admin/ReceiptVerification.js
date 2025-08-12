import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  TextField,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

const ReceiptVerification = () => {
  const navigate = useNavigate();
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [verifiedReceipts, setVerifiedReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchPendingReceipts();
    fetchVerifiedReceipts();
  }, []);

  const fetchPendingReceipts = async () => {
    try {
      const response = await api.get("/admin/receipts/pending");
      setPendingReceipts(response.data.data);
    } catch (error) {
      console.error("Error fetching pending receipts:", error);
      showAlert("Error fetching pending receipts", "error");
    }
  };

  const fetchVerifiedReceipts = async () => {
    try {
      const response = await api.get("/admin/receipts/history");
      setVerifiedReceipts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching verified receipts:", error);
      showAlert("Error fetching verified receipts", "error");
      setLoading(false);
    }
  };

  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity });
    setTimeout(
      () => setAlert({ show: false, message: "", severity: "success" }),
      5000
    );
  };

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;

    setConfirming(true);
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/confirm-payment`);

      // Show success message
      showAlert("Payment Successful! Order has been confirmed.");

      // Close dialog
      setDialogOpen(false);

      // Refresh the component data
      await fetchPendingReceipts();
      await fetchVerifiedReceipts();
    } catch (error) {
      console.error("Error confirming payment:", error);
      showAlert("Error confirming payment", "error");
    } finally {
      setConfirming(false);
    }
  };

  const handleDeclinePayment = async () => {
    if (!selectedOrder || !declineReason.trim()) {
      showAlert("Please provide a reason for declining the payment", "error");
      return;
    }

    setDeclining(true);
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/decline-payment`, {
        declineReason: declineReason.trim(),
      });

      // Show success message
      showAlert("Payment declined successfully. Customer has been notified.");

      // Close dialogs
      setDeclineDialogOpen(false);
      setDialogOpen(false);
      setDeclineReason("");

      // Refresh the component data
      await fetchPendingReceipts();
      await fetchVerifiedReceipts();
    } catch (error) {
      console.error("Error declining payment:", error);
      showAlert("Error declining payment", "error");
    } finally {
      setDeclining(false);
    }
  };

  const handleOpenDeclineDialog = () => {
    setDeclineDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading receipt data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <ReceiptIcon color="primary" />
        Receipt Verification Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Verifications
                  </Typography>
                  <Typography variant="h4">{pendingReceipts.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: "warning.main" }}>
                  <PendingIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Verified Receipts
                  </Typography>
                  <Typography variant="h4">
                    {verifiedReceipts.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: "success.main" }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
        >
          <Tab label={`Pending Verification (${pendingReceipts.length})`} />
          <Tab label={`Verification History (${verifiedReceipts.length})`} />
        </Tabs>
      </Box>

      {/* Pending Receipts Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Receipt Verifications
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingReceipts.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>
                        {order.customerInfo?.firstName}{" "}
                        {order.customerInfo?.lastName}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Chip label="Pending" color="warning" size="small" />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewReceipt(order)}
                        >
                          View & Verify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingReceipts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          No pending receipt verifications
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Verified Receipts Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Verification History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Verified Date</TableCell>
                    <TableCell>Verified By</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verifiedReceipts.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>
                        {order.customerInfo?.firstName}{" "}
                        {order.customerInfo?.lastName}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        {order.receiptVerification?.verifiedAt
                          ? formatDate(order.receiptVerification.verifiedAt)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.receiptVerification?.adminName || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            order.receiptVerification?.status === "declined"
                              ? "Declined"
                              : "Verified"
                          }
                          color={
                            order.receiptVerification?.status === "declined"
                              ? "error"
                              : "success"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {verifiedReceipts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          No verified receipts found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Receipt Verification Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Verify Receipt - Order #{selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Customer:</Typography>
                  <Typography>
                    {selectedOrder.customerInfo?.firstName}{" "}
                    {selectedOrder.customerInfo?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Order Total:</Typography>
                  <Typography>{formatCurrency(selectedOrder.total)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Order Date:</Typography>
                  <Typography>{formatDate(selectedOrder.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Payment Method:</Typography>
                  <Typography>Bank Deposit</Typography>
                </Grid>
              </Grid>

              {selectedOrder.receipt && (
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Receipt:
                  </Typography>
                  {selectedOrder.receipt.toLowerCase().endsWith(".pdf") ? (
                    <Box>
                      <iframe
                        src={`http://localhost:5000/${selectedOrder.receipt.replace(
                          /\\/g,
                          "/"
                        )}`}
                        width="100%"
                        height="400px"
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                        }}
                        title="Receipt PDF"
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() =>
                          window.open(
                            `http://localhost:5000/${selectedOrder.receipt.replace(
                              /\\/g,
                              "/"
                            )}`,
                            "_blank"
                          )
                        }
                      >
                        Open PDF in New Tab
                      </Button>
                    </Box>
                  ) : (
                    <img
                      src={`http://localhost:5000/${selectedOrder.receipt.replace(
                        /\\/g,
                        "/"
                      )}`}
                      alt="Receipt"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "400px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                      onError={(e) => {
                        console.error(
                          "Failed to load receipt image:",
                          `http://localhost:5000/${selectedOrder.receipt}`
                        );
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                  )}
                  <Typography color="error" sx={{ display: "none", mt: 2 }}>
                    Receipt could not be loaded. Path: {selectedOrder.receipt}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleOpenDeclineDialog}
            startIcon={<CancelIcon />}
          >
            Decline Payment
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmPayment}
            disabled={confirming}
            startIcon={
              confirming ? <CircularProgress size={20} /> : <CheckCircleIcon />
            }
          >
            {confirming ? "Confirming..." : "Confirm Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Decline Payment Dialog */}
      <Dialog
        open={declineDialogOpen}
        onClose={() => setDeclineDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Decline Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to decline this payment? Please provide a
            reason for the customer.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Decline Reason"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Please explain why the payment receipt is being declined..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeclinePayment}
            disabled={declining || !declineReason.trim()}
            startIcon={
              declining ? <CircularProgress size={20} /> : <CancelIcon />
            }
          >
            {declining ? "Declining..." : "Decline Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceiptVerification;
