import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

// Async thunks
export const fetchExchangeRates = createAsyncThunk(
  "currency/fetchExchangeRates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/currency/rates");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch exchange rates"
      );
    }
  }
);

export const convertCurrency = createAsyncThunk(
  "currency/convertCurrency",
  async ({ amount, from, to }, { rejectWithValue }) => {
    try {
      const response = await api.post("/currency/convert", {
        amount,
        from,
        to,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Currency conversion failed"
      );
    }
  }
);

const initialState = {
  selectedCurrency: localStorage.getItem("selectedCurrency") || "LKR",
  rates: {
    LKR: 1,
    USD: 0.003, // Fallback rate
  },
  lastUpdated: null,
  loading: false,
  error: null,
  conversionHistory: [],
};

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    setSelectedCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
      localStorage.setItem("selectedCurrency", action.payload);
    },
    clearCurrencyError: (state) => {
      state.error = null;
    },
    addToConversionHistory: (state, action) => {
      state.conversionHistory.unshift(action.payload);
      // Keep only last 10 conversions
      if (state.conversionHistory.length > 10) {
        state.conversionHistory = state.conversionHistory.slice(0, 10);
      }
    },
    clearConversionHistory: (state) => {
      state.conversionHistory = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Exchange Rates
      .addCase(fetchExchangeRates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExchangeRates.fulfilled, (state, action) => {
        state.loading = false;
        state.rates = action.payload.rates;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;
      })
      .addCase(fetchExchangeRates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Convert Currency
      .addCase(convertCurrency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(convertCurrency.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Add to conversion history
        state.conversionHistory.unshift({
          ...action.payload,
          timestamp: new Date().toISOString(),
        });
        // Keep only last 10 conversions
        if (state.conversionHistory.length > 10) {
          state.conversionHistory = state.conversionHistory.slice(0, 10);
        }
      })
      .addCase(convertCurrency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedCurrency,
  clearCurrencyError,
  addToConversionHistory,
  clearConversionHistory,
} = currencySlice.actions;

// Selectors
export const selectCurrency = (state) => state.currency;
export const selectSelectedCurrency = (state) =>
  state.currency.selectedCurrency;
export const selectExchangeRates = (state) => state.currency.rates;
export const selectCurrencyLoading = (state) => state.currency.loading;
export const selectCurrencyError = (state) => state.currency.error;
export const selectConversionHistory = (state) =>
  state.currency.conversionHistory;

// Helper function to convert price
export const convertPrice = (price, fromCurrency, toCurrency, rates) => {
  if (!price || fromCurrency === toCurrency) return price;

  // Ensure we have valid rates
  if (!rates || typeof rates !== "object") {
    console.warn("Invalid exchange rates provided");
    return price;
  }

  // Convert from any currency to LKR first (base currency)
  let priceInLKR = price;
  if (fromCurrency !== "LKR") {
    if (fromCurrency === "USD" && rates.USD) {
      priceInLKR = price / rates.USD;
    } else {
      console.warn(`Conversion from ${fromCurrency} not supported`);
      return price;
    }
  }

  // Convert from LKR to target currency
  if (toCurrency === "LKR") {
    return priceInLKR;
  } else if (toCurrency === "USD" && rates.USD) {
    return priceInLKR * rates.USD;
  } else {
    console.warn(`Conversion to ${toCurrency} not supported`);
    return price;
  }
};

// Helper function to get display price in selected currency
export const getDisplayPrice = (product, selectedCurrency, rates) => {
  if (!product || !product.price) return 0;

  // Product prices are stored in LKR by default
  return convertPrice(product.price, "LKR", selectedCurrency, rates);
};

// Helper function to format currency
export const formatCurrency = (amount, currency) => {
  const formatters = {
    LKR: new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
    USD: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };

  return formatters[currency]?.format(amount) || `${currency} ${amount}`;
};

export default currencySlice.reducer;
