import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Paper,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from "@mui/material";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  SmartToy as AutoDeliveryIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { debounce } from "lodash";
import {
  fetchProducts,
  setFilters,
  clearFilters,
} from "../store/slices/productSlice";
import { fetchCategories } from "../store/slices/categorySlice";

import { useCurrency } from "../hooks/useCurrency";

const MotionCard = motion(Card);

// Separate FilterContent component to prevent recreation
const FilterContent = React.memo(
  ({
    isMobile,
    setFilterDrawerOpen,
    searchInput,
    handleSearchChange,
    localFilters,
    handleFilterChange,
    categories,
    priceRange,
    handlePriceRangeChange,
    handlePriceRangeCommitted,
    clearAllFilters,
    formatPrice,
    selectedCurrency,
    currencyRange,
  }) => {
    const theme = useTheme();
    return (
      <Box
        sx={{
          p: 2.5,
          width: isMobile ? "100%" : 280,
          maxHeight: isMobile ? "100vh" : "calc(100vh - 120px)",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2.5,
            position: "sticky",
            top: 0,
            backgroundColor: "background.paper",
            zIndex: 1,
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          {isMobile && (
            <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>

        {/* Search */}
        <Box sx={{ mb: 2.5 }}>
          <TextField
            key="search-input"
            fullWidth
            size="small"
            label="Search Services"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Price Range Slider */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Price Range
        </Typography>
        <Box sx={{ px: 2, mb: 2 }}>
          <Slider
            range
            value={priceRange}
            min={currencyRange.min}
            max={currencyRange.max}
            step={currencyRange.step}
            onChange={handlePriceRangeChange}
            onAfterChange={handlePriceRangeCommitted}
            allowCross={false}
            pushable={selectedCurrency === "USD" ? 1 : 500}
            trackStyle={[{ backgroundColor: theme.palette.primary.main, height: 8 }]}
            handleStyle={[
              {
                borderColor: theme.palette.primary.main,
                height: 24,
                width: 24,
                marginTop: -8,
                backgroundColor: theme.palette.background.paper,
              },
              {
                borderColor: theme.palette.primary.main,
                height: 24,
                width: 24,
                marginTop: -8,
                backgroundColor: theme.palette.background.paper,
              },
            ]}
            railStyle={{ height: 8, opacity: 0.3 }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 1,
            "& .MuiTypography-root": {
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "text.secondary",
            },
          }}
        >
          <Typography>
            {formatPrice(priceRange[0], selectedCurrency)}
          </Typography>
          <Typography>
            {formatPrice(priceRange[1], selectedCurrency)}
          </Typography>
        </Box>
      </Box>
    );
  }
);

const Services = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { products, loading, error, pagination, filters } = useSelector(
    (state) => state.products
  );
  const { categories } = useSelector((state) => state.categories);
  const {
    getFormattedProductPrice,
    formatPrice,
    selectedCurrency,
    convertPrice,
  } = useCurrency();

  // Currency-aware price range helpers
  const getCurrencyPriceRange = () => {
    // Fallback values in case selectedCurrency is undefined
    const safeCurrency = selectedCurrency || "LKR";
    return safeCurrency === "USD"
      ? { min: 0, max: 150, step: 1, defaultMax: 30 }
      : { min: 0, max: 30000, step: 500, defaultMax: 30000 };
  };

  const convertPriceToLKR = (price) => {
    return convertPrice(price, selectedCurrency, "LKR");
  };

  const convertPriceFromLKR = (price) => {
    return convertPrice(price, "LKR", selectedCurrency);
  };

  const currencyRange = useMemo(
    () => getCurrencyPriceRange(),
    [selectedCurrency]
  );

  // Initialize state with persistent values
  const getInitialPriceRange = () => {
    try {
      // Get safe currency and range values
      const safeCurrency = selectedCurrency || "LKR";
      const safeRange = currencyRange || getCurrencyPriceRange();
      const maxValue = safeRange?.max || safeRange?.defaultMax || 30000;

      const savedRange = localStorage.getItem(`priceRange_${safeCurrency}`);
      const clamp = (val, min, max) =>
        Math.max(min || 0, Math.min(max || 30000, val || 0));

      if (savedRange) {
        try {
          const parsed = JSON.parse(savedRange);
          if (Array.isArray(parsed) && parsed.length === 2) {
            return [
              clamp(parsed[0], 0, maxValue),
              clamp(parsed[1], 0, maxValue),
            ];
          }
        } catch (e) {
          console.warn("Error parsing saved price range:", e);
          // Malformed JSON, return default
          return [0, maxValue];
        }
      }
      // No saved range, return default
      return [0, maxValue];
    } catch (error) {
      console.warn("Error in getInitialPriceRange:", error);
      // Ultimate fallback
      return [0, 30000];
    }
  };

  // Initialize refs first
  const skipUrlUpdateRef = useRef(false);
  const isInitialMount = useRef(true);
  const userHasInteractedWithSlider = useRef(false);
  const priceRangeRef = useRef([0, 30000]); // Safe default initialization

  // Initialize state with safe defaults
  const [localFilters, setLocalFilters] = useState(() => {
    try {
      const initialRange = getInitialPriceRange();
      // Ensure initialRange is always a valid array
      const safeRange =
        Array.isArray(initialRange) && initialRange.length === 2
          ? initialRange
          : [0, 30000];
      return {
        search: "",
        category: "",
        minPrice: safeRange[0],
        maxPrice: safeRange[1],
        featured: false,
        inStock: false,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
    } catch (error) {
      console.warn("Error initializing localFilters:", error);
      return {
        search: "",
        category: "",
        minPrice: 0,
        maxPrice: 30000,
        featured: false,
        inStock: false,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
    }
  });

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState(() => {
    try {
      const initialRange = getInitialPriceRange();
      // Ensure initialRange is always a valid array
      const safeRange =
        Array.isArray(initialRange) && initialRange.length === 2
          ? initialRange
          : [0, 30000];
      priceRangeRef.current = safeRange; // Update ref immediately
      return safeRange;
    } catch (error) {
      console.warn("Error initializing priceRange:", error);
      const fallbackRange = [0, 30000];
      priceRangeRef.current = fallbackRange;
      return fallbackRange;
    }
  });

  // Update ref whenever priceRange changes
  useEffect(() => {
    if (Array.isArray(priceRange) && priceRange.length === 2) {
      priceRangeRef.current = priceRange;
    }
  }, [priceRange]);

  const [searchInput, setSearchInput] = useState("");
  const [isUpdatingFromSlider, setIsUpdatingFromSlider] = useState(false);
  const previousCurrency = useRef(selectedCurrency);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Debounced save to localStorage to prevent excessive writes
  const debouncedSavePriceRange = useRef(
    debounce((range, currency) => {
      localStorage.setItem(`priceRange_${currency}`, JSON.stringify(range));
    }, 300)
  ).current;

  // Persist price range to localStorage
  const savePriceRange = useCallback(
    (range) => {
      debouncedSavePriceRange(range, selectedCurrency);
    },
    [selectedCurrency, debouncedSavePriceRange]
  );

  // Save state on component unmount
  useEffect(() => {
    return () => {
      // Save current price range on unmount
      if (priceRange && priceRange.length === 2) {
        localStorage.setItem(
          `priceRange_${selectedCurrency}`,
          JSON.stringify(priceRange)
        );
      }
    };
  }, [priceRange, selectedCurrency]);

  // Handle currency changes more gracefully
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Don't reset if slider is being used
    if (isUpdatingFromSlider) return;

    // Don't reset if user has manually interacted with slider
    if (userHasInteractedWithSlider.current) return;

    // Check if URL has price parameters - if so, let URL handling take care of it
    const hasUrlPriceParams =
      searchParams.has("minPrice") || searchParams.has("maxPrice");
    if (hasUrlPriceParams) return;

    const newRange = getCurrencyPriceRange();

    // Try to convert current price range to new currency
    let rangeToUse;
    try {
      const currentRange = priceRangeRef.current || [0, 30000];
      const oldCurrency = previousCurrency.current;

      // Convert current range from old currency to new currency
      const convertedMin = convertPrice(
        currentRange[0],
        oldCurrency,
        selectedCurrency
      );
      const convertedMax = convertPrice(
        currentRange[1],
        oldCurrency,
        selectedCurrency
      );

      // Round converted values to avoid floating point precision issues
      const roundedMin = Math.round(convertedMin * 100) / 100;
      const roundedMax = Math.round(convertedMax * 100) / 100;

      // Clamp the converted values to the new currency's valid range
      const clampedMin = Math.max(
        0,
        Math.min(roundedMin, newRange?.max || 30000)
      );
      const clampedMax = Math.max(
        clampedMin,
        Math.min(roundedMax, newRange?.max || 30000)
      );

      // Ensure minimum distance between handles based on currency step
      const minDistance = newRange?.step || 1;
      const adjustedMax = Math.max(clampedMax, clampedMin + minDistance);

      // Use converted range if it's reasonable, otherwise use defaults
      if (adjustedMax <= (newRange?.max || 30000) && clampedMin >= 0) {
        rangeToUse = [
          clampedMin,
          Math.min(adjustedMax, newRange?.max || 30000),
        ];
      } else {
        rangeToUse = [0, newRange?.defaultMax || 30000];
      }
    } catch (error) {
      console.warn("Error converting price range for currency change:", error);
      rangeToUse = [0, newRange?.defaultMax || 30000];
    }

    // Update previous currency reference
    previousCurrency.current = selectedCurrency;

    // Update the price range for currency changes
    setPriceRange(rangeToUse);
    setLocalFilters((prev) => ({
      ...prev,
      minPrice: rangeToUse[0],
      maxPrice: rangeToUse[1],
    }));
  }, [selectedCurrency, isUpdatingFromSlider, searchParams, convertPrice]);

  useEffect(() => {
    // Skip URL updates when slider is being dragged
    if (skipUrlUpdateRef.current) {
      skipUrlUpdateRef.current = false;
      return;
    }

    // Create local copies of conversion functions
    const convertFrom = convertPriceFromLKR;
    const convertTo = convertPriceToLKR;

    const categoryParam = searchParams.get("category") || "";
    let categoryId = "";

    if (categoryParam && categories.length > 0) {
      const categoryObject = categories.find(
        (c) => c.slug === categoryParam || c._id === categoryParam
      );
      if (categoryObject) {
        categoryId = categoryObject._id;
      }
    }

    // Get price values from URL (stored in LKR) and convert to current currency for display
    const minPriceLKR = parseInt(searchParams.get("minPrice")) || 0;
    const maxPriceLKR = parseInt(searchParams.get("maxPrice")) || 0;

    // Check if URL has price parameters
    const hasUrlPriceParams =
      searchParams.has("minPrice") || searchParams.has("maxPrice");

    let minPriceDisplay, maxPriceDisplay;

    if (hasUrlPriceParams) {
      // Use URL values if they exist and convert with proper rounding
      const convertedMin =
        minPriceLKR > 0 ? convertPriceFromLKR(minPriceLKR) : 0;
      const convertedMax =
        maxPriceLKR > 0
          ? convertPriceFromLKR(maxPriceLKR)
          : currencyRange?.defaultMax || 30000;

      // Round to avoid floating point precision issues
      minPriceDisplay = Math.round(convertedMin * 100) / 100;
      maxPriceDisplay = Math.round(convertedMax * 100) / 100;

      // Clamp to currency range
      minPriceDisplay = Math.max(
        0,
        Math.min(minPriceDisplay, currencyRange?.max || 30000)
      );
      maxPriceDisplay = Math.max(
        minPriceDisplay,
        Math.min(maxPriceDisplay, currencyRange?.max || 30000)
      );
    } else {
      // Use current slider values if no URL params (preserve user selection)
      minPriceDisplay = priceRangeRef.current?.[0] || 0;
      maxPriceDisplay =
        priceRangeRef.current?.[1] || currencyRange?.defaultMax || 30000;
    }

    const urlFilters = {
      search: searchParams.get("search") || "",
      category: categoryId,
      minPrice: minPriceDisplay,
      maxPrice: maxPriceDisplay,
      featured: searchParams.get("featured") === "true",
      inStock: searchParams.get("inStock") === "true",
      sortBy:
        searchParams.get("sort") || searchParams.get("sortBy") || "createdAt",
      sortOrder:
        searchParams.get("order") || searchParams.get("sortOrder") || "desc",
    };

    // Only update state if not currently dragging slider
    if (!isUpdatingFromSlider) {
      // Always update non-price filters
      setLocalFilters((prev) => ({
        ...prev,
        search: urlFilters.search,
        category: urlFilters.category,
        featured: urlFilters.featured,
        inStock: urlFilters.inStock,
        sortBy: urlFilters.sortBy,
        sortOrder: urlFilters.sortOrder,
        // Only update price if URL has explicit price parameters
        ...(hasUrlPriceParams && {
          minPrice: urlFilters.minPrice,
          maxPrice: urlFilters.maxPrice,
        }),
      }));

      setSearchInput(urlFilters.search);

      // Only update price range if URL has explicit price parameters
      if (hasUrlPriceParams) {
        const clampedRange = [
          Math.max(
            0,
            Math.min(urlFilters.minPrice, currencyRange?.max || 30000)
          ),
          Math.max(
            0,
            Math.min(urlFilters.maxPrice, currencyRange?.max || 30000)
          ),
        ];

        // Ensure minimum distance between handles
        const minDistance = currencyRange?.step || 1;
        if (clampedRange[1] - clampedRange[0] < minDistance) {
          clampedRange[1] = Math.min(
            clampedRange[0] + minDistance,
            currencyRange?.max || 30000
          );
        }

        setPriceRange(clampedRange);
        // Save to localStorage with debounced function
        debouncedSavePriceRange(clampedRange, selectedCurrency);
      }
    }

    // Don't update Redux store filters during slider interaction to prevent product fetching
    if (!isUpdatingFromSlider) {
      dispatch(
        setFilters({
          ...urlFilters,
          minPrice:
            minPriceLKR ||
            (urlFilters.minPrice > 0 ? convertTo(urlFilters.minPrice) : 0),
          maxPrice: maxPriceLKR || convertTo(urlFilters.maxPrice),
        })
      );
    }
  }, [
    searchParams,
    dispatch,
    categories,
    isUpdatingFromSlider,
    currencyRange.defaultMax,
  ]);

  useEffect(() => {
    const params = {
      page: parseInt(searchParams.get("page")) || 1,
      limit: 12,
      search: filters.search,
      category: filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      featured: filters.featured,
      inStock: filters.inStock,
      sort: filters.sortBy, // Map sortBy to sort for backend
      order: filters.sortOrder, // Map sortOrder to order for backend
    };

    dispatch(fetchProducts(params));
  }, [dispatch, filters, searchParams]);

  // Stable debounced function using useRef to prevent recreation
  const debouncedApplyFilters = useRef(
    debounce((filters, setSearchParamsFunc) => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        // Allow 0 values for price fields, exclude empty strings and false values
        const shouldInclude =
          key === "minPrice" || key === "maxPrice"
            ? value !== "" && value !== null && value !== undefined
            : value !== "" && value !== false && value !== 0;

        if (shouldInclude) {
          // Map frontend parameter names to backend expected names
          const paramKey =
            key === "sortBy" ? "sort" : key === "sortOrder" ? "order" : key;

          // Convert price values to LKR for backend
          if (key === "minPrice" || key === "maxPrice") {
            // Round the input value first to avoid precision issues
            const roundedValue = Math.round(value * 100) / 100;
            const priceInLKR = Math.round(
              convertPrice(roundedValue, selectedCurrency, "LKR")
            );
            params.set(paramKey, priceInLKR.toString());
          } else {
            params.set(paramKey, value.toString());
          }
        }
      });

      params.set("page", "1");
      setSearchParamsFunc(params);
    }, 800)
  ).current;

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);

    // Apply filters in real-time for non-search fields immediately
    if (
      key === "category" ||
      key === "featured" ||
      key === "inStock" ||
      key === "sortBy" ||
      key === "sortOrder"
    ) {
      debouncedApplyFilters(newFilters, setSearchParams);
    }
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
    // Only update search input state, debounced function will handle filter application
    debouncedApplyFilters({ ...localFilters, search: value }, setSearchParams);
  };

  // rc-slider handlers - rc-slider passes value directly, not (event, value) like MUI
  const handlePriceRangeChange = useCallback((newValue) => {
    // Ensure newValue is always an array with 2 elements
    if (!Array.isArray(newValue) || newValue.length !== 2) {
      console.warn("Invalid price range value:", newValue);
      return;
    }

    // Round values to avoid floating point precision issues
    const roundedValue = [
      Math.round(newValue[0] * 100) / 100,
      Math.round(newValue[1] * 100) / 100,
    ];

    setIsUpdatingFromSlider(true);
    userHasInteractedWithSlider.current = true;

    // Only update the visual state during sliding - no filter updates or localStorage saves
    setPriceRange(roundedValue);

    // Safety timeout to reset flag in case onAfterChange doesn't fire
    setTimeout(() => {
      setIsUpdatingFromSlider(false);
    }, 1000);
  }, []);

  const handlePriceRangeCommitted = useCallback(
    (newValue) => {
      // Ensure newValue is always an array with 2 elements
      if (!Array.isArray(newValue) || newValue.length !== 2) {
        console.warn("Invalid price range committed value:", newValue);
        return;
      }

      // Round values to avoid floating point precision issues
      const roundedValue = [
        Math.round(newValue[0] * 100) / 100,
        Math.round(newValue[1] * 100) / 100,
      ];

      setIsUpdatingFromSlider(false);
      skipUrlUpdateRef.current = true;

      // Update local filters
      const updatedFilters = {
        ...localFilters,
        minPrice: roundedValue[0],
        maxPrice: roundedValue[1],
      };

      setLocalFilters(updatedFilters);

      // Update Redux store with new price range (convert to LKR and round)
      const minPriceLKR = Math.round(convertPriceToLKR(roundedValue[0]));
      const maxPriceLKR = Math.round(convertPriceToLKR(roundedValue[1]));

      dispatch(
        setFilters({
          ...filters,
          minPrice: minPriceLKR,
          maxPrice: maxPriceLKR,
        })
      );

      // Save to localStorage for persistence
      savePriceRange(roundedValue);

      // Apply filters to trigger product refresh
      debouncedApplyFilters(updatedFilters, setSearchParams);
    },
    [
      localFilters,
      setSearchParams,
      savePriceRange,
      dispatch,
      filters,
      convertPriceToLKR,
    ]
  );

  const applyFilters = () => {
    const params = new URLSearchParams();

    Object.entries(localFilters).forEach(([key, value]) => {
      // Always include boolean filters (featured, inStock), allow 0 values for price fields, exclude empty strings
      const shouldInclude =
        key === "minPrice" || key === "maxPrice"
          ? value !== "" && value !== null && value !== undefined
          : key === "featured" || key === "inStock"
          ? true
          : value !== "" && value !== false && value !== 0;

      if (shouldInclude) {
        // Map frontend parameter names to backend expected names
        const paramKey =
          key === "sortBy" ? "sort" : key === "sortOrder" ? "order" : key;

        // Convert price values to LKR for backend
        if (key === "minPrice" || key === "maxPrice") {
          // Round the input value first to avoid precision issues
          const roundedValue = Math.round(value * 100) / 100;
          const priceInLKR = Math.round(convertPriceToLKR(roundedValue));
          params.set(paramKey, priceInLKR.toString());
        } else {
          params.set(paramKey, value.toString());
        }
      }
    });

    params.set("page", "1"); // Reset to first page
    setSearchParams(params);
    setFilterDrawerOpen(false);
  };

  const clearAllFilters = () => {
    const defaultFilters = {
      search: "",
      category: "",
      minPrice: 0,
      maxPrice: currencyRange.defaultMax,
      featured: false,
      inStock: false,
      sortBy: "createdAt",
      sortOrder: "desc",
    };

    setLocalFilters(defaultFilters);
    setSearchInput("");
    setPriceRange([0, currencyRange.max]);

    // Reset user interaction flag
    userHasInteractedWithSlider.current = false;

    // Clear localStorage for current currency
    localStorage.removeItem(`priceRange_${selectedCurrency}`);

    setSearchParams(new URLSearchParams());
    dispatch(clearFilters());
    setFilterDrawerOpen(false);
  };

  const handlePageChange = (event, page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handleProductClick = (productId) => {
    navigate(`/services/${productId}`);
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Services
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Premium services for all your needs
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Desktop Filters */}
        {!isMobile && (
          <Grid item md={3}>
            <Paper
              elevation={2}
              sx={{
                position: "sticky",
                top: 100,
                borderRadius: 3,
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
              }}
            >
              <FilterContent
                isMobile={isMobile}
                setFilterDrawerOpen={setFilterDrawerOpen}
                searchInput={searchInput}
                handleSearchChange={handleSearchChange}
                localFilters={localFilters}
                handleFilterChange={handleFilterChange}
                categories={categories}
                priceRange={priceRange}
                handlePriceRangeChange={handlePriceRangeChange}
                handlePriceRangeCommitted={handlePriceRangeCommitted}
                clearAllFilters={clearAllFilters}
                formatPrice={formatPrice}
                selectedCurrency={selectedCurrency}
                currencyRange={currencyRange}
              />
            </Paper>
          </Grid>
        )}

        {/* Services */}
        <Grid item xs={12} md={9}>
          {/* Mobile Filter Button */}
          {isMobile && (
            <Box
              sx={{
                mb: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">{pagination.total} Services</Typography>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDrawerOpen(true)}
              >
                Filters
              </Button>
            </Box>
          )}

          {/* Loading */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Services Grid */}
          {!loading && (
            <>
              <Grid container spacing={3}>
                {products.map((product, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={product._id}>
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
                            }}
                          />
                        )}
                        {(!product.images ||
                          product.images.length === 0 ||
                          !product.images[0]?.url) && (
                          <Typography variant="h6" color="text.secondary">
                            {product.title || "Untitled"}
                          </Typography>
                        )}
                      </CardMedia>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="h6"
                          component="h3"
                          gutterBottom
                          noWrap
                        >
                          {product.title || "Untitled"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {product.description || "No description available"}
                        </Typography>

                        {/* Service Features */}
                        <Box
                          sx={{
                            mb: 2,
                            display: "flex",
                            gap: 0.5,
                            flexWrap: "wrap",
                          }}
                        >
                          {product.autoDelivery && (
                            <Chip
                              icon={<AutoDeliveryIcon />}
                              label="Auto-Delivery"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
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
                          <Box
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                          >
                            {(product.availability || 0) < 10 &&
                              (product.availability || 0) > 0 && (
                                <Chip
                                  label={`${product.availability || 0} left`}
                                  color="warning"
                                  size="small"
                                />
                              )}
                            {(product.availability || 0) === 0 && (
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

              {/* No Services */}
              {products.length === 0 && (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No services found
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Try adjusting your filters or search different service types
                  </Typography>
                  <Button variant="outlined" onClick={clearAllFilters}>
                    Clear Filters
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
        </Grid>
      </Grid>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <FilterContent
          isMobile={isMobile}
          setFilterDrawerOpen={setFilterDrawerOpen}
          searchInput={searchInput}
          handleSearchChange={handleSearchChange}
          localFilters={localFilters}
          handleFilterChange={handleFilterChange}
          categories={categories}
          priceRange={priceRange}
          handlePriceRangeChange={handlePriceRangeChange}
          handlePriceRangeCommitted={handlePriceRangeCommitted}
          clearAllFilters={clearAllFilters}
          formatPrice={formatPrice}
          selectedCurrency={selectedCurrency}
          currencyRange={currencyRange}
        />
      </Drawer>
    </Container>
  );
};

export default Services;
