import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Collapse,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  Category as CategoryIcon,
  LocalShipping as DeliveryIcon,
  Storage as InventoryIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  ExpandLess,
  ExpandMore,
  AutoMode as AutoDeliveryIcon,
  Assignment as ManualDeliveryIcon,
  Assessment as LogsIcon,
  Shield,
  Schedule as ExpirationIcon,
  Email as EmailIcon,
  VpnKey as AccessTokenIcon,
  AccountBox as OutlookIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutAdmin } from "../store/slices/authSlice";
import { motion } from "framer-motion";

const drawerWidth = 280;

const AdminLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [deliveryMenuOpen, setDeliveryMenuOpen] = useState(false);

  const { user } = useSelector((state) => state.auth);

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/admin/dashboard",
      color: "#1976d2",
    },
    {
      text: "Orders",
      icon: <OrdersIcon />,
      path: "/admin/orders",
      color: "#2e7d32",
    },
    {
      text: "Products",
      icon: <ProductsIcon />,
      path: "/admin/products",
      color: "#ed6c02",
    },
    {
      text: "Categories",
      icon: <CategoryIcon />,
      path: "/admin/categories",
      color: "#9c27b0",
    },
    {
      text: "Inventory Store",
      icon: <InventoryIcon />,
      path: "/admin/products-store",
      color: "#d32f2f",
    },
    {
      text: "Inventory Expiration",
      icon: <ExpirationIcon />,
      path: "/admin/inventory-expiration",
      color: "#ff5722",
    },
    {
      text: "Delivery Management",
      icon: <DeliveryIcon />,
      path: "/admin/delivery",
      color: "#0288d1",
      submenu: [
        {
          text: "Auto Delivery",
          icon: <AutoDeliveryIcon />,
          path: "/admin/delivery",
          color: "#0288d1",
        },
        {
          text: "Manual Delivery",
          icon: <ManualDeliveryIcon />,
          path: "/admin/manual-delivery",
          color: "#0288d1",
        },
        {
          text: "Delivery Logs",
          icon: <LogsIcon />,
          path: "/admin/delivery-logs",
          color: "#0288d1",
        },
      ],
    },
    {
      text: "Receipt Verification",
      icon: <Shield />,
      path: "/admin/receipts",
      color: "#673ab7",
    },
    {
      text: "Access Tokens",
      icon: <AccessTokenIcon />,
      path: "/admin/access-tokens",
      color: "#795548",
    },
    {
      text: "Outlook Accounts",
      icon: <OutlookIcon />,
      path: "/admin/outlook-accounts",
      color: "#ff9800",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/admin/settings",
      color: "#616161",
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate("/admin/login");
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isActive = (path) => {
    if (path === "/admin/dashboard") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
          >
            Zelyx
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin Panel
          </Typography>
        </motion.div>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, px: 2, py: 1 }}>
        {menuItems.map((item, index) => (
          <motion.div
            key={item.text}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {item.submenu ? (
              <>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => setDeliveryMenuOpen(!deliveryMenuOpen)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      backgroundColor: isActive(item.path)
                        ? `${item.color}15`
                        : "transparent",
                      "&:hover": {
                        backgroundColor: `${item.color}10`,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: item.color, minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        "& .MuiListItemText-primary": {
                          fontWeight: isActive(item.path) ? 600 : 400,
                          color: isActive(item.path)
                            ? item.color
                            : "text.primary",
                        },
                      }}
                    />
                    {deliveryMenuOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={deliveryMenuOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem) => (
                      <ListItem
                        key={subItem.text}
                        disablePadding
                        sx={{ pl: 2 }}
                      >
                        <ListItemButton
                          onClick={() => handleNavigation(subItem.path)}
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            backgroundColor: isActive(subItem.path)
                              ? `${subItem.color}15`
                              : "transparent",
                            "&:hover": {
                              backgroundColor: `${subItem.color}10`,
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{ color: subItem.color, minWidth: 40 }}
                          >
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.text}
                            sx={{
                              "& .MuiListItemText-primary": {
                                fontWeight: isActive(subItem.path) ? 600 : 400,
                                color: isActive(subItem.path)
                                  ? subItem.color
                                  : "text.primary",
                                fontSize: "0.9rem",
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isActive(item.path)
                      ? `${item.color}15`
                      : "transparent",
                    "&:hover": {
                      backgroundColor: `${item.color}10`,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: item.color, minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      "& .MuiListItemText-primary": {
                        fontWeight: isActive(item.path) ? 600 : 400,
                        color: isActive(item.path)
                          ? item.color
                          : "text.primary",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </motion.div>
        ))}
      </List>

      {/* User Profile Section */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {user?.firstName?.charAt(0) || "A"}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Administrator
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            {menuItems.find((item) => isActive(item.path))?.text ||
              "Admin Panel"}
          </Typography>

          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={() => navigate("/admin/profile")}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }} />
          Profile Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              bgcolor: "background.paper",
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              bgcolor: "background.paper",
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
