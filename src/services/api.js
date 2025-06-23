const API_BASE_URL = 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('tessera_token');
};

// Set auth token in localStorage
const setAuthToken = (token) => {
  localStorage.setItem('tessera_token', token);
};

// Remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem('tessera_token');
};

// API request helper with auth
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  login: async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  logout: () => {
    removeAuthToken();
  },

  getProfile: () => apiRequest('/auth/profile'),

  updateProfile: (profileData) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
};

// Skills API
export const skillsAPI = {
  getSkills: () => apiRequest('/skills'),

  uploadFile: (formData) => apiRequest('/skills/upload', {
    method: 'POST',
    body: formData,
  }),

  saveSkills: (skillsData) => apiRequest('/skills', {
    method: 'POST',
    body: JSON.stringify(skillsData),
  }),

  getComparisonData: () => apiRequest('/skills/compare'),
};

// Users API
export const usersAPI = {
  getCareerRecommendations: () => apiRequest('/users/career-recommendations'),
  
  getStats: () => apiRequest('/users/stats'),
};

// Health check
export const healthCheck = () => apiRequest('/health');

export { getAuthToken, setAuthToken, removeAuthToken };