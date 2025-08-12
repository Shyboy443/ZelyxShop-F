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
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  TablePagination,
  Switch,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
} from "@mui/icons-material";
// import { DateTimePicker } from '@mui/x-date-pickers';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
// import { format } from 'date-fns';

const AccessTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [updateDialog, setUpdateDialog] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({});

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Token visibility state (removed duplicate)

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    inactive: 0,
    usage: { total: 0, average: 0, maximum: 0 },
  });

  // Form state
  const [formData, setFormData] = useState({
    maxUsage: "",
    expirationDays: "30",
  });

  // Removed unused state and options for simplified form

  useEffect(() => {
    fetchTokens();
    fetchStats();
  }, [page, rowsPerPage, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/access-tokens?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTokens(data.data.tokens);
        setTotalCount(data.data.pagination.total);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch access tokens");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/access-tokens/stats/overview", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.maxUsage || !formData.expirationDays) {
        setError("Please fill in all required fields");
        return;
      }

      const tokenData = {
        maxUsage: parseInt(formData.maxUsage),
        expirationDays: parseInt(formData.expirationDays),
      };

      // Always create new tokens (no editing for auto-generated tokens)
      const response = await fetch("/api/admin/access-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(tokenData),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Access token generated successfully");
        handleCloseDialog();
        fetchTokens();
        fetchStats();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to generate token");
    }
  };

  const handleDelete = async (tokenId) => {
    try {
      const response = await fetch(`/api/admin/access-tokens/${tokenId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Token deleted successfully");
        fetchTokens();
        fetchStats();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to delete token");
    }
    setDeleteConfirm(null);
  };

  const handleResetUsage = async (tokenId) => {
    try {
      const response = await fetch(
        `/api/admin/access-tokens/${tokenId}/reset-usage`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Usage count reset successfully");
        fetchTokens();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to reset usage");
    }
  };

  const handleOpenDialog = (token = null) => {
    if (token) {
      // Open update dialog for existing token
      setEditingToken(token);
      setUpdateFormData({
        maxUsage: token.maxUsage || "",
        currentUsage: token.usageCount || 0,
        isActive: token.isActive,
      });
      setUpdateDialog(true);
    } else {
      // Open create dialog for new token
      setFormData({
        maxUsage: "",
        expirationDays: "30",
      });
      setEditingToken(null);
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setUpdateDialog(false);
    setEditingToken(null);
    setUpdateFormData({});
  };

  const copyToClipboard = (text, message = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    setSuccess(message);
  };

  const handleUpdateToken = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `/api/admin/access-tokens/${editingToken._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({
            maxUsage: parseInt(updateFormData.maxUsage),
            isActive: updateFormData.isActive,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSuccess("Token updated successfully");
        handleCloseDialog();
        fetchTokens();
        fetchStats();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to update token");
    }
  };

  const getStatusChip = (token) => {
    if (!token.isActive) {
      return <Chip label="Inactive" color="default" size="small" />;
    }
    if (token.isExpired) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    if (token.isUsageLimitReached) {
      return <Chip label="Limit Reached" color="warning" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Access Token Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Tokens
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Tokens
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Usage
              </Typography>
              <Typography variant="h4">{stats.usage.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Usage
              </Typography>
              <Typography variant="h4">{stats.usage.average}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Generate Token
        </Button>

        <TextField
          size="small"
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" onClick={fetchTokens}>
          Refresh
        </Button>
      </Box>

      {/* Security Notice */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Security Notice:</strong> Token values are hidden for security
          reasons. Full token values are only displayed when creating new
          tokens. You can copy the Token ID or use the OTP API link which
          includes the token ID as a parameter.
        </Typography>
      </Alert>

      {/* Tokens Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token._id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {token.tokenName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Created by {token.createdBy}
                    </Typography>
                    {token.email && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        display="block"
                      >
                        Email: {token.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {token.usageCount}
                      {token.maxUsage && ` / ${token.maxUsage}`}
                    </Typography>
                    {token.maxUsage && (
                      <Typography variant="caption" color="textSecondary">
                        {Math.round((token.usageCount / token.maxUsage) * 100)}%
                        used
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getStatusChip(token)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(token.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {token.expiresAt
                        ? new Date(token.expiresAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "2-digit" }
                          )
                        : "Never"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Copy Token ID">
                        <IconButton
                          size="small"
                          onClick={() =>
                            copyToClipboard(
                              token._id,
                              "Token ID copied to clipboard!"
                            )
                          }
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy OTP API Link">
                        <IconButton
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/otp?token=${token.token}`,
                              "OTP API link copied to clipboard!"
                            )
                          }
                          size="small"
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirm(token)}
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
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>Generate Access Token</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This will generate an automatic access token with default
                  settings.
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Max Usage"
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsage: e.target.value })
                  }
                  helperText="Maximum number of times this token can be used"
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expiration (Days)"
                  type="number"
                  value={formData.expirationDays}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDays: e.target.value })
                  }
                  helperText="Number of days until the token expires"
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Generate Token
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Update Dialog */}
      <Dialog
        open={updateDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleUpdateToken}>
          <DialogTitle>Update Access Token</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {editingToken && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Update settings for token: {editingToken._id?.slice(-8)}
                    </Alert>
                  </Grid>
                  <Grid item xs={12}>
                    <Card
                      sx={{
                        bgcolor: (theme) => theme.palette.background.paper,
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Current Usage Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="textSecondary">
                              Current Usage: {updateFormData.currentUsage}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="textSecondary">
                              Max Usage: {editingToken.maxUsage || "Unlimited"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Chip
                              label={
                                editingToken.isActive ? "Active" : "Inactive"
                              }
                              color={
                                editingToken.isActive ? "success" : "error"
                              }
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Max Usage"
                      type="number"
                      value={updateFormData.maxUsage}
                      onChange={(e) =>
                        setUpdateFormData({
                          ...updateFormData,
                          maxUsage: e.target.value,
                        })
                      }
                      helperText={`Current usage: ${updateFormData.currentUsage}. Set new maximum usage limit.`}
                      required
                      inputProps={{ min: updateFormData.currentUsage || 1 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={updateFormData.isActive}
                          onChange={(e) =>
                            setUpdateFormData({
                              ...updateFormData,
                              isActive: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Token Active"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Update Token
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the token "
            {deleteConfirm?.tokenName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(deleteConfirm._id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
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

export default AccessTokens;
