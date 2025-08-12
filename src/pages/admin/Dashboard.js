import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useTheme,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCurrency } from "../../hooks/useCurrency";
import api from "../../api/api";
import { logoutAdmin } from "../../store/slices/authSlice";

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const Dashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const { user } = useSelector((state) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    totalCategories: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Remove the old useEffect that depended on Redux data

  const loadDashboardData = async () => {
    setLoading(true);
    try {
       // Fetch dashboard stats from backend
        const response = await api.get('/admin/dashboard');
        
        if (response.data.success) {
           const data = response.data;
           setStats({
             totalRevenue: data.data.stats.totalRevenue,
             totalOrders: data.data.stats.totalOrders,
             pendingOrders: data.data.stats.pendingOrders,
             completedOrders: data.data.stats.completedOrders,
             totalProducts: data.data.stats.totalProducts,
             totalCategories: data.data.stats.totalCategories,
           });
           
           // Store recent orders for display
           setRecentOrders(data.data.recentOrders || []);
           setLowStockProducts(data.data.lowStockProducts || []);
         } else {
           throw new Error('Failed to fetch dashboard data');
         }
    } catch (error) {
      console.error('Dashboard data error:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  // Remove the old calculateStats function as we now get stats from backend

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "processing":
        return "primary";
      case "shipped":
        return "secondary";
      case "delivered":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getOrderStatusLabel = (status) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown";
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: <MoneyIcon />,
      color: "success",
      trend: "+12%",
      onClick: () => navigate("/admin/orders"),
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: <ShoppingCartIcon />,
      color: "primary",
      trend: "+8%",
      onClick: () => navigate("/admin/orders"),
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: <AssessmentIcon />,
      color: "warning",
      trend: "-3%",
      onClick: () => navigate("/admin/orders?status=pending"),
    },
    {
      title: "Products",
      value: stats.totalProducts,
      icon: <InventoryIcon />,
      color: "info",
      trend: "+5%",
      onClick: () => navigate("/admin/products"),
    },
  ];

  const [loading, setLoading] = useState(false);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome back, {user?.firstName || "Admin"}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with your store today.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ mr: 2 }}
          >
            {refreshing ? <CircularProgress size={20} /> : "Refresh"}
          </Button>
          {user?.role === 'super_admin' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<RefreshIcon />}
              onClick={async () => {
                if (window.confirm('Are you sure you want to reset admin users? This will delete all admins and create the default one.')) {
                  try {
                    await api.post('/admin/reset-admins');
                    toast.success('Admin users reset successfully');
                    dispatch(logoutAdmin());
                    navigate('/admin/login');
                  } catch (error) {
                    toast.error('Failed to reset admins');
                  }
                }
              }}
            >
              Reset Admins
            </Button>
          )}
        </Box>
      </MotionBox>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[8],
                },
              }}
              onClick={stat.onClick}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      mr: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: "bold" }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Chip
                    label={stat.trend}
                    size="small"
                    color={stat.trend.startsWith("+") ? "success" : "error"}
                    sx={{ fontSize: "0.75rem" }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    vs last month
                  </Typography>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} lg={8}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" component="h2">
                  Recent Orders
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/admin/orders")}
                >
                  View All
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recentOrders?.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order._id} hover>
                          <TableCell>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: "bold" }}
                            >
                              #{order.orderNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {order.customer?.firstName || "N/A"}{" "}
                                {order.customer?.lastName || ""}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {order.customer?.email || "No email"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getOrderStatusLabel(order.status)}
                              color={getOrderStatusColor(order.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {formatPrice(order.total, order.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() =>
                                navigate(`/admin/orders/${order._id}`)
                              }
                              color="primary"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No orders found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Quick Actions & Stats */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12}>
              <MotionCard
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => navigate("/admin/products/new")}
                      fullWidth
                    >
                      Add New Product
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PeopleIcon />}
                      onClick={() => navigate("/admin/orders")}
                      fullWidth
                    >
                      Manage Orders
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ShippingIcon />}
                      onClick={() => navigate("/admin/delivery")}
                      fullWidth
                    >
                      Delivery Management
                    </Button>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>

            {/* Order Status Overview */}
            <Grid item xs={12}>
              <MotionCard
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    Order Status Overview
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Pending</Typography>
                      <Typography variant="body2">
                        {stats.pendingOrders}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (stats.pendingOrders / Math.max(stats.totalOrders, 1)) *
                        100
                      }
                      color="warning"
                      sx={{ mb: 2 }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Completed</Typography>
                      <Typography variant="body2">
                        {stats.completedOrders}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        (stats.completedOrders /
                          Math.max(stats.totalOrders, 1)) *
                        100
                      }
                      color="success"
                      sx={{ mb: 2 }}
                    />

                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="subtitle2">Total Orders</Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold" }}
                      >
                        {stats.totalOrders}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
