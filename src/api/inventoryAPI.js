import api from "./api";

const inventoryAPI = {
  // Inventory management
  getInventory: (params = {}) => api.get("/admin/inventory", { params }),
  addInventory: (data) => api.post("/admin/inventory", data),
  updateInventory: (id, data) => api.put(`/admin/inventory/${id}`, data),
  deleteInventory: (id) => api.delete(`/admin/inventory/${id}`),

  // Inventory expiration management
  getExpiredInventory: (params = {}) => api.get("/admin/inventory/expired", { params }),
  bulkUpdateExpiration: (data) => api.put("/admin/inventory/bulk-expiration", data),
  setInventoryExpiration: (id, data) => api.put(`/admin/inventory/${id}/set-expiration`, data),

  // Auto-delivery settings
  getAutoDeliverySettings: () => api.get("/admin/auto-delivery"),
  updateAutoDeliverySettings: (id, data) =>
    api.put(`/admin/auto-delivery/${id}`, data),

  // Delivery management
  getDeliveryStats: () => api.get("/admin/delivery-stats"),
  processDeliveries: () => api.post("/admin/process-deliveries"),
  triggerOrderDelivery: (orderId) =>
    api.post(`/admin/orders/${orderId}/trigger-delivery`),
  getOrderDeliveryStatus: (orderId) =>
    api.get(`/admin/orders/${orderId}/delivery-status`),
  getPendingDeliveries: () => api.get("/admin/pending-deliveries"),

  // Order delivery with inventory
  getAvailableInventoryForOrder: (orderId) =>
    api.get(`/admin/orders/${orderId}/available-inventory`),
};

export default inventoryAPI;
