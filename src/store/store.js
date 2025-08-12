import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import productSlice from "./slices/productSlice";
import categorySlice from "./slices/categorySlice";
import orderSlice from "./slices/orderSlice";
import currencySlice from "./slices/currencySlice";
import uiSlice from "./slices/uiSlice";
import settingsSlice from "./slices/settingsSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    products: productSlice,
    categories: categorySlice,
    orders: orderSlice,
    currency: currencySlice,
    ui: uiSlice,
    settings: settingsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// TypeScript types removed - use PropTypes or convert to .ts file if needed
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
