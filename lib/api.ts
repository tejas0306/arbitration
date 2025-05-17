import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Set the API URL with proper fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios client with the proper baseURL including the NestJS global prefix 'api'
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,  // Add '/api' prefix to match NestJS global prefix
  headers: {
    'Content-Type': 'application/json',
  },
  // Add reasonable timeouts
  timeout: 15000, // 15 seconds
  // Allow cross-site cookies
  withCredentials: true,
});

// Keep track of logout function for global usage
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// For debugging purposes, log all requests
apiClient.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  const url = request.baseURL && request.url ? `${request.baseURL}${request.url}` : request.url;
  console.log('Request URL:', url);
  return request;
}, (error) => {
  console.error('Request setup error:', error);
  return Promise.reject(error);
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('Request config error:', error);
  return Promise.reject(error);
});

// Track failed requests for retry
const failedRequestsQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; config: InternalAxiosRequestConfig }[] = [];

// Add response interceptor to handle auth errors and retry failed requests
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle request timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out. Server might be slow or unavailable.');
      return Promise.reject(new Error('Request timed out. Please try again later.'));
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error. Server might be down or network is disconnected.');
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('Authentication error - clearing tokens and redirecting to login');
      // Clear tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Call the logout callback if it exists
      if (logoutCallback) {
        logoutCallback();
      } else {
        // If no callback is set, redirect manually
        window.location.href = '/auth/login';
      }
    }
    
    // Add better error logging
    const errorData = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    };
    console.error('API error details:', errorData);
    
    return Promise.reject(error);
  }
);

export interface ArbitrationFormData {
  type: string;
  name: string;
  pincode: string;
  address1: string;
  address2?: string;
  city: string;
  district: string;
  state: string;
  country: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  gst?: string;
  pan?: string;
  cin?: string;
  coi?: File;
  panCard?: File;
  gstCert?: File;
  additionalClaimants: Array<{
    name: string;
    email: string;
    phoneCountryCode: string;
    phone: string;
    address?: string;
  }>;
  respondents: Array<{
    type: string;
    name: string;
    address?: string;
    email: string;
    phoneCountryCode?: string;
    phone?: string;
    gst?: string;
    pan?: string;
    cin?: string;
  }>;
  arbitrationAgreement: {
    agreementDate: string;
    agreementType: string;
    agreementFile: File;
    signedAt: {
      taluka?: string;
      city: string;
      district: string;
      state: string;
    };
    seatOfArbitration: string;
    agreementBetween: {
      partyA: string;
      partyB: string;
    };
  };
  disputeDetails: {
    disputeType: string;
    disputeAmount: string;
    disputeDescription: string;
    disputeDate: string;
  };
  documents?: {
    supportingDocuments: File[];
    evidenceFiles: File[];
  };
}

export const arbitrationApi = {
  create: async (formData: FormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }

      console.log('Sending request to:', `${API_URL}/arbitration/submit`);
      
      // Log formData entries in a more user-friendly way
      const formDataLog: Record<string, any> = {};
      formData.forEach((value, key) => {
        // Don't log file contents, just file names for files
        if (value instanceof File) {
          formDataLog[key] = `File: ${value.name} (${value.type}, ${value.size} bytes)`;
        } else if (typeof value === 'string' && value.startsWith('{')) {
          // Try to parse JSON strings for better logging
          try {
            formDataLog[key] = JSON.parse(value);
          } catch (e) {
            formDataLog[key] = value;
          }
        } else {
          formDataLog[key] = value;
        }
      });
      
      console.log('FormData contents:', formDataLog);
      
      const response = await apiClient.post('/arbitration/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        // Increase timeout for large file uploads
        timeout: 60000, // 60 seconds
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
      
      // Add more specific error messaging
      if (error.response?.status === 500) {
        console.error('Server error. This might be due to issues with file uploads or data format.');
      } else if (error.response?.status === 413) {
        console.error('File upload too large. Try reducing file sizes or uploading fewer files.');
      } else if (error.response?.status === 400) {
        console.error('Invalid data format. Check that all required fields are completed correctly.');
      }
      
      throw error;
    }
  },

  saveDraft: async (formData: FormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Token available:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      // Extract basic info from formData for debugging
      const formDataEntries: Record<string, any> = {};
      formData.forEach((value, key) => {
        if (key === 'data') {
          try {
            const parsedData = JSON.parse(value as string);
            formDataEntries['data'] = {
              id: parsedData.id,
              type: parsedData.type,
              name: parsedData.name
            };
          } catch (e) {
            formDataEntries[key] = 'Error parsing JSON';
          }
        } else if (value instanceof File) {
          formDataEntries[key] = `File: ${value.name} (${value.size} bytes)`;
        } else {
          formDataEntries[key] = value;
        }
      });
      
      console.log('Draft FormData being submitted:', formDataEntries);
      
      // Fix: Use the direct endpoint path that matches NestJS controller
      const response = await apiClient.post('/arbitration/draft', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        // Increase timeout for large file uploads
        timeout: 60000, // 60 seconds
      });
      
      console.log('Draft saved successfully, response:', response.data);
      
      // Ensure we return a consistent object structure
      const savedDraft = response.data;
      
      // Add fallback properties to match what dashboard expects
      if (!savedDraft.name && savedDraft.claimantDetails?.name) {
        savedDraft.name = savedDraft.claimantDetails.name;
      }
      
      if (!savedDraft.type && savedDraft.disputeCategory) {
        savedDraft.type = savedDraft.disputeCategory;
      }
      
      if (!savedDraft.updatedAt && savedDraft.lastEditedAt) {
        savedDraft.updatedAt = savedDraft.lastEditedAt;
      }
      
      return savedDraft;
    } catch (error: any) {
      console.error('Error saving draft:', error);
      
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          data: error.response.data,
          statusText: error.response.statusText
        });
        
        if (error.response.status === 404) {
          console.error('API endpoint not found. Check your API route configuration.');
        } else if (error.response.status === 401) {
          console.error('Authentication failed. Please login again.');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('token_expiry');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please log in again.');
        } else if (error.response.status === 400) {
          console.error('Bad request. Check your form data.');
        }
      }
      
      throw error;
    }
  },

  // Enhanced methods for draft management
  getDrafts: async () => {
    try {
      console.log('Fetching drafts...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found, returning empty drafts array');
        return [];
      }

      try {
        // First try the standard API path for drafts
        const response = await apiClient.get('/arbitration/draft', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Log success and return data
        console.log(`Successfully retrieved ${Array.isArray(response.data) ? response.data.length : 0} drafts`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (firstError: any) {
        console.warn(`Primary draft endpoint failed: ${firstError.message}`);
        
        // If the first attempt fails, try a fallback endpoint
        if (firstError.response?.status === 404) {
          try {
            // Try an alternative endpoint format
            console.log('Trying fallback draft endpoint...');
            const fallbackResponse = await apiClient.get('/arbitration-drafts', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            console.log('Fallback endpoint successful');
            return Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
          } catch (fallbackError: any) {
            console.warn(`Fallback endpoint also failed: ${fallbackError.message}`);
            // Both endpoints failed - return empty array
            return [];
          }
        }
        
        // For other error types, return empty array
        console.warn('Returning empty array due to API error');
        return [];
      }
    } catch (error: any) {
      console.error('Unexpected error in getDrafts:', error?.message);
      // Always return an empty array rather than throwing
      return [];
    }
  },

  submitDraft: async (draftId: string) => {
    try {
      console.log(`Attempting to submit draft with ID: ${draftId}`);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      const response = await apiClient.post(`/arbitration/draft/${draftId}/submit`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Draft submission response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting draft:', error);
      
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          data: error.response.data,
          statusText: error.response.statusText
        });
      }
      
      throw error;
    }
  },

  getAll: async () => {
    try {
      console.log('Fetching all cases...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found, returning empty cases array');
        return [];
      }
      
      try {
        // First try the standard API path
        console.log('Trying primary cases endpoint...');
        const response = await apiClient.get('/arbitration/cases', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`Successfully retrieved ${Array.isArray(response.data) ? response.data.length : 0} cases`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (firstError: any) {
        console.warn(`Primary cases endpoint failed: ${firstError.message}`);
        
        // If the first attempt fails with 404, try a fallback endpoint
        if (firstError.response?.status === 404) {
          try {
            // Try an alternative endpoint format
            console.log('Trying fallback cases endpoint...');
            const fallbackResponse = await apiClient.get('/arbitration-cases', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            console.log('Fallback endpoint successful');
            return Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
          } catch (fallbackError: any) {
            console.warn(`Fallback endpoint also failed: ${fallbackError.message}`);
            // Both endpoints failed - return empty array
            return [];
          }
        }
        
        // For other error types, return empty array
        console.warn('Returning empty cases array due to API error');
        return [];
      }
    } catch (error: any) {
      console.error('Unexpected error in getAll:', error?.message);
      // Always return an empty array rather than throwing
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      console.log(`Fetching item with ID: ${id}`);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found, cannot fetch item');
        throw new Error('Authentication required. Please log in first.');
      }
      
      // First try to get it as a submitted case
      try {
        console.log('Trying to fetch as a case...');
        const response = await apiClient.get(`/arbitration/cases/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Successfully fetched as case');
        return response.data;
      } catch (caseError: any) {
        console.log(`Case fetch failed: ${caseError.message}, trying as a draft...`);
        
        if (caseError.response?.status === 404 || caseError.response?.status === 403) {
          // If not found as a case, try getting it as a draft
          try {
            console.log('Trying to fetch as a draft...');
            const draftResponse = await apiClient.get(`/arbitration/draft/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            console.log('Successfully fetched as draft');
            return draftResponse.data;
          } catch (draftError: any) {
            console.error(`Draft fetch also failed: ${draftError.message}`);
            
            // Try alternative endpoint formats before giving up
            try {
              console.log('Trying alternative endpoint format...');
              const altResponse = await apiClient.get(`/arbitration-items/${id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              console.log('Alternative endpoint successful');
              return altResponse.data;
            } catch (altError: any) {
              console.error(`All endpoints failed for ID ${id}`);
              throw new Error(`Item with ID ${id} could not be found`);
            }
          }
        } else {
          // For other errors, re-throw with details
          const errorMessage = caseError.response?.data?.message || caseError.message;
          console.error(`Error fetching item: ${errorMessage}`);
          throw new Error(`Error fetching item: ${errorMessage}`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching item by ID:', error);
      
      // Add detailed error information
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          data: error.response.data,
          statusText: error.response.statusText
        });
      }
      
      // Rethrow with a user-friendly message
      throw new Error(error.message || 'Failed to load the requested item');
    }
  },

  getByCaseNumber: async (caseNumber: string) => {
    const response = await apiClient.get(`/arbitration/cases/${caseNumber}`);
    return response.data;
  },

  update: async (id: string, formData: FormData) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in first.');
      }
      
      const response = await apiClient.put(`/arbitration/cases/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 60000, // 60 seconds
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/arbitration/cases/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/arbitration/cases/${id}`);
    return response.data;
  },
};

// Authentication endpoints
export const auth = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      console.log('Starting login request to:', `${API_URL}/api/auth/login`);
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      // Handle different response structures from NestJS
      const token = response.data.access_token || response.data.token;
      const user = response.data.user;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      // Store token with an expiration time (24 hours)
      const tokenData = {
        value: token,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token_expiry', JSON.stringify(tokenData.expires));
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      return { user, token };
    } catch (error: any) {
      console.error('Login error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      
      // Provide more specific error messages
      if (error?.response?.status === 401) {
        throw new Error('Invalid email or password. Please try again.');
      } else if (error?.response?.status === 404) {
        throw new Error('Authentication service is currently unavailable. Please try again later.');
      } else if (error?.response?.status === 400) {
        throw new Error(error?.response?.data?.message || 'Invalid credentials format.');
      } else if (error?.message === 'Network Error') {
        throw new Error('Cannot connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  },
  
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    organization?: string;
  }) => {
    try {
      console.log('Registering user with data:', {
        ...userData,
        password: '[REDACTED]'  // Don't log the actual password
      });
      
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expiry');
    
    // Use the logout callback if it exists
    if (logoutCallback) {
      logoutCallback();
    }
    
    return Promise.resolve();
  },
  
  getCurrentUser: async () => {
    try {
      // Add debug logging for token existence
      const token = localStorage.getItem('auth_token');
      console.log('Getting current user, token available:', !!token);
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Check if token is expired
      const expiryStr = localStorage.getItem('token_expiry');
      if (expiryStr) {
        const expiry = JSON.parse(expiryStr);
        if (Date.now() > expiry) {
          // Token is expired
          console.warn('Token has expired');
          auth.logout();
          throw new Error('Your session has expired. Please log in again.');
        }
      }
      
      // If we already have user data in localStorage, use it as fallback
      const storedUserStr = localStorage.getItem('user');
      let storedUser = null;
      
      if (storedUserStr) {
        try {
          storedUser = JSON.parse(storedUserStr);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
      
      try {
        console.log('Making request to:', `${API_URL}/api/auth/me`);
        const response = await apiClient.get('/auth/me');
        console.log('User data received from API');
        return response.data;
      } catch (requestError: any) {
        console.warn('Error fetching user from API:', requestError?.message);
        
        // If we have stored user data, return it as fallback
        if (storedUser) {
          console.log('Using stored user data as fallback');
          return storedUser;
        }
        
        // Otherwise, propagate the error
        if (requestError.response?.status === 401) {
          throw new Error('Authentication failed: Invalid or expired token');
        } else if (requestError.response?.status === 404) {
          throw new Error('User profile endpoint not available');
        }
        
        throw requestError;
      }
    } catch (error: any) {
      console.error('Error getting current user:', {
        message: error?.message,
        status: error?.response?.status,
      });
      
      // Clear token if there's an authentication problem
      if (error.response?.status === 401) {
        auth.logout();
      }
      
      throw error;
    }
  },
  
  // Check if the user is currently authenticated
  isAuthenticated: () => {
    if (typeof window === 'undefined') {
      return false; // Not authenticated on server-side
    }
    
    const token = localStorage.getItem('auth_token');
    const expiryStr = localStorage.getItem('token_expiry');
    
    if (!token) return false;
    
    // Check expiration if available
    if (expiryStr) {
      try {
        const expiry = JSON.parse(expiryStr);
        if (Date.now() > expiry) {
          // Token expired, clean up
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('token_expiry');
          return false;
        }
      } catch (e) {
        console.error('Error parsing token expiry:', e);
        return false;
      }
    }
    
    return true;
  }
};

// Arbitration case management endpoints
const arbitration = {
  // Submit new arbitration request
  submitRequest: (formData: any) => 
    apiClient.post('/api/arbitration/submit', formData),
  
  // Save draft arbitration request
  saveDraft: (formData: any) => 
    apiClient.post('/api/arbitration/draft', formData),
  
  // Get list of cases for the current user
  getCases: (filters?: { status?: string; category?: string }) => 
    apiClient.get('/api/arbitration/cases', { params: filters }),
  
  // Get specific case details
  getCaseDetails: (caseId: string) => 
    apiClient.get(`/api/arbitration/cases/${caseId}`),
  
  // Update case status
  updateCaseStatus: (caseId: string, status: string) => 
    apiClient.patch(`/api/arbitration/cases/${caseId}/status`, { status }),
  
  // Submit response to arbitration request (for respondents)
  submitResponse: (caseId: string, responseData: any) => 
    apiClient.post(`/api/arbitration/cases/${caseId}/respond`, responseData),
};

// Document management endpoints
const documents = {
  // Upload document with metadata
  uploadDocument: (caseId: string, documentData: FormData) => 
    apiClient.post(`/api/documents/${caseId}/upload`, documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // Get documents for a case
  getDocuments: (caseId: string) => 
    apiClient.get(`/api/documents/${caseId}`),
  
  // Download specific document
  downloadDocument: (documentId: string) => {
    // This needs special handling for file downloads
    window.open(`${API_URL}/api/documents/download/${documentId}`, '_blank');
    return Promise.resolve({ success: true });
  },
  
  // Delete document
  deleteDocument: (documentId: string) => 
    apiClient.delete(`/api/documents/${documentId}`),
};

// Arbitrator management endpoints
const arbitrators = {
  // Get list of arbitrators
  getArbitrators: (filters?: { expertise?: string; availability?: string }) => 
    apiClient.get('/api/arbitrators', { params: filters }),
  
  // Get specific arbitrator details
  getArbitratorDetails: (arbitratorId: string) => 
    apiClient.get(`/api/arbitrators/${arbitratorId}`),
  
  // Assign arbitrator to case
  assignArbitrator: (caseId: string, arbitratorId: string) => 
    apiClient.post(`/api/arbitration/cases/${caseId}/assign-arbitrator`, { arbitratorId }),
};

// User profile management
const profile = {
  // Get current user profile
  getProfile: () => apiClient.get('/api/users/profile'),
  
  // Update user profile
  updateProfile: (profileData: any) => 
    apiClient.patch('/api/users/profile', profileData),
  
  // Change password
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) => 
    apiClient.post('/api/users/change-password', passwordData),
};

// Communication endpoints
const communications = {
  // Get messages for a case
  getMessages: (caseId: string) => 
    apiClient.get(`/api/communications/${caseId}`),
  
  // Send message
  sendMessage: (caseId: string, messageData: { content: string; attachments?: File[] }) => {
    const formData = new FormData();
    formData.append('content', messageData.content);
    
    if (messageData.attachments) {
      messageData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    return apiClient.post(`/api/communications/${caseId}/send`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete message
  deleteMessage: (messageId: string) => 
    apiClient.delete(`/api/communications/messages/${messageId}`),
  
  // Get deleted messages (recycle bin)
  getDeletedMessages: () => 
    apiClient.get('/api/communications/deleted'),
};

// Hearings management
const hearings = {
  // Schedule hearing
  scheduleHearing: (caseId: string, hearingData: {
    date: string;
    time: string;
    duration: number;
    type: 'virtual' | 'physical';
    location?: string;
    meetingLink?: string;
  }) => 
    apiClient.post('/api/hearings', hearingData),
  
  // Get hearings for a case
  getHearings: (caseId: string) => 
    apiClient.get(`/api/hearings/${caseId}`),
  
  // Update hearing details
  updateHearing: (hearingId: string, hearingData: any) => 
    apiClient.patch(`/api/hearings/${hearingId}`, hearingData),
  
  // Cancel hearing
  cancelHearing: (hearingId: string, reason: string) => 
    apiClient.post(`/api/hearings/${hearingId}/cancel`, { reason }),
};

// Feedback and ratings
const feedback = {
  // Submit feedback for arbitrator
  submitFeedback: (arbitratorId: string, feedbackData: {
    rating: number;
    comments: string;
    caseId: string;
  }) => 
    apiClient.post(`/api/feedback/arbitrator/${arbitratorId}`, feedbackData),
  
  // Get feedback for arbitrator
  getArbitratorFeedback: (arbitratorId: string) => 
    apiClient.get(`/api/feedback/arbitrator/${arbitratorId}`),
};

// Analytics and reporting
const analytics = {
  // Get case statistics
  getCaseStats: (filters?: { period?: string; category?: string }) => 
    apiClient.get('/api/analytics/cases', { params: filters }),
  
  // Get arbitrator performance metrics
  getArbitratorMetrics: (arbitratorId?: string) => 
    apiClient.get('/api/analytics/arbitrators', { params: { arbitratorId } }),
};

// Help desk and support
const helpdesk = {
  // Submit support ticket
  submitTicket: (ticketData: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    attachments?: File[];
  }) => {
    const formData = new FormData();
    formData.append('subject', ticketData.subject);
    formData.append('description', ticketData.description);
    formData.append('priority', ticketData.priority);
    
    if (ticketData.attachments) {
      ticketData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }
    
    return apiClient.post('/api/helpdesk/tickets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Get user's support tickets
  getTickets: (status?: 'open' | 'closed' | 'all') => 
    apiClient.get('/api/helpdesk/tickets', { params: { status } }),
  
  // Get specific ticket details
  getTicketDetails: (ticketId: string) => 
    apiClient.get(`/api/helpdesk/tickets/${ticketId}`),
  
  // Add comment to ticket
  addTicketComment: (ticketId: string, comment: string) => 
    apiClient.post(`/api/helpdesk/tickets/${ticketId}/comment`, { comment }),
};

// Export all API functions
export const api = {
  arbitration: arbitrationApi,
  auth,
  profile,
  communications,
  hearings,
  feedback,
  analytics,
  helpdesk,
  // Add verification methods
  verification: {
    // Verify if a GST number actually exists
    verifyGST: async (gstNumber: string): Promise<{ valid: boolean; message?: string }> => {
      try {
        // Convert to uppercase for consistency
        const formattedGST = gstNumber.toUpperCase();
        
        // First validate format
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(formattedGST)) {
          return { valid: false, message: 'Invalid GST format' };
        }
        
        // Call the backend verification API
        const response = await apiClient.get(`/verification/gst?number=${formattedGST}`);
        return response.data;
      } catch (error: any) {
        console.error('GST verification error:', error);
        return { 
          valid: false, 
          message: error.response?.data?.message || 'Verification service unavailable. Please try again later.' 
        };
      }
    },
    
    // Verify if a PAN number actually exists
    verifyPAN: async (panNumber: string): Promise<{ valid: boolean; message?: string }> => {
      try {
        // Convert to uppercase for consistency
        const formattedPAN = panNumber.toUpperCase();
        
        // First validate format
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(formattedPAN)) {
          return { valid: false, message: 'Invalid PAN format' };
        }
        
        // Call the backend verification API
        const response = await apiClient.get(`/verification/pan?number=${formattedPAN}`);
        return response.data;
      } catch (error: any) {
        console.error('PAN verification error:', error);
        return { 
          valid: false, 
          message: error.response?.data?.message || 'Verification service unavailable. Please try again later.'
        };
      }
    },
    
    // Verify if a CIN number actually exists
    verifyCIN: async (cinNumber: string): Promise<{ valid: boolean; message?: string }> => {
      try {
        // Convert to uppercase for consistency
        const formattedCIN = cinNumber.toUpperCase();
        
        // First validate format
        const cinRegex = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
        if (!cinRegex.test(formattedCIN)) {
          return { valid: false, message: 'Invalid CIN format' };
        }
        
        // Call the backend verification API
        const response = await apiClient.get(`/verification/cin?number=${formattedCIN}`);
        return response.data;
      } catch (error: any) {
        console.error('CIN verification error:', error);
        return { 
          valid: false, 
          message: error.response?.data?.message || 'Verification service unavailable. Please try again later.'
        };
      }
    }
  }
};