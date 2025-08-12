import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

// Async thunks
export const loginAdmin = createAsyncThunk(
  "auth/loginAdmin",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/login", { email, password });
      const { token, user } = response.data.data;

      // Store token in localStorage
      localStorage.setItem("adminToken", token);

      // Set default authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const logoutAdmin = createAsyncThunk(
  "auth/logoutAdmin",
  async (_, { dispatch }) => {
    // Remove token from localStorage
    localStorage.removeItem("adminToken");

    // Remove authorization header
    delete api.defaults.headers.common["Authorization"];

    return null;
  }
);

export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        throw new Error("No token found");
      }

      // Set authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Verify token with server
      const response = await api.get("/admin/profile");

      return {
        token,
        user: response.data.data,
      };
    } catch (error) {
      // Remove invalid token
      localStorage.removeItem("adminToken");
      delete api.defaults.headers.common["Authorization"];

      return rejectWithValue(
        error.response?.data?.message || "Authentication failed"
      );
    }
  }
);

const initialState = {
  user: null,
  token:
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Admin
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })

      // Logout Admin
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })

      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.initialized = true;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.initialized = true;
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthInitialized = (state) => state.auth.initialized;

export default authSlice.reducer;
