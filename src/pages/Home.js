import React, { useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchFeaturedProducts } from "../store/slices/productSlice";
import { fetchFeaturedCategories } from "../store/slices/categorySlice";

import { useCurrency } from "../hooks/useCurrency";

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { featuredProducts, loading: productsLoading } = useSelector(
    (state) => state.products
  );
  const { featuredCategories, loading: categoriesLoading } = useSelector(
    (state) => state.categories
  );
  const { getFormattedProductPrice } = useCurrency();

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchFeaturedCategories());
  }, [dispatch]);

  const handleProductClick = (productId) => {
    navigate(`/services/${productId}`);
  };

  const handleCategoryClick = (categorySlug) => {
    navigate(`/category/${categorySlug}`);
  };

  const features = [
    {
      icon: (
        <SecurityIcon
          sx={{ fontSize: 40, color: theme.palette.primary.main }}
        />
      ),
      title: "Instant Delivery",
      description: "Get your service accounts instantly after purchase",
    },
    {
      icon: (
        <ShippingIcon
          sx={{ fontSize: 40, color: theme.palette.primary.main }}
        />
      ),
      title: "Premium Quality",
      description: "Verified and working service accounts",
    },
    {
      icon: (
        <SupportIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      ),
      title: "24/7 Support",
      description: "Round-the-clock customer support",
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        sx={{
          background: (theme) => 
            theme.palette.mode === 'dark' 
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "primary.contrastText",
          py: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Typography
                  variant={isMobile ? "h3" : "h2"}
                  component="h1"
                  gutterBottom
                  sx={{ fontWeight: "bold", mb: 3 }}
                >
                  Premium Service
                  <br />
                  Accounts Store
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}
                >
                  Get instant access to premium service accounts like ChatGPT,
                  CapCut, Adobe and more. Verified accounts, instant delivery,
                  unbeatable prices.
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to="/services"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      bgcolor: (theme) => theme.palette.getContrastText(theme.palette.primary.main) === '#000' ? 'common.white' : 'background.paper',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.action.hover,
                      },
                    }}
                  >
                    Browse Services
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'primary.contrastText',
                      color: 'primary.contrastText',
                      '&:hover': {
                        borderColor: 'primary.contrastText',
                        bgcolor: (theme) => theme.palette.action.hover,
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </Box>
              </MotionBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: { xs: 300, md: 400 },
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Typography variant="h4" sx={{ opacity: 0.7 }}>
                    Hero Image
                  </Typography>
                </Box>
              </MotionBox>
            </Grid>
          </Grid>
        </Container>
      </MotionBox>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <MotionBox
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                sx={{
                  textAlign: "center",
                  p: 3,
                  borderRadius: 2,
                  "&:hover": {
                    transform: "translateY(-5px)",
                    transition: "transform 0.3s ease",
                  },
                }}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Categories */}
      <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <MotionBox
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            sx={{ textAlign: "center", mb: 6 }}
          >
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Service Categories
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Explore our premium service offerings
            </Typography>
          </MotionBox>

          <Grid container spacing={3}>
            {featuredCategories.map((category, index) => (
              <Grid item xs={12} sm={6} md={4} key={category._id}>
                <MotionCard
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => handleCategoryClick(category.slug)}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      background: category.image
                        ? `url(${category.image})`
                        : (theme) => {
                            const checkerColor = theme.palette.mode === 'dark' ? '#333333' : '#f0f0f0';
                            return `linear-gradient(45deg, ${checkerColor} 25%, transparent 25%), linear-gradient(-45deg, ${checkerColor} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${checkerColor} 75%), linear-gradient(-45deg, transparent 75%, ${checkerColor} 75%)`;
                          },
                      backgroundSize: category.image ? "cover" : "20px 20px",
                      backgroundPosition: category.image
                        ? "center"
                        : "0 0, 0 10px, 10px -10px, -10px 0px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!category.image && (
                      <Typography variant="h6" color="text.secondary">
                        {category.name}
                      </Typography>
                    )}
                  </CardMedia>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description || "Explore our collection"}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>

          {featuredCategories.length > 0 && (
            <Box sx={{ textAlign: "center", mt: 4 }}>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/services"
                endIcon={<ArrowForwardIcon />}
              >
                View All Categories
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* Featured Products */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <MotionBox
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          sx={{ textAlign: "center", mb: 6 }}
        >
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Featured Services
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Most popular service accounts
          </Typography>
        </MotionBox>

        <Grid container spacing={3}>
          {featuredProducts.slice(0, 6).map((product, index) => (
            <Grid item xs={12} sm={6} md={4} key={product._id}>
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
                onClick={() => handleProductClick(product._id)}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 250,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundImage: product.images?.[0]?.url
                      ? `url(${product.images[0].url})`
                      : "none",
                  }}
                  onError={(e) => {
                    // Handle background image failure
                    e.target.style.backgroundImage = "none";
                  }}
                >
                  {product.featured && (
                    <Chip
                      label="Featured"
                      color="primary"
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        zIndex: 1,
                      }}
                    />
                  )}
                  {(!product.images ||
                    product.images.length === 0 ||
                    !product.images[0]?.url) && (
                    <ImageFallback title={product.title} />
                  )}
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom noWrap>
                    {product.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {product.description}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    >
                      {getFormattedProductPrice(product)}
                    </Typography>
                    {product.availability < 10 && product.availability > 0 && (
                      <Chip
                        label={`Only ${product.availability} left`}
                        color="warning"
                        size="small"
                      />
                    )}
                    {product.availability === 0 && (
                      <Chip label="Out of Stock" color="error" size="small" />
                    )}
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {featuredProducts.length > 0 && (
          <Box sx={{ textAlign: "center", mt: 6 }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/services"
              endIcon={<ArrowForwardIcon />}
            >
              View All Services
            </Button>
          </Box>
        )}
      </Container>

      {/* Newsletter Section */}
      <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", py: 8 }}>
        <Container maxWidth="md">
          <MotionBox
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            sx={{ textAlign: "center" }}
          >
            <Typography
              variant="h4"
              component="h2"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Stay Updated
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Subscribe to our newsletter for the latest updates and exclusive
              offers
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : 'common.white',
                color: 'primary.main',
                "&:hover": {
                  bgcolor: (theme) => theme.palette.action.hover,
                },
              }}
            >
              Subscribe Now
            </Button>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

// Fallback SVG placeholder that works without external dependencies
const ImageFallback = ({ title }) => (
  <Box
    sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "grey.200",
      border: "2px dashed",
      borderColor: "grey.300",
    }}
  >
    <Box sx={{ textAlign: "center", opacity: 0.6 }}>
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
          fill="currentColor"
        />
      </svg>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        {title}
      </Typography>
    </Box>
  </Box>
);
