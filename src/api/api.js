import axios from "axios";
import { toast } from "react-hot-toast";

// Create axios instance
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log('API baseURL set to:', api.defaults.baseURL);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log("[API DEBUG] Outgoing request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasAuth: !!config.headers.Authorization,
      contentType: config.headers['Content-Type']
    });
    
    // Add auth token if available
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[API DEBUG] Added auth token to request");
    } else {
      console.log("[API DEBUG] No auth token found in localStorage");
    }

    return config;
  },
  (error) => {
    console.error("[API DEBUG] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("[API DEBUG] Successful response:", {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    return response;
  },
  (error) => {
    console.log("\n=== API ERROR DEBUG ===");
    console.error("[API DEBUG] Response error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      responseData: error.response?.data,
      isNetworkError: !error.response,
      isTimeoutError: error.code === 'ECONNABORTED'
    });
    
    const { response } = error;

    if (response) {
      const { status, data } = response;
      console.log("[API DEBUG] Processing error response:", { status, data });

      switch (status) {
        case 400:
          toast.error(data.message || "Bad request");
          break;
        case 401:
          // Only redirect if not already on login page and not a login request
          const isLoginPage = window.location.pathname === "/admin/login";
          const isLoginRequest = error.config?.url?.includes('/login');
          
          console.log("[API DEBUG] 401 handling:", {
            isLoginPage,
            isLoginRequest,
            currentPath: window.location.pathname,
            requestUrl: error.config?.url
          });
          
          if (!isLoginPage && !isLoginRequest) {
            console.log("[API DEBUG] Redirecting to login due to 401");
            toast.error("Session expired. Please login again.");
            localStorage.removeItem("adminToken");
            window.location.href = "/admin/login";
          } else if (isLoginRequest) {
            console.log("[API DEBUG] Login request failed with 401");
            toast.error(data.message || "Invalid credentials");
          }
          break;
        case 403:
          toast.error("Access forbidden");
          break;
        case 404:
          toast.error(data.message || "Resource not found");
          break;
        case 422:
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach((err) => {
              toast.error(err.msg || err.message);
            });
          } else {
            toast.error(data.message || "Validation error");
          }
          break;
        case 429:
          toast.error("Too many requests. Please try again later.");
          break;
        case 500:
          toast.error("Internal server error");
          break;
        default:
          toast.error(data.message || "An error occurred");
      }
    } else if (error.request) {
      console.log("[API DEBUG] Network error - no response received");
      toast.error("Network error. Please check your connection.");
    } else {
      console.log("[API DEBUG] Request setup error");
      toast.error("An unexpected error occurred");
    }
    
    console.log("=== API ERROR DEBUG END ===\n");
    return Promise.reject(error);
  }
);

// Delivery Logs API functions
export const deliveryLogsAPI = {
  // Get delivery logs with pagination and filtering
  getDeliveryLogs: (params = {}) => {
    return api.get("/admin/delivery-logs", { params });
  },

  // Get delivery log statistics
  getDeliveryStats: (timeframe = "24h") => {
    return api.get("/admin/delivery-logs/stats", { params: { timeframe } });
  },

  // Mark a delivery log as resolved
  resolveDeliveryLog: (logId) => {
    return api.put(`/admin/delivery-logs/${logId}/resolve`);
  },
};

export default api;
