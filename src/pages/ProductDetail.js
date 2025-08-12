import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  TextField,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from "@mui/icons-material";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  fetchProductById,
  fetchRelatedProducts,
} from "../store/slices/productSlice";
// Removed Redux checkout actions - now using navigation state

import { useCurrency } from "../hooks/useCurrency";
import FallbackImage from "../components/common/FallbackImage";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const ProductDetail = () => {
  // Theme removed as it's not used
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentProduct, relatedProducts, loading, error } = useSelector(
    (state) => state.products
  );
  const { getFormattedProductPrice, formatPrice } = useCurrency();

  // Quantity is fixed to 1, no state needed
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: "",
    mobile: "",
  });
  const [contactErrors, setContactErrors] = useState({});

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProduct?.category?.slug) {
      dispatch(
        fetchRelatedProducts({
          categorySlug: currentProduct.category.slug,
          params: {
            limit: 4,
          },
        })
      );
    }
  }, [dispatch, currentProduct]);

  // Quantity is fixed to 1, so no quantity change handler needed

  const handleBuyNow = () => {
    if (!currentProduct) return;

    if (currentProduct.availability === 0) {
      toast.error("Service is currently unavailable");
      return;
    }

    setShowContactForm(true);
  };

  const validateContactInfo = () => {
    const errors = {};

    if (!contactInfo.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(contactInfo.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!contactInfo.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[+]?[0-9\s-()]{10,}$/.test(contactInfo.mobile.trim())) {
      errors.mobile = "Please enter a valid mobile number";
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = () => {
    if (!validateContactInfo()) {
      return;
    }

    // Navigate to checkout with all necessary data
    navigate("/checkout", {
      state: {
        product: {
          _id: currentProduct._id,
          title: currentProduct.title,
          price: currentProduct.price,
          images: currentProduct.images,
        },
        quantity: 1, // Fixed to 1 as requested
        customer: {
          email: contactInfo.email,
          mobile: contactInfo.mobile,
        },
      },
    });
  };

  const handleContactInfoChange = (field, value) => {
    setContactInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (contactErrors[field]) {
      setContactErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentProduct?.title,
          text: currentProduct?.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleRelatedProductClick = (productId) => {
    navigate(`/services/${productId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  if (error || !currentProduct) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Product not found"}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/services")}
          >
            Back to Services
          </Button>
        </Box>
      </Container>
    );
  }

  // Calculate converted price using currency hook
  const convertedPrice = currentProduct
    ? formatPrice(currentProduct.price || 0, "LKR")
    : "0";

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/services" color="inherit">
          Services
        </Link>
        {currentProduct.category && (
          <Link
            component={RouterLink}
            to={`/category/${currentProduct.category.slug}`}
            color="inherit"
          >
            {currentProduct.category.name}
          </Link>
        )}
        <Typography color="text.primary">{currentProduct.title}</Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <MotionBox
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <FallbackImage
              src={
                currentProduct.images && currentProduct.images.length > 0
                  ? currentProduct.images[selectedImage].url
                  : undefined
              }
              alt={currentProduct.title}
              height={{ xs: 300, md: 500 }}
              title={currentProduct.title}
              sx={{ borderRadius: 2, mb: 2 }}
            />

            {/* Thumbnail Images */}
            {currentProduct.images && currentProduct.images.length > 1 && (
              <Grid container spacing={1}>
                {currentProduct.images.map((image, index) => (
                  <Grid item xs={3} key={index}>
                    <FallbackImage
                      src={image.url}
                      alt={`${currentProduct.title} ${index + 1}`}
                      height={80}
                      title={currentProduct.title}
                      sx={{
                        width: "100%",
                        borderRadius: 1,
                        cursor: "pointer",
                        border: selectedImage === index ? 2 : 1,
                        borderColor:
                          selectedImage === index ? "primary.main" : "grey.300",
                        "&:hover": {
                          borderColor: "primary.main",
                        },
                      }}
                      onClick={() => setSelectedImage(index)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </MotionBox>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <MotionBox
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Title and Category */}
            <Box sx={{ mb: 3 }}>
              {currentProduct.category && (
                <Chip
                  label={currentProduct.category.name}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
              )}
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                {currentProduct.title}
              </Typography>
              {currentProduct.featured && (
                <Chip
                  label="Featured"
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
              )}
              {currentProduct.availability === 0 && (
                <Chip label="Unavailable" color="error" size="small" />
              )}
              {currentProduct.availability > 0 &&
                currentProduct.availability < 10 && (
                  <Chip
                    label={`Limited availability`}
                    color="warning"
                    size="small"
                  />
                )}
            </Box>

            {/* Price */}
            <Typography
              variant="h3"
              color="primary"
              sx={{ fontWeight: "bold", mb: 3 }}
            >
              {convertedPrice}
            </Typography>

            {/* Description */}
            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
              {currentProduct.description}
            </Typography>

            {/* Fixed Quantity: 1 */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Typography variant="body1">Quantity: 1</Typography>
            </Box>

            {/* Purchase Button */}
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CartIcon />}
                onClick={handleBuyNow}
                disabled={currentProduct.availability === 0}
                fullWidth
                sx={{ py: 1.5, fontSize: "1.1rem" }}
              >
                Purchase Now
              </Button>
            </Box>

            {/* Secondary Actions */}
            <Box sx={{ display: "flex", gap: 1, mb: 4 }}>
              <IconButton
                onClick={() => setIsFavorite(!isFavorite)}
                color={isFavorite ? "error" : "default"}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
              <IconButton onClick={handleShare}>
                <ShareIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Product Details */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Service Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    SKU
                  </Typography>
                  <Typography variant="body2">
                    {currentProduct.slug?.toUpperCase() || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Availability
                  </Typography>
                  <Typography variant="body2">
                    {currentProduct.availability > 0
                      ? "Available"
                      : "Unavailable"}
                  </Typography>
                </Grid>
                {currentProduct.category && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body2">
                      {currentProduct.category.name}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </MotionBox>
        </Grid>
      </Grid>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <Box sx={{ mt: 8 }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Related Services
          </Typography>
          <Grid container spacing={3}>
            {relatedProducts.map((product, index) => (
              <Grid item xs={12} sm={6} md={3} key={product._id}>
                <MotionCard
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => handleRelatedProductClick(product._id)}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      background:
                        product.images && product.images.length > 0
                          ? `url(${product.images[0].url})`
                          : (theme) => {
                              const checkerColor =
                                theme.palette.mode === "dark"
                                  ? "#333333"
                                  : "#f0f0f0";
                              return `linear-gradient(45deg, ${checkerColor} 25%, transparent 25%), linear-gradient(-45deg, ${checkerColor} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checkerColor} 75%), linear-gradient(-45deg, transparent 75%, ${checkerColor} 75%)`;
                            },
                      backgroundSize:
                        product.images && product.images.length > 0
                          ? "cover"
                          : "20px 20px",
                      backgroundPosition:
                        product.images && product.images.length > 0
                          ? "center"
                          : "0 0, 0 10px, 10px -10px, -10px 0px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {(!product.images || product.images.length === 0) && (
                      <Typography variant="h6" color="text.secondary">
                        {product.title}
                      </Typography>
                    )}
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom noWrap>
                      {product.title}
                    </Typography>
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    >
                      {getFormattedProductPrice(product)}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Contact Information Dialog */}
      <Dialog
        open={showContactForm}
        onClose={() => setShowContactForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
            Contact Information
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please provide your contact details to proceed with the purchase
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={contactInfo.email}
              onChange={(e) => handleContactInfoChange("email", e.target.value)}
              error={!!contactErrors.email}
              helperText={contactErrors.email}
              sx={{ mb: 3 }}
              required
            />
            <TextField
              fullWidth
              label="Mobile Number"
              type="tel"
              value={contactInfo.mobile}
              onChange={(e) =>
                handleContactInfoChange("mobile", e.target.value)
              }
              error={!!contactErrors.mobile}
              helperText={contactErrors.mobile}
              placeholder="+94 71 234 5678"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setShowContactForm(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleProceedToPayment}
            variant="contained"
            size="large"
            sx={{ px: 4 }}
          >
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductDetail;
