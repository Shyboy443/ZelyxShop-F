import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import {
  setSelectedCurrency,
  fetchExchangeRates,
  convertPrice,
  formatCurrency,
  getDisplayPrice,
} from "../store/slices/currencySlice";

/**
 * Custom hook for currency management
 * Provides currency state and helper functions
 */
export const useCurrency = () => {
  const dispatch = useDispatch();
  const { selectedCurrency, rates, loading, error, lastUpdated } = useSelector(
    (state) => state.currency
  );

  // Fetch exchange rates on mount and when currency changes
  useEffect(() => {
    const shouldFetchRates = () => {
      if (!lastUpdated) return true;

      // Fetch rates if they're older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return new Date(lastUpdated) < oneHourAgo;
    };

    if (shouldFetchRates()) {
      dispatch(fetchExchangeRates());
    }
  }, [dispatch, lastUpdated]);

  // Helper function to change currency
  const changeCurrency = (newCurrency) => {
    if (newCurrency !== selectedCurrency) {
      dispatch(setSelectedCurrency(newCurrency));
    }
  };

  // Helper function to convert and format price
  const formatPrice = (price, fromCurrency = "LKR") => {
    const convertedPrice = convertPrice(
      price,
      fromCurrency,
      selectedCurrency,
      rates
    );
    return formatCurrency(convertedPrice, selectedCurrency);
  };

  // Helper function to get product display price
  const getProductPrice = (product) => {
    return getDisplayPrice(product, selectedCurrency, rates);
  };

  // Helper function to get formatted product price
  const getFormattedProductPrice = (product) => {
    const price = getProductPrice(product);
    return formatCurrency(price, selectedCurrency);
  };

  return {
    // State
    selectedCurrency,
    rates,
    loading,
    error,
    lastUpdated,

    // Actions
    changeCurrency,

    // Helper functions
    convertPrice: (price, from, to) =>
      convertPrice(price, from, to || selectedCurrency, rates),
    formatPrice,
    formatCurrency: (amount) => formatCurrency(amount, selectedCurrency),
    getProductPrice,
    getFormattedProductPrice,

    // Raw helper functions (for advanced usage)
    rawConvertPrice: convertPrice,
    rawFormatCurrency: formatCurrency,
  };
};

export default useCurrency;
