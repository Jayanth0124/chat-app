const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Placeholder API configuration
  get: async (endpoint) => {
    console.log(`GET ${API_URL}${endpoint}`);
    return { data: 'placeholder' };
  },
  post: async (endpoint, data) => {
    console.log(`POST ${API_URL}${endpoint}`, data);
    return { data: 'placeholder' };
  }
};
