export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
  },
  PRODUCTS: {
    LIST: "/api/products",
    DETAIL: (id) => `/api/products/${id}`,
    UPDATE: (id) => `/api/products/${id}`,
  },
  TRANSACTIONS: {
    LIST: "/api/transactions",
    CREATE: "/api/transactions",
    DETAIL: (id) => `/api/transactions/${id}`,
    DELETE: (id) => `/api/transactions/${id}`,
    REFUND: (id) => `/api/transactions/${id}/refund`,
  },
  CUSTOMERS: {
    LIST: "/api/customers",
  },
  CASH_ACCOUNTS: {
    LIST: "/api/cash-accounts",
  },
  SETTINGS: {
    GET: "/api/settings",
    UPDATE: "/api/settings",
  },
  PRICE_CHECKER: {
    CHECK: (code) => `/api/price-checker?code=${encodeURIComponent(code)}`,
  },
  RECEIVABLES: {
    PAY: (id) => `/api/receivables/${id}/pay`,
  },
};
