import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  globalLoading: false,
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchOpen: false,
  notifications: [],
  theme: 'light',
  currency: 'LKR'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    setSearchOpen: (state, action) => {
      state.searchOpen = action.payload;
    },
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        type: 'info',
        duration: 5000,
        ...action.payload
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setCurrency: (state, action) => {
      state.currency = action.payload;
    }
  }
});

export const {
  setLoading,
  setGlobalLoading,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  toggleSearch,
  setSearchOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  setCurrency
} = uiSlice.actions;

// Selectors
export const selectLoading = (state) => state.ui.loading;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectSearchOpen = (state) => state.ui.searchOpen;
export const selectNotifications = (state) => state.ui.notifications;
export const selectTheme = (state) => state.ui.theme;
export const selectUICurrency = (state) => state.ui.currency;

export default uiSlice.reducer;