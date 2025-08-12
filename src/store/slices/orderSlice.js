import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

// Helper functions for localStorage
const saveCartToLocalStorage = (cartData) => {
  try {
    localStorage.setItem("zelyx_cart", JSON.stringify(cartData));
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
};

const loadCartFromLocalStorage = () => {
  try {
    const savedCart = localStorage.getItem("zelyx_cart");
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error("Failed to load cart from localStorage:", error);
  }
  return {
    customer: {
      email: "",
      phone: "",
    },
    items: [],
    currency: "LKR",
    exchangeRate: 1,
    notes: "",
    paymentMethod: "credit_card",
  };
};

// Async thunks
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post("/orders", orderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }
);

export const fetchOrderByNumber = createAsyncThunk(
  "orders/fetchOrderByNumber",
  async (orderNumber, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${orderNumber}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Order not found"
      );
    }
  }
);

export const calculateOrderTotal = createAsyncThunk(
  "orders/calculateOrderTotal",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post("/orders/calculate", orderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to calculate order total"
      );
    }
  }
);

// Admin thunks
export const fetchAdminOrders = createAsyncThunk(
  "orders/fetchAdminOrders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/orders", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async (
    { id, status, paymentStatus, inventoryAssignments },
    { rejectWithValue }
  ) => {
    try {
      const requestData = {
        status,
        paymentStatus,
      };

      if (inventoryAssignments) {
        requestData.inventoryAssignments = inventoryAssignments;
      }

      const response = await api.put(`/admin/orders/${id}/status`, requestData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  }
);

const initialState = {
  orders: [],
  adminOrders: {
    orders: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0,
    },
  },
  currentOrder: null,
  orderCalculation: null,
  checkoutData: loadCartFromLocalStorage(),
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  loading: false,
  calculationLoading: false,
  orderLoading: false,
  error: null,
  calculationError: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.calculationError = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    setCheckoutData: (state, action) => {
      state.checkoutData = { ...state.checkoutData, ...action.payload };
      saveCartToLocalStorage(state.checkoutData);
    },
    updateCustomerInfo: (state, action) => {
      state.checkoutData.customer = {
        ...state.checkoutData.customer,
        ...action.payload,
      };
      saveCartToLocalStorage(state.checkoutData);
    },
    setCheckoutItems: (state, action) => {
      state.checkoutData.items = action.payload;
      saveCartToLocalStorage(state.checkoutData);
    },
    addCheckoutItem: (state, action) => {
      const existingItem = state.checkoutData.items.find(
        (item) => item.product === action.payload.product
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.checkoutData.items.push(action.payload);
      }
      saveCartToLocalStorage(state.checkoutData);
    },
    removeCheckoutItem: (state, action) => {
      state.checkoutData.items = state.checkoutData.items.filter(
        (item) => item.product !== action.payload
      );
      saveCartToLocalStorage(state.checkoutData);
    },
    updateCheckoutItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.checkoutData.items.find(
        (item) => item.product === productId
      );

      if (item) {
        if (quantity <= 0) {
          state.checkoutData.items = state.checkoutData.items.filter(
            (item) => item.product !== productId
          );
        } else {
          item.quantity = quantity;
        }
      }
      saveCartToLocalStorage(state.checkoutData);
    },
    clearCheckoutData: (state) => {
      state.checkoutData = {
        customer: {
          email: "",
          phone: "",
        },
        items: [],
        currency: "LKR",
        exchangeRate: 1,
        notes: "",
        paymentMethod: "credit_card",
      };
      saveCartToLocalStorage(state.checkoutData);
    },
    setCheckoutCurrency: (state, action) => {
      state.checkoutData.currency = action.payload.currency;
      state.checkoutData.exchangeRate = action.payload.exchangeRate;
      saveCartToLocalStorage(state.checkoutData);
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.error = null;
        // Clear checkout data after successful order
        state.checkoutData = {
          customer: {
            name: "",
            email: "",
            phone: "",
            address: {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "Sri Lanka",
            },
          },
          items: [],
          currency: "LKR",
          exchangeRate: 1,
          notes: "",
        };
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Order By Number
      .addCase(fetchOrderByNumber.pending, (state) => {
        state.orderLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderByNumber.fulfilled, (state, action) => {
        state.orderLoading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderByNumber.rejected, (state, action) => {
        state.orderLoading = false;
        state.error = action.payload;
        state.currentOrder = null;
      })

      // Calculate Order Total
      .addCase(calculateOrderTotal.pending, (state) => {
        state.calculationLoading = true;
        state.calculationError = null;
      })
      .addCase(calculateOrderTotal.fulfilled, (state, action) => {
        state.calculationLoading = false;
        state.orderCalculation = action.payload;
        state.calculationError = null;
      })
      .addCase(calculateOrderTotal.rejected, (state, action) => {
        state.calculationLoading = false;
        state.calculationError = action.payload;
      })

      // Admin: Fetch Orders
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.adminOrders = {
          orders: action.payload.data || [],
          pagination: action.payload.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
          },
        };
        state.error = null;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin: Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update in regular orders array
        const index = state.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        // Update in admin orders array
        const adminIndex = state.adminOrders.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (adminIndex !== -1) {
          state.adminOrders.orders[adminIndex] = action.payload;
        }
        if (
          state.currentOrder &&
          state.currentOrder._id === action.payload._id
        ) {
          state.currentOrder = action.payload;
        }
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearCurrentOrder,
  setCheckoutData,
  updateCustomerInfo,
  updateCustomerAddress,
  setCheckoutItems,
  addCheckoutItem,
  removeCheckoutItem,
  updateCheckoutItemQuantity,
  clearCheckoutData,
  setCheckoutCurrency,
} = orderSlice.actions;

// Admin aliases
export const updateAdminOrderStatus = updateOrderStatus;

// Selectors
export const selectOrders = (state) => state.orders.orders;
export const selectCurrentOrder = (state) => state.orders.currentOrder;
export const selectOrderCalculation = (state) => state.orders.orderCalculation;
export const selectCheckoutData = (state) => state.orders.checkoutData;
export const selectOrdersPagination = (state) => state.orders.pagination;
export const selectOrdersLoading = (state) => state.orders.loading;
export const selectCalculationLoading = (state) =>
  state.orders.calculationLoading;
export const selectOrderLoading = (state) => state.orders.orderLoading;
export const selectOrdersError = (state) => state.orders.error;
export const selectCalculationError = (state) => state.orders.calculationError;

export default orderSlice.reducer;
