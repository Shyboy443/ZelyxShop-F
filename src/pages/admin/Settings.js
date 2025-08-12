import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Box,
  Alert,
  Divider,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import {
  Save as SaveIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  CloudDownload as ImportIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSettings,
  updateSettings,
  clearError,
} from "../../store/slices/settingsSlice";
import toast from "react-hot-toast";
import axios from "axios";

const Settings = () => {
  const dispatch = useDispatch();
  const { settings, loading, error } = useSelector((state) => state.settings);

  const [formData, setFormData] = useState({
    taxRate: 0,
    taxEnabled: false,
    deliveryMessage: "",
    outlookEnabled: false,
    outlookClientId: "",
    outlookClientSecret: "",
    outlookTenantId: "",
    outlookRedirectUri: "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [selectedResetType, setSelectedResetType] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [resetOptions, setResetOptions] = useState({});
  const [resetInfoLoading, setResetInfoLoading] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importConfirmation, setImportConfirmation] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importAdminPassword, setImportAdminPassword] = useState("");

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setFormData({
        taxRate: settings.taxRate || 0,
        taxEnabled: settings.taxEnabled || false,
        deliveryMessage:
          settings.deliveryMessage ||
          "Digital goods will be sent to your email address after payment confirmation.",
        outlookEnabled: settings.outlookEnabled || false,
        outlookClientId: settings.outlookClientId || "",
        outlookClientSecret: settings.outlookClientSecret || "",
        outlookTenantId: settings.outlookTenantId || "",
        outlookRedirectUri: settings.outlookRedirectUri || "",
      });
      setHasChanges(false);
    }
  }, [settings]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(updateSettings(formData)).unwrap();
      toast.success("Settings updated successfully!");
      setHasChanges(false);
    } catch (error) {
      toast.error(error || "Failed to update settings");
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        taxRate: settings.taxRate || 0,
        taxEnabled: settings.taxEnabled || false,
        deliveryMessage:
          settings.deliveryMessage ||
          "Digital goods will be sent to your email address after payment confirmation.",
        outlookEnabled: settings.outlookEnabled || false,
        outlookClientId: settings.outlookClientId || "",
        outlookClientSecret: settings.outlookClientSecret || "",
        outlookTenantId: settings.outlookTenantId || "",
        outlookRedirectUri: settings.outlookRedirectUri || "",
      });
      setHasChanges(false);
    }
  };

  const fetchResetInfo = async () => {
    setResetInfoLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("/api/admin/database/reset-info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResetOptions(response.data.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch reset information"
      );
    } finally {
      setResetInfoLoading(false);
    }
  };

  const handleDatabaseReset = async () => {
    if (
      resetConfirmation !== "RESET_DATABASE_CONFIRM" ||
      !selectedResetType ||
      !adminPassword
    ) {
      toast.error("Please fill all required fields and confirm the action");
      return;
    }

    setResetLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(
        "/api/admin/database/reset",
        {
          resetType: selectedResetType,
          confirmationCode: resetConfirmation,
          adminPassword: adminPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(
        `Database reset completed successfully. ${Object.entries(
          response.data.data.deletedCounts
        )
          .map(([key, count]) => `${key}: ${count}`)
          .join(", ")} items deleted.`
      );
      setResetDialogOpen(false);
      setResetConfirmation("");
      setSelectedResetType("");
      setAdminPassword("");

      // Refresh settings after reset
      dispatch(fetchSettings());
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset database");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetDialogOpen = () => {
    setResetDialogOpen(true);
    fetchResetInfo();
  };

  const handleImportSampleData = async () => {
    if (
      importConfirmation !== "IMPORT_SAMPLE_DATA_CONFIRM" ||
      !importAdminPassword
    ) {
      toast.error("Please fill all required fields and confirm the action");
      return;
    }

    setImportLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(
        "/api/admin/database/import-sample",
        {
          confirmationCode: importConfirmation,
          adminPassword: importAdminPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(
        `Sample data imported successfully! Created: ${Object.entries(
          response.data.data.createdCounts
        )
          .map(([key, count]) => `${key}: ${count}`)
          .join(", ")}`
      );
      setImportDialogOpen(false);
      setImportConfirmation("");
      setImportAdminPassword("");

      // Refresh settings after import
      dispatch(fetchSettings());
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to import sample data"
      );
    } finally {
      setImportLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Settings
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure tax rates and delivery settings for your store.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Tax Configuration */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tax Configuration
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.taxEnabled}
                        onChange={(e) =>
                          handleInputChange("taxEnabled", e.target.checked)
                        }
                        color="primary"
                      />
                    }
                    label="Enable Tax"
                  />
                </Box>

                {formData.taxEnabled && (
                  <TextField
                    fullWidth
                    label="Tax Rate (%)"
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) =>
                      handleInputChange(
                        "taxRate",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    inputProps={{
                      min: 0,
                      max: 100,
                      step: 0.01,
                    }}
                    helperText="Enter tax rate as a percentage (e.g., 10 for 10%)"
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Delivery Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Delivery Settings
                </Typography>

                <TextField
                  fullWidth
                  label="Delivery Message"
                  multiline
                  rows={4}
                  value={formData.deliveryMessage}
                  onChange={(e) =>
                    handleInputChange("deliveryMessage", e.target.value)
                  }
                  helperText="This message will be shown to customers during checkout"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Outlook Email Integration */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Outlook Email Integration
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.outlookEnabled}
                        onChange={(e) =>
                          handleInputChange("outlookEnabled", e.target.checked)
                        }
                        color="primary"
                      />
                    }
                    label="Enable Outlook Integration"
                  />
                </Box>

                {formData.outlookEnabled && (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Client ID"
                          value={formData.outlookClientId}
                          onChange={(e) =>
                            handleInputChange("outlookClientId", e.target.value)
                          }
                          helperText="Azure App Registration Client ID"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Client Secret"
                          value={formData.outlookClientSecret}
                          onChange={(e) =>
                            handleInputChange(
                              "outlookClientSecret",
                              e.target.value
                            )
                          }
                          helperText="Azure App Registration Client Secret"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Tenant ID"
                          value={formData.outlookTenantId}
                          onChange={(e) =>
                            handleInputChange("outlookTenantId", e.target.value)
                          }
                          helperText="Azure Active Directory Tenant ID (use 'common' for personal Microsoft accounts like Hotmail/Outlook.com)"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Redirect URI"
                          value={formData.outlookRedirectUri}
                          onChange={(e) =>
                            handleInputChange(
                              "outlookRedirectUri",
                              e.target.value
                            )
                          }
                          helperText="OAuth redirect URI (e.g., https://zelyx.shop/auth/callback)"
                        />
                      </Grid>
                    </Grid>

                    {formData.outlookEnabled && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        After configuring these settings, you can add and manage
                        Outlook email accounts using the "Manage Outlook
                        Accounts" button below. Added accounts will be displayed
                        in the Outlook Accounts page.
                      </Alert>
                    )}

                    <Box
                      sx={{
                        mt: 3,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() =>
                          (window.location.href = "/admin/outlook-accounts")
                        }
                        sx={{ mr: 2 }}
                      >
                        Manage Outlook Accounts
                      </Button>

                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={async () => {
                          try {
                            const outlookData = {
                              outlookEnabled: formData.outlookEnabled,
                              outlookClientId: formData.outlookClientId,
                              outlookClientSecret: formData.outlookClientSecret,
                              outlookTenantId: formData.outlookTenantId,
                              outlookRedirectUri: formData.outlookRedirectUri,
                            };
                            await dispatch(
                              updateSettings(outlookData)
                            ).unwrap();
                            toast.success(
                              "Outlook settings saved successfully!"
                            );
                          } catch (error) {
                            toast.error(
                              error || "Failed to save Outlook settings"
                            );
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Outlook Settings"}
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Preview */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>

                <Box
                  sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Tax Configuration:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {formData.taxEnabled
                      ? `Tax enabled at ${formData.taxRate}%`
                      : "Tax disabled"}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Outlook Integration:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {formData.outlookEnabled
                      ? "Enabled - Email fetching and OTP retrieval active"
                      : "Disabled"}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Delivery Message:
                  </Typography>
                  <Typography variant="body2">
                    {formData.deliveryMessage}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sample Data Import */}
          <Grid item xs={12} md={6}>
            <Card sx={{ border: "2px solid", borderColor: "primary.main" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <ImportIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="primary">
                    Sample Data
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Import sample products, categories, and orders to populate
                  your store with demo data.
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ImportIcon />}
                  onClick={() => setImportDialogOpen(true)}
                  fullWidth
                >
                  Import Sample Data
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Database Management */}
          <Grid item xs={12} md={6}>
            <Card sx={{ border: "2px solid", borderColor: "error.main" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="error">
                    Danger Zone
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Reset database tables. This action cannot be undone.
                </Typography>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleResetDialogOpen}
                  fullWidth
                >
                  Reset Database
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={!hasChanges || loading}
          >
            Reset
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={!hasChanges || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </form>

      {/* Database Reset Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => !resetLoading && setResetDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SecurityIcon color="error" sx={{ mr: 1 }} />
            Database Reset
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              ⚠️ DANGER: This action is irreversible!
            </Typography>
            <Typography variant="body2">
              Resetting database will permanently delete all data in the
              selected category. This action cannot be undone.
            </Typography>
          </Alert>

          {resetInfoLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Reset Type</InputLabel>
                <Select
                  value={selectedResetType}
                  onChange={(e) => setSelectedResetType(e.target.value)}
                  disabled={resetLoading}
                  label="Reset Type"
                >
                  {Object.entries(resetOptions).map(([key, option]) => (
                    <MenuItem key={key} value={key}>
                      <Box>
                        <Typography variant="subtitle2">
                          {option.name} ({option.count} items)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedResetType && resetOptions[selectedResetType] && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {resetOptions[selectedResetType].name}
                  </Typography>
                  <Typography variant="body2">
                    {resetOptions[selectedResetType].warning}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, fontWeight: "bold" }}
                  >
                    Items to be deleted: {resetOptions[selectedResetType].count}
                  </Typography>
                </Alert>
              )}

              <TextField
                fullWidth
                type="password"
                label="Admin Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                disabled={resetLoading}
                sx={{ mb: 3 }}
                helperText="Enter your admin password to authorize this action"
              />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Type "RESET_DATABASE_CONFIRM" to confirm:
                </Typography>
                <TextField
                  fullWidth
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  placeholder="RESET_DATABASE_CONFIRM"
                  disabled={resetLoading}
                  error={
                    resetConfirmation !== "" &&
                    resetConfirmation !== "RESET_DATABASE_CONFIRM"
                  }
                  helperText={
                    resetConfirmation !== "" &&
                    resetConfirmation !== "RESET_DATABASE_CONFIRM"
                      ? 'Must type exactly "RESET_DATABASE_CONFIRM"'
                      : ""
                  }
                />
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setResetDialogOpen(false);
              setResetConfirmation("");
              setSelectedResetType("");
              setAdminPassword("");
            }}
            disabled={resetLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDatabaseReset}
            color="error"
            variant="contained"
            disabled={
              resetLoading ||
              resetConfirmation !== "RESET_DATABASE_CONFIRM" ||
              !selectedResetType ||
              !adminPassword
            }
            startIcon={
              resetLoading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
          >
            {resetLoading ? "Resetting..." : "Reset Database"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sample Data Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => !importLoading && setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ImportIcon color="primary" sx={{ mr: 1 }} />
            Import Sample Data
          </Box>
        </DialogTitle>

        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              📦 Sample Data Import
            </Typography>
            <Typography variant="body2">
              This will create sample categories, products, inventory, and
              orders to help you get started with your store.
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>What will be created:</strong>
              <br />
              • 4 sample categories (Digital Games, Streaming Services, Software
              Licenses, VPN Services)
              <br />
              • 6 sample products with descriptions and pricing
              <br />
              • 18-30 inventory items with sample credentials
              <br />• 3 sample orders with different statuses
            </Typography>
          </Alert>

          <TextField
            fullWidth
            type="password"
            label="Admin Password"
            value={importAdminPassword}
            onChange={(e) => setImportAdminPassword(e.target.value)}
            disabled={importLoading}
            sx={{ mb: 3 }}
            helperText="Enter your admin password to authorize this action"
          />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Type "IMPORT_SAMPLE_DATA_CONFIRM" to confirm:
            </Typography>
            <TextField
              fullWidth
              value={importConfirmation}
              onChange={(e) => setImportConfirmation(e.target.value)}
              placeholder="IMPORT_SAMPLE_DATA_CONFIRM"
              disabled={importLoading}
              error={
                importConfirmation !== "" &&
                importConfirmation !== "IMPORT_SAMPLE_DATA_CONFIRM"
              }
              helperText={
                importConfirmation !== "" &&
                importConfirmation !== "IMPORT_SAMPLE_DATA_CONFIRM"
                  ? 'Must type exactly "IMPORT_SAMPLE_DATA_CONFIRM"'
                  : ""
              }
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setImportDialogOpen(false);
              setImportConfirmation("");
              setImportAdminPassword("");
            }}
            disabled={importLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImportSampleData}
            color="primary"
            variant="contained"
            disabled={
              importLoading ||
              importConfirmation !== "IMPORT_SAMPLE_DATA_CONFIRM" ||
              !importAdminPassword
            }
            startIcon={
              importLoading ? <CircularProgress size={20} /> : <ImportIcon />
            }
          >
            {importLoading ? "Importing..." : "Import Sample Data"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
