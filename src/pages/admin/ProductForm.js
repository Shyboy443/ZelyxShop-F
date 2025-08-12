import React, { useState, useEffect } from "react";
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
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import imageCompression from "browser-image-compression";
import {
  createAdminProduct,
  updateAdminProduct,
  fetchAdminProductById,
  clearCurrentProduct,
  clearError,
} from "../../store/slices/productSlice";
import { fetchAdminCategories } from "../../store/slices/categorySlice";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const ProductForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { currentProduct, loading, error } = useSelector(
    (state) => state.products
  );
  const { categories } = useSelector((state) => state.categories);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    images: [],
    featured: false,
    availability: "",
    features: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchAdminCategories());

    if (isEdit && id) {
      dispatch(fetchAdminProductById(id));
    }

    return () => {
      dispatch(clearCurrentProduct());
      dispatch(clearError());
    };
  }, [dispatch, id, isEdit]);

  useEffect(() => {
    if (isEdit && currentProduct) {
      setFormData({
        title: currentProduct.title || "",
        description: currentProduct.description || "",
        price: currentProduct.price?.toString() || "",
        category: currentProduct.category?._id || "",
        images: currentProduct.images?.length > 0 ? currentProduct.images : [],
        featured: currentProduct.featured || false,
        availability: currentProduct.availability?.toString() || "",
        features: currentProduct.features || [],
      });
    }
  }, [currentProduct, isEdit]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleFeatureAdd = () => {
    if (tagInput.trim() && !formData.features.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleFeatureRemove = (featureToRemove) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((feature) => feature !== featureToRemove),
    }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error('Please upload only JPEG, PNG, or WebP images.');
      return;
    }

    setSaving(true);
    toast.loading('Optimizing and uploading images...', { id: 'image-upload' });

    try {
      // Image compression options for optimal web display with enhanced quality
      const compressionOptions = {
        maxSizeMB: 2.5, // Increased file size limit for better quality
        maxWidthOrHeight: 1920, // Higher resolution for better quality
        useWebWorker: true, // Use web worker for better performance
        fileType: 'image/jpeg', // Convert to JPEG for better compression
        quality: 0.92, // Higher image quality (0.1 to 1)
        initialQuality: 0.92,
        preserveExif: true, // Preserve image metadata
      };

      // Compress all images
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          try {
            const compressedFile = await imageCompression(file, compressionOptions);
            
            // Create a new file with proper name and type
            const optimizedFile = new File(
              [compressedFile], 
              file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
              { 
                type: 'image/jpeg',
                lastModified: Date.now()
              }
            );
            
            return optimizedFile;
          } catch (compressionError) {
            console.warn(`Failed to compress ${file.name}, using original:`, compressionError);
            return file; // Fallback to original file if compression fails
          }
        })
      );

      // Check final file sizes (should be under 3MB after compression)
      const oversizedFiles = compressedFiles.filter((file) => file.size > 3 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('Some images are still too large after optimization. Please try smaller images.');
        return;
      }

      const formDataUpload = new FormData();
      compressedFiles.forEach((file) => {
        formDataUpload.append("images", file);
      });

      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/upload/product-images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...data.images],
      }));

      toast.success(`${files.length} image(s) optimized and uploaded successfully`, { id: 'image-upload' });
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload images. Please try again.", { id: 'image-upload' });
    } finally {
      setSaving(false);
      // Reset the file input
      event.target.value = "";
    }
  };

  const removeImageField = async (index) => {
    const imageToRemove = formData.images[index];

    // If it's a Cloudinary image with public_id, delete from Cloudinary
    if (
      imageToRemove &&
      typeof imageToRemove === "object" &&
      imageToRemove.public_id
    ) {
      try {
        const token = localStorage.getItem("adminToken");
        await fetch(`/api/upload/product-image/${imageToRemove.public_id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Failed to delete image from Cloudinary:", error);
      }
    }

    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (
      !formData.price ||
      isNaN(formData.price) ||
      parseFloat(formData.price) <= 0
    ) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (
      formData.images.length === 0 ||
      (!formData.images[0]?.url && !formData.images[0]?.trim())
    ) {
      newErrors.images = "At least one image is required";
    }

    if (
      formData.availability &&
      (isNaN(formData.availability) || parseInt(formData.availability) < 0)
    ) {
      newErrors.availability = "Availability must be a non-negative number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setSaving(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        availability: formData.availability
          ? parseInt(formData.availability)
          : 0,
        images: formData.images
          .filter((img) => {
            if (typeof img === "string") {
              return img.trim();
            }
            return img && img.url;
          })
          .map((img) => {
            if (typeof img === "string") {
              return { url: img };
            }
            return img;
          }),
        category: formData.category,
      };

      // Remove undefined values
      Object.keys(productData).forEach((key) => {
        if (productData[key] === undefined) {
          delete productData[key];
        }
      });

      if (isEdit) {
        await dispatch(updateAdminProduct({ id, productData })).unwrap();
        toast.success("Product updated successfully");
      } else {
        await dispatch(createAdminProduct(productData)).unwrap();
        toast.success("Product created successfully");
      }

      navigate("/admin/products");
    } catch (error) {
      toast.error(error || `Failed to ${isEdit ? "update" : "create"} product`);
    } finally {
      setSaving(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{ mb: 4 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <IconButton
            onClick={() => navigate("/admin/products")}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h3" component="h1" sx={{ fontWeight: "bold" }}>
            {isEdit ? "Edit Product" : "Create Product"}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary">
          {isEdit
            ? "Update product information"
            : "Add a new product to your catalog"}
        </Typography>
      </MotionBox>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  Basic Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Product Title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      error={!!errors.title}
                      helperText={errors.title}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      error={!!errors.description}
                      helperText={errors.description}
                      multiline
                      rows={4}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Price (LKR)"
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      error={!!errors.price}
                      helperText={errors.price}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">Rs.</InputAdornment>
                        ),
                      }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!errors.category}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        label="Category"
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                        required
                      >
                        {categories.map((category) => (
                          <MenuItem key={category._id} value={category._id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.category && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5, ml: 1.5 }}
                        >
                          {errors.category}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Settings */}
          <Grid item xs={12} md={4}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  Settings
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.featured}
                        onChange={(e) =>
                          handleInputChange("featured", e.target.checked)
                        }
                      />
                    }
                    label="Featured Product"
                  />

                  <TextField
                    fullWidth
                    label="Available Accounts"
                    type="number"
                    value={formData.availability}
                    onChange={(e) =>
                      handleInputChange("availability", e.target.value)
                    }
                    error={!!errors.availability}
                    helperText={errors.availability}
                    placeholder="Number of accounts available"
                  />
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Images */}
          <Grid item xs={12}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Product Images
                </Typography>

                {errors.images && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.images}
                  </Alert>
                )}

                <Box sx={{ mb: 2 }}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    id="image-upload-input"
                  />
                  <label htmlFor="image-upload-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      fullWidth
                      sx={{ mb: 1 }}
                      disabled={saving}
                    >
                      {saving ? 'Optimizing Images...' : 'Upload Images'}
                    </Button>
                  </label>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Enhanced Quality Optimization:</strong> Images will be automatically resized to 1920px max dimension, 
                      compressed to under 2.5MB with 92% quality, and converted to JPEG format for superior web performance.
                    </Typography>
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Supports JPEG, PNG, and WebP formats. Images are automatically optimized for high-quality display with fast loading.
                  </Typography>
                </Box>

                {formData.images.length > 0 && (
                  <Grid container spacing={2}>
                    {formData.images.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box
                          sx={{
                            position: "relative",
                            border: "1px solid #ddd",
                            borderRadius: 1,
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={typeof image === "string" ? image : image.url}
                            alt={`Product ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                            }}
                          />
                          <IconButton
                            onClick={() => removeImageField(index)}
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              backgroundColor: "rgba(255,255,255,0.8)",
                              "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.9)",
                              },
                            }}
                            size="small"
                            color="error"
                          >
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Account Features */}
          <Grid item xs={12} md={6}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  Account Features
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Feature"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="e.g., Unlimited usage, No ads, Priority support"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFeatureAdd();
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleFeatureAdd} edge="end">
                            <AddIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formData.features.map((feature, index) => (
                    <Chip
                      key={index}
                      label={feature}
                      onDelete={() => handleFeatureRemove(feature)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
                {formData.features.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Add features that describe what this account includes (e.g.,
                    "No ads", "Unlimited downloads", "Premium templates")
                  </Typography>
                )}
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/products")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={
                  saving ? <CircularProgress size={20} /> : <SaveIcon />
                }
                disabled={saving}
                size="large"
              >
                {saving
                  ? "Saving..."
                  : isEdit
                  ? "Update Product"
                  : "Create Product"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default ProductForm;
