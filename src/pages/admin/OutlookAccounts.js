import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
// import { format } from 'date-fns';

const OutlookAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [syncStatus, setSyncStatus] = useState({});
  const [statsDialog, setStatsDialog] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    isActive: true,
    settings: {
      autoSync: true,
      syncInterval: 300000, // 5 minutes
      maxEmailsPerSync: 50,
    },
  });

  useEffect(() => {
    fetchAccounts();
    fetchSyncStatus();

    // Set up polling for sync status
    const interval = setInterval(fetchSyncStatus, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/outlook-accounts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch Outlook accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/admin/outlook-accounts/sync/status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSyncStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    }
  };

  const handleAddAccount = async () => {
    try {
      const response = await fetch("/api/admin/outlook-accounts/auth-url", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Open OAuth URL in new window
        window.open(data.data.authUrl, "outlook-auth", "width=600,height=700");

        // Listen for OAuth completion
        const checkAuth = setInterval(async () => {
          try {
            const checkResponse = await fetch("/api/admin/outlook-accounts", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
              },
            });
            const checkData = await checkResponse.json();
            if (checkData.success && checkData.data.length > accounts.length) {
              clearInterval(checkAuth);
              setSuccess("Outlook account added successfully");
              fetchAccounts();
            }
          } catch (err) {
            // Continue checking
          }
        }, 2000);

        // Stop checking after 5 minutes
        setTimeout(() => clearInterval(checkAuth), 300000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to initiate OAuth flow");
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `/api/admin/outlook-accounts/${editingAccount._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Account updated successfully");
        handleCloseDialog();
        fetchAccounts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to update account");
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      const response = await fetch(`/api/admin/outlook-accounts/${accountId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Account deleted successfully");
        fetchAccounts();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to delete account");
    }
    setDeleteConfirm(null);
  };

  const handleSyncAccount = async (accountId) => {
    try {
      const response = await fetch(
        `/api/admin/outlook-accounts/${accountId}/sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Sync started successfully");
        fetchSyncStatus();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to start sync");
    }
  };

  const handleSyncAll = async () => {
    try {
      const response = await fetch("/api/admin/outlook-accounts/sync/all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Sync started for all accounts");
        fetchSyncStatus();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to start sync for all accounts");
    }
  };

  const handleTestConnection = async (accountId) => {
    try {
      const response = await fetch(
        `/api/admin/outlook-accounts/${accountId}/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Connection test successful");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Connection test failed");
    }
  };

  const fetchAccountStats = async (accountId) => {
    try {
      const response = await fetch(
        `/api/admin/outlook-accounts/${accountId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setStatsDialog(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch account statistics");
    }
  };

  const handleOpenDialog = (account) => {
    setEditingAccount(account);
    setFormData({
      isActive: account.isActive,
      settings: {
        autoSync: account.settings?.autoSync ?? true,
        syncInterval: account.settings?.syncInterval ?? 300000,
        maxEmailsPerSync: account.settings?.maxEmailsPerSync ?? 50,
      },
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccount(null);
  };

  const getStatusChip = (account) => {
    if (!account.isActive) {
      return <Chip label="Inactive" color="default" size="small" />;
    }

    const accountSyncStatus = syncStatus[account._id];
    if (accountSyncStatus?.status === "syncing") {
      return <Chip label="Syncing" color="info" size="small" />;
    }

    switch (account.syncStatus) {
      case "success":
        return <Chip label="Active" color="success" size="small" />;
      case "error":
        return <Chip label="Error" color="error" size="small" />;
      case "warning":
        return <Chip label="Warning" color="warning" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  };

  const getSyncProgress = (accountId) => {
    const status = syncStatus[accountId];
    if (!status || status.status !== "syncing") return null;

    return (
      <Box sx={{ width: "100%", mt: 1 }}>
        <LinearProgress
          variant={status.progress ? "determinate" : "indeterminate"}
          value={status.progress || 0}
        />
        {status.message && (
          <Typography variant="caption" color="textSecondary">
            {status.message}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Outlook Account Management
      </Typography>

      {/* Controls */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAccount}
        >
          Add Outlook Account
        </Button>

        <Button
          variant="outlined"
          startIcon={<SyncIcon />}
          onClick={handleSyncAll}
          disabled={accounts.length === 0}
        >
          Sync All Accounts
        </Button>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAccounts}
        >
          Refresh
        </Button>
      </Box>

      {/* Accounts Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Sync</TableCell>
                <TableCell>Statistics</TableCell>
                <TableCell>Settings</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account._id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <EmailIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle2">
                          {account.displayName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {account.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(account)}
                    {account.errorMessage && (
                      <Tooltip title={account.errorMessage}>
                        <ErrorIcon color="error" sx={{ ml: 1, fontSize: 16 }} />
                      </Tooltip>
                    )}
                    {getSyncProgress(account._id)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {account.lastSyncAt
                        ? new Date(account.lastSyncAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "2-digit" }
                          ) +
                          " " +
                          new Date(account.lastSyncAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }
                          )
                        : "Never"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Emails: {account.statistics?.totalEmailsProcessed || 0}
                    </Typography>
                    <Typography variant="body2">
                      Orders: {account.statistics?.ordersFound || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Errors: {account.statistics?.consecutiveErrors || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Auto-sync: {account.settings?.autoSync ? "On" : "Off"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Interval:{" "}
                      {Math.round(
                        (account.settings?.syncInterval || 300000) / 60000
                      )}
                      m
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Edit Settings">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(account)}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sync Now">
                        <IconButton
                          size="small"
                          onClick={() => handleSyncAccount(account._id)}
                          disabled={
                            syncStatus[account._id]?.status === "syncing"
                          }
                        >
                          <SyncIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Test Connection">
                        <IconButton
                          size="small"
                          onClick={() => handleTestConnection(account._id)}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Statistics">
                        <IconButton
                          size="small"
                          onClick={() => fetchAccountStats(account._id)}
                        >
                          <AssessmentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteConfirm(account)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="textSecondary">
                      No Outlook accounts configured. Click "Add Outlook
                      Account" to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Edit Account Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleUpdateAccount}>
          <DialogTitle>
            Edit Account Settings - {editingAccount?.displayName}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                  }
                  label="Account Active"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.settings.autoSync}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          settings: {
                            ...formData.settings,
                            autoSync: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Auto Sync"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sync Interval (minutes)"
                  type="number"
                  value={Math.round(formData.settings.syncInterval / 60000)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        syncInterval: parseInt(e.target.value) * 60000,
                      },
                    })
                  }
                  inputProps={{ min: 1, max: 1440 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Emails Per Sync"
                  type="number"
                  value={formData.settings.maxEmailsPerSync}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        maxEmailsPerSync: parseInt(e.target.value),
                      },
                    })
                  }
                  inputProps={{ min: 1, max: 1000 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the Outlook account "
            {deleteConfirm?.email}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => handleDeleteAccount(deleteConfirm._id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog
        open={!!statsDialog}
        onClose={() => setStatsDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Account Statistics</DialogTitle>
        <DialogContent>
          {statsDialog && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Email Processing
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Total Emails Processed"
                          secondary={statsDialog.totalEmailsProcessed || 0}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Orders Found"
                          secondary={statsDialog.ordersFound || 0}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Last Successful Sync"
                          secondary={
                            statsDialog.lastSuccessfulSync
                              ? new Date(
                                  statsDialog.lastSuccessfulSync
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "2-digit",
                                }) +
                                " " +
                                new Date(
                                  statsDialog.lastSuccessfulSync
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })
                              : "Never"
                          }
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Error Information
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Consecutive Errors"
                          secondary={statsDialog.consecutiveErrors || 0}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Last Error"
                          secondary={statsDialog.lastError || "None"}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OutlookAccounts;
