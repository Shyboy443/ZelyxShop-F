import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link as RouterLink,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchProductsByCategory } from "../store/slices/productSlice";
import { fetchCategoryBySlug } from "../store/slices/categorySlice";

import { useCurrency } from "../hooks/useCurrency";

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const Category = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    products,
    loading: productsLoading,
    pagination,
  } = useSelector((state) => state.products);
  const { currentCategory, loading: categoryLoading } = useSelector(
    (state) => state.categories
  );
  const { getFormattedProductPrice } = useCurrency();

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (slug && slug !== "undefined") {
      dispatch(fetchCategoryBySlug(slug));
    }
  }, [dispatch, slug]);

  useEffect(() => {
    if (slug && slug !== "undefined") {
      const params = {
        page: parseInt(searchParams.get("page")) || 1,
        limit: 12,
        sort: sortBy,
        order: sortOrder,
      };

      dispatch(fetchProductsByCategory({ categorySlug: slug, params }));
    }
  }, [dispatch, slug, searchParams, sortBy, sortOrder]);

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    // Reset to first page when sorting changes
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (event, page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handleProductClick = (productId) => {
    navigate(`/services/${productId}`);
  };

  const loading = productsLoading || categoryLoading;

  if (loading && !currentCategory) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  if (!currentCategory) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Category not found</Alert>
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
        <Typography color="text.primary">{currentCategory.name}</Typography>
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

      {/* Category Header */}
      <MotionBox
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        sx={{ mb: 6 }}
      >
        {/* Category Image */}
        {currentCategory.image && (
          <Box
            sx={{
              width: "100%",
              height: { xs: 200, md: 300 },
              background: `url(${currentCategory.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: 2,
              mb: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.4)",
                borderRadius: 2,
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                color: (theme) => theme.palette.primary.contrastText,
              }}
            >
              <Typography
                variant={isMobile ? "h3" : "h2"}
                component="h1"
                sx={{ fontWeight: "bold", mb: 2 }}
              >
                {currentCategory.name}
              </Typography>
              {currentCategory.description && (
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {currentCategory.description}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Category Info without Image */}
        {!currentCategory.image && (
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant={isMobile ? "h3" : "h2"}
              component="h1"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              {currentCategory.name}
            </Typography>
            {currentCategory.description && (
              <Typography variant="h6" color="text.secondary">
                {currentCategory.description}
              </Typography>
            )}
          </Box>
        )}
      </MotionBox>

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h6">{pagination.total} Services</Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => handleSortChange(e.target.value, sortOrder)}
            >
              <MenuItem value="createdAt">Newest</MenuItem>
              <MenuItem value="title">Name</MenuItem>
              <MenuItem value="price">Price</MenuItem>
              <MenuItem value="featured">Featured</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              label="Order"
              onChange={(e) => handleSortChange(sortBy, e.target.value)}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Products Grid */}
      {!loading && (
        <>
          <Grid container spacing={3}>
            {products.map((product, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                <MotionCard
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
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
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
                        }}
                      />
                    )}
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontWeight: "bold" }}
                      >
                        {getFormattedProductPrice(product)}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {product.availability < 10 &&
                          product.availability > 0 && (
                            <Chip
                              label={`${product.availability} left`}
                              color="warning"
                              size="small"
                            />
                          )}
                        {product.availability === 0 && (
                          <Chip
                            label="Out of Stock"
                            color="error"
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>

          {/* No Products */}
          {products.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found in this category
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Check back later for new products
              </Typography>
              <Button variant="outlined" component={RouterLink} to="/services">
                View All Services
              </Button>
            </Box>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </>
      )}

      {/* Category Stats */}
      {currentCategory && !loading && (
        <Box
          sx={{ mt: 8, p: 3, bgcolor: "background.default", borderRadius: 2 }}
        >
          <Typography variant="h6" gutterBottom>
            Category Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Total Services
              </Typography>
              <Typography variant="h6">{pagination.total}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Category
              </Typography>
              <Typography variant="h6">{currentCategory.name}</Typography>
            </Grid>
            {currentCategory.description && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">
                  {currentCategory.description}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Category;
