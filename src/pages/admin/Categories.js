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
  IconButton,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  clearError,
} from "../../store/slices/categorySlice";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const Categories = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { adminCategories, loading, error } = useSelector(
    (state) => state.categories
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    category: null,
  });
  const [categoryDialog, setCategoryDialog] = useState({
    open: false,
    category: null,
    mode: "create",
  });
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    featured: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const loadCategories = () => {
    dispatch(fetchAdminCategories());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
    toast.success("Categories refreshed");
  };

  const filteredCategories =
    adminCategories?.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleDeleteClick = (category) => {
    setDeleteDialog({ open: true, category });
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteAdminCategory(deleteDialog.category._id)).unwrap();
      toast.success("Category deleted successfully");
      setDeleteDialog({ open: false, category: null });
      loadCategories();
    } catch (error) {
      toast.error(error || "Failed to delete category");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, category: null });
  };

  const handleCreateClick = () => {
    setFormData({
      name: "",
      description: "",
      image: "",
      featured: false,
    });
    setFormErrors({});
    setCategoryDialog({ open: true, category: null, mode: "create" });
  };

  const handleEditClick = (category) => {
    setFormData({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
      featured: category.featured || false,
    });
    setFormErrors({});
    setCategoryDialog({ open: true, category, mode: "edit" });
  };

  const handleCategoryDialogClose = () => {
    setCategoryDialog({ open: false, category: null, mode: "create" });
    setFormData({
      name: "",
      description: "",
      image: "",
      featured: false,
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.type === "checkbox" ? checked : value,
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Service category name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (categoryDialog.mode === "create") {
        await dispatch(createAdminCategory(formData)).unwrap();
        toast.success("Category created successfully");
      } else {
        await dispatch(
          updateAdminCategory({
            id: categoryDialog.category._id,
            data: formData,
          })
        ).unwrap();
        toast.success("Category updated successfully");
      }

      handleCategoryDialogClose();
      loadCategories();
    } catch (error) {
      toast.error(error || `Failed to ${categoryDialog.mode} category`);
    } finally {
      setSubmitting(false);
    }
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
            Categories
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
              onClick={handleCreateClick}
            >
              Add Category
            </Button>
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Organize your services with categories
        </Typography>
      </MotionBox>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        sx={{ mb: 3 }}
      >
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search service categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
        </CardContent>
      </MotionCard>

      {/* Categories Grid */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : filteredCategories.length > 0 ? (
          <Grid container spacing={3}>
            {filteredCategories.map((category) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={category._id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  {/* Category Image */}
                  <Box
                    sx={{
                      height: 200,
                      background: category.image
                        ? `url(${category.image})`
                        : `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {!category.image && (
                      <ImageIcon
                        sx={{
                          fontSize: 60,
                          color: "primary.contrastText",
                          opacity: 0.7,
                        }}
                      />
                    )}

                    {category.featured && (
                      <Chip
                        icon={<StarIcon />}
                        label="Featured"
                        color="primary"
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                        }}
                      />
                    )}
                  </Box>

                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      {category.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, flexGrow: 1 }}
                    >
                      {category.description || "No description available"}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      gutterBottom
                    >
                      Slug: {category.slug}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      gutterBottom
                    >
                      Created:{" "}
                      {new Date(category.createdAt).toLocaleDateString()}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="View Category">
                          <IconButton
                            component={RouterLink}
                            to={`/services?category=${category.slug}`}
                            target="_blank"
                            size="small"
                            color="info"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Category">
                          <IconButton
                            onClick={() => handleEditClick(category)}
                            size="small"
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Category">
                          <IconButton
                            onClick={() => handleDeleteClick(category)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No service categories found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {searchTerm
                    ? "Try adjusting your search"
                    : "Create your first service category to get started"}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateClick}
                >
                  Add Category
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </MotionBox>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialog.open}
        onClose={handleCategoryDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {categoryDialog.mode === "create"
              ? "Create Category"
              : "Edit Category"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}
            >
              <TextField
                fullWidth
                label="Service Category Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Enter service category description..."
              />

              <TextField
                fullWidth
                label="Image URL"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.featured}
                    onChange={handleInputChange}
                    name="featured"
                  />
                }
                label="Featured Service Category"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCategoryDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? (
                <CircularProgress size={24} />
              ) : categoryDialog.mode === "create" ? (
                "Create"
              ) : (
                "Update"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.category?.name}"?
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

export default Categories;
