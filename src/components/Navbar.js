import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  FormControl,
  InputLabel,
  ListItemIcon,
  Badge,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ShoppingBag as ShoppingBagIcon,
  Category as CategoryIcon,
  CurrencyExchange as CurrencyIcon,
  Search as SearchIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchCategories } from "../store/slices/categorySlice";
import {
  setSelectedCurrency,
  fetchExchangeRates,
} from "../store/slices/currencySlice";
import { selectTheme, setTheme } from "../store/slices/uiSlice";

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { categories } = useSelector((state) => state.categories);
  const { selectedCurrency } = useSelector((state) => state.currency);
  const themeMode = useSelector(selectTheme);
  // Removed cart functionality - single purchase system

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesAnchor, setCategoriesAnchor] = useState(null);
  const [currencyAnchor, setCurrencyAnchor] = useState(null);
  const [themeAnchor, setThemeAnchor] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchExchangeRates());
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      dispatch(setTheme(storedTheme));
    }
  }, [dispatch]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCategoriesClick = (event) => {
    setCategoriesAnchor(event.currentTarget);
  };

  const handleCategoriesClose = () => {
    setCategoriesAnchor(null);
  };

  const handleCurrencyClick = (event) => {
    setCurrencyAnchor(event.currentTarget);
  };

  const handleCurrencyClose = () => {
    setCurrencyAnchor(null);
  };

  const handleThemeClick = (event) => {
    setThemeAnchor(event.currentTarget);
  };

  const handleThemeClose = () => setThemeAnchor(null);

  const handleThemeChange = (mode) => {
    dispatch(setTheme(mode));
    localStorage.setItem("theme", mode);
    handleThemeClose();
  };

  const handleCurrencyChange = (currency) => {
    dispatch(setSelectedCurrency(currency));
    handleCurrencyClose();
  };

  const handleCategoryClick = (categorySlug) => {
    navigate(`/category/${categorySlug}`);
    handleCategoriesClose();
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="div">
          Menu
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        <ListItem
          button
          component={Link}
          to="/"
          onClick={() => setMobileOpen(false)}
        >
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem
          button
          component={Link}
          to="/services"
          onClick={() => setMobileOpen(false)}
        >
          <ListItemText primary="All Services" />
        </ListItem>
        <ListItem
          button
          component={Link}
          to="/track-order"
          onClick={() => setMobileOpen(false)}
        >
          <ListItemText primary="Track Order" />
        </ListItem>
        {/* Cart removed - single purchase system */}
        <Divider />
        <ListItem>
          <ListItemText primary="Categories" secondary="Browse by category" />
        </ListItem>
        {categories.map((category) => (
          <ListItem
            key={category._id}
            button
            onClick={() => handleCategoryClick(category.slug)}
            sx={{ pl: 4 }}
          >
            <ListItemText primary={category.name} />
          </ListItem>
        ))}
        <Divider />
        <ListItem>
          <FormControl fullWidth size="small">
            <InputLabel>Currency</InputLabel>
            <Select
              value={selectedCurrency}
              label="Currency"
              onChange={(e) => handleCurrencyChange(e.target.value)}
            >
              <MenuItem value="LKR">LKR (Sri Lankan Rupee)</MenuItem>
              <MenuItem value="USD">USD (US Dollar)</MenuItem>
            </Select>
          </FormControl>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{ bgcolor: "background.paper", color: "text.primary", boxShadow: 1 }}
      >
        <Container maxWidth="lg">
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{
                flexGrow: isMobile ? 1 : 0,
                textDecoration: "none",
                color: "inherit",
                fontWeight: "bold",
                mr: 4,
              }}
            >
              Zelyx
            </Typography>

            {!isMobile && (
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Button
                  color="inherit"
                  component={Link}
                  to="/"
                  sx={{ textTransform: "none" }}
                >
                  Home
                </Button>

                <Button
                  color="inherit"
                  component={Link}
                  to="/services"
                  sx={{ textTransform: "none" }}
                >
                  Services
                </Button>

                <Button
                  color="inherit"
                  component={Link}
                  to="/track-order"
                  startIcon={<SearchIcon />}
                  sx={{ textTransform: "none" }}
                >
                  Track Order
                </Button>

                <Button
                  color="inherit"
                  onClick={handleCategoriesClick}
                  endIcon={<CategoryIcon />}
                  sx={{ textTransform: "none" }}
                >
                  Categories
                </Button>

                <Menu
                  anchorEl={categoriesAnchor}
                  open={Boolean(categoriesAnchor)}
                  onClose={handleCategoriesClose}
                  PaperProps={{
                    sx: { mt: 1, minWidth: 200 },
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem
                      key={category._id}
                      onClick={() => handleCategoryClick(category.slug)}
                    >
                      {category.name}
                    </MenuItem>
                  ))}
                </Menu>
                <Button
                  color="inherit"
                  onClick={handleThemeClick}
                  endIcon={<ArrowDownIcon />}
                  sx={{
                    textTransform: "none",
                    minWidth: "auto",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 1,
                    px: 2,
                    py: 0.5,
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  {themeMode === "dark" ? "Dark" : "Light"} Mode
                </Button>
                <Menu
                  anchorEl={themeAnchor}
                  open={Boolean(themeAnchor)}
                  onClose={handleThemeClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => handleThemeChange("light")}
                    selected={themeMode === "light"}
                  >
                    <ListItemText primary="Light" />
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleThemeChange("dark")}
                    selected={themeMode === "dark"}
                  >
                    <ListItemText primary="Dark" />
                  </MenuItem>
                </Menu>
              </Box>
            )}

            {!isMobile && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {/* Cart removed - single purchase system */}
                <Button
                  color="inherit"
                  onClick={handleCurrencyClick}
                  endIcon={<ArrowDownIcon />}
                  startIcon={<CurrencyIcon />}
                  sx={{
                    textTransform: "none",
                    minWidth: "auto",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 1,
                    px: 2,
                    py: 0.5,
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  {selectedCurrency}
                </Button>

                <Menu
                  anchorEl={currencyAnchor}
                  open={Boolean(currencyAnchor)}
                  onClose={handleCurrencyClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => handleCurrencyChange("LKR")}
                    selected={selectedCurrency === "LKR"}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      },
                    }}
                  >
                    <ListItemIcon>🇱🇰</ListItemIcon>
                    <ListItemText primary="LKR" secondary="Sri Lankan Rupee" />
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleCurrencyChange("USD")}
                    selected={selectedCurrency === "USD"}
                    sx={{
                      "&.Mui-selected": {
                        backgroundColor: "primary.light",
                        color: "primary.contrastText",
                      },
                    }}
                  >
                    <ListItemIcon>🇺🇸</ListItemIcon>
                    <ListItemText primary="USD" secondary="US Dollar" />
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
