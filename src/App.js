import React from "react";
import AuthInitializer from "./components/AuthInitializer";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider, useSelector, useDispatch } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { Toaster } from "react-hot-toast";
import { store } from "./store/store";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import GlobalLoading from "./components/GlobalLoading";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { selectTheme, setTheme } from "./store/slices/uiSlice";

// Client Pages
import Home from "./pages/Home";
import Services from "./pages/Services";
import ProductDetail from "./pages/ProductDetail";
import Category from "./pages/Category";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import OrderStatus from "./pages/OrderStatus";
import BankTransfer from "./pages/BankTransfer";
import EmailVerification from "./pages/EmailVerification";
import OTPRetrieval from "./pages/OTPRetrieval";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import ServiceAdmin from "./pages/admin/ServiceAdmin";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import OrderDetail from "./pages/admin/OrderDetail";
import ProductsStore from "./pages/admin/ProductsStore";
import Settings from "./pages/admin/Settings";
import AccessTokens from "./pages/admin/AccessTokens";
import OutlookAccounts from "./pages/admin/OutlookAccounts";

import DeliveryManagement from "./pages/admin/DeliveryManagement";
import DeliveryLogs from "./pages/admin/DeliveryLogs";
import InventoryExpiration from "./pages/admin/InventoryExpiration";
import ReceiptVerification from "./components/admin/ReceiptVerification";

// Layouts
import AdminLayout from "./layouts/AdminLayout";

// Create theme using Redux UI mode
const ThemedApp = ({ children }) => {
  const mode = useSelector(selectTheme);
  const dispatch = useDispatch();

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") {
        dispatch(setTheme(saved));
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, [dispatch]);

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: "#1976d2",
        light: "#42a5f5",
        dark: "#1565c0",
      },
      secondary: {
        main: "#dc004e",
        light: "#ff5983",
        dark: "#9a0036",
      },
      background:
        mode === "dark"
          ? {
              default: "#121212",
              paper: "#1e1e1e",
            }
          : {
              default: "#f5f5f5",
              paper: "#ffffff",
            },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 500,
      },
      h5: {
        fontWeight: 500,
      },
      h6: {
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow:
              mode === "dark"
                ? "0 2px 8px rgba(0,0,0,0.6)"
                : "0 2px 8px rgba(0,0,0,0.1)",
            "&:hover": {
              boxShadow:
                mode === "dark"
                  ? "0 4px 16px rgba(0,0,0,0.7)"
                  : "0 4px 16px rgba(0,0,0,0.15)",
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

// Layout component for client pages
const ClientLayout = ({ children }) => (
  <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <Navbar />
    <Box component="main" sx={{ flexGrow: 1 }}>
      {children}
    </Box>
    <Footer />
  </Box>
);

function App() {
  return (
    <Provider store={store}>
      <ThemedApp>
        <Router>
          <AuthInitializer>
            <GlobalLoading />
            <Routes>
              {/* Client Routes */}
              <Route
                path="/"
                element={
                  <ClientLayout>
                    <Home />
                  </ClientLayout>
                }
              />

              <Route
                path="/services"
                element={
                  <ClientLayout>
                    <Services />
                  </ClientLayout>
                }
              />

              <Route
                path="/services/:id"
                element={
                  <ClientLayout>
                    <ProductDetail />
                  </ClientLayout>
                }
              />

              <Route
                path="/category/:slug"
                element={
                  <ClientLayout>
                    <Category />
                  </ClientLayout>
                }
              />

              <Route
                path="/checkout"
                element={
                  <ClientLayout>
                    <Checkout />
                  </ClientLayout>
                }
              />

              <Route
                path="/order/:orderNumber"
                element={
                  <ClientLayout>
                    <OrderConfirmation />
                  </ClientLayout>
                }
              />

              <Route
                path="/track-order"
                element={
                  <ClientLayout>
                    <OrderTracking />
                  </ClientLayout>
                }
              />

              <Route
                path="/order-status/:orderNumber"
                element={
                  <ClientLayout>
                    <OrderStatus />
                  </ClientLayout>
                }
              />

              <Route
                path="/bank-transfer/:orderNumber"
                element={
                  <ClientLayout>
                    <BankTransfer />
                  </ClientLayout>
                }
              />

              <Route
                path="/email-verification"
                element={
                  <ClientLayout>
                    <EmailVerification />
                  </ClientLayout>
                }
              />

              <Route
                path="/email-verification/:token"
                element={
                  <ClientLayout>
                    <EmailVerification />
                  </ClientLayout>
                }
              />

              <Route
                path="/otp"
                element={
                  <ClientLayout>
                    <OTPRetrieval />
                  </ClientLayout>
                }
              />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<ServiceAdmin />} />
                <Route path="services" element={<ServiceAdmin />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route
                  path="products/:id/edit"
                  element={<AdminProductForm />}
                />
                <Route path="services/new" element={<AdminProductForm />} />
                <Route
                  path="services/:id/edit"
                  element={<AdminProductForm />}
                />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="delivery" element={<DeliveryManagement />} />
                <Route path="delivery-logs" element={<DeliveryLogs />} />
                <Route path="products-store" element={<ProductsStore />} />
                <Route
                  path="inventory-expiration"
                  element={<InventoryExpiration />}
                />
                <Route path="receipts" element={<ReceiptVerification />} />
                <Route path="access-tokens" element={<AccessTokens />} />
                <Route path="outlook-accounts" element={<OutlookAccounts />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* 404 Route */}
              <Route
                path="*"
                element={
                  <ClientLayout>
                    <NotFound />
                  </ClientLayout>
                }
              />
            </Routes>
            <ScrollToTopButton />
          </AuthInitializer>
        </Router>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: undefined,
              color: undefined,
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4caf50",
                secondary: "#ffffff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#f44336",
                secondary: "#ffffff",
              },
            },
          }}
        />

        {/* WhatsApp Button */}
        <WhatsAppButton />
      </ThemedApp>
    </Provider>
  );
}

export default App;
