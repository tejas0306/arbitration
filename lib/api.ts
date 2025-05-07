import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,  // Add '/api' prefix to match NestJS global prefix
  headers: {
    'Content-Type': 'application/json',
  },
});

// Keep track of logout function for global usage
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
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
      
      // Log full request URL for debugging
      const fullUrl = `${API_URL}/api/arbitration/drafts`;
      console.log('Attempting to save draft to:', fullUrl);
      
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
      
      console.log('Draft FormData contents:', formDataLog);
      
      // Fix: Use correct endpoint to match the backend controller
      const response = await apiClient.post('/arbitration/draft', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        // Increase timeout for large file uploads
        timeout: 60000, // 60 seconds
      });
      
      console.log('Draft saved successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error saving draft:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        stackTrace: error.stack,
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers,
          baseURL: error.config.baseURL,
          fullUrl: error.config.baseURL + error.config.url,
        } : 'No config available'
      });
      
      if (error.response?.status === 404) {
        console.error('404 Error: API endpoint not found. Check that the backend controller has the correct route defined.');
      }
      
      if (error.response?.status === 401) {
        // Handle token expiration or invalid token
        console.error('Authentication failed. Token may be expired or invalid.');
        localStorage.removeItem('auth_token');
        
        // Inform the user they need to log in again
        throw new Error('Your session has expired. Please log in again.');
      }
      
      throw error;
    }
  },

  // Enhanced methods for draft management
  getDrafts: async () => {
    try {
      const response = await apiClient.get('/arbitration/draft');
      return response.data;
    } catch (error) {
      console.error('Error getting drafts:', error);
      throw error;
    }
  },

  submitDraft: async (draftId: string) => {
    try {
      console.log(`Attempting to submit draft with ID: ${draftId}`);
      // Use the correct endpoint path to match the backend controller
      const response = await apiClient.post(`/arbitration/draft/${draftId}/submit`);
      console.log('Draft submission response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error submitting draft:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Server error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Show specific error message based on status code
        if (error.response.status === 404) {
          throw new Error(`Draft with ID ${draftId} not found`);
        } else if (error.response.status === 500) {
          throw new Error(`Server error: ${error.response.data?.message || 'Unknown server error'}`);
        }
      }
      
      throw error;
    }
  },

  getAll: async () => {
    const response = await apiClient.get('/arbitration/cases');
    return response.data;
  },

  getById: async (id: string) => {
    try {
      console.log(`Fetching petition with ID: ${id}`);
      // First try to get it as a submitted case
      try {
        const response = await apiClient.get(`/arbitration/cases/${id}`);
        return response.data;
      } catch (error: any) {
        console.log(`Not found as a case, trying as a draft...`);
        if (error.response?.status === 404) {
          // If not found as a case, try getting it as a draft
          const draftResponse = await apiClient.get(`/arbitration/draft/${id}`);
          return draftResponse.data;
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error fetching petition:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('Server response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      throw error;
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
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      // The backend might return data in different formats, handle both possibilities
      const token = response.data.token || response.data.access_token;
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
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
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
      console.log('⚠️ getCurrentUser token status:', token ? 'EXISTS' : 'MISSING');
      
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
      
      // Check token format
      if (!token.startsWith('ey')) {
        // Most JWT tokens start with 'ey'
        console.warn('Token does not appear to be in JWT format:', token.substring(0, 10) + '...');
      }
      
      console.log('⚠️ Fetching current user with token length:', token.length);
      
      try {
        // Add detailed logging about the request
        console.log('⚠️ Making request to:', `${API_URL}/api/auth/me`);
        
        const response = await apiClient.get('/auth/me', {
          // Increase timeout for debugging
          timeout: 10000,
        });
        
        console.log('⚠️ User data received:', response.data ? 'SUCCESS' : 'EMPTY');
        return response.data;
      } catch (requestError: any) {
        // Add detailed error logging specifically for the request
        console.error('⚠️ Request error details:', {
          message: requestError.message,
          name: requestError.name,
          code: requestError.code,
          status: requestError.response?.status,
          statusText: requestError.response?.statusText,
          data: requestError.response?.data,
          url: requestError.config?.url,
          method: requestError.config?.method,
          baseURL: requestError.config?.baseURL,
          headers: requestError.config?.headers,
        });
        
        // Re-throw with more specific message
        if (requestError.response?.status === 401) {
          throw new Error('Authentication failed: Invalid or expired token');
        } else if (requestError.response?.status === 403) {
          throw new Error('Authentication failed: Insufficient permissions');
        } else if (requestError.code === 'ECONNABORTED') {
          throw new Error('Request timed out. Please check your network connection');
        } else if (requestError.message === 'Network Error') {
          throw new Error('Network error. Please check your connection to the server');
        }
        
        throw requestError;
      }
    } catch (error: any) {
      console.error('Error getting current user:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
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
    const token = localStorage.getItem('auth_token');
    const expiryStr = localStorage.getItem('token_expiry');
    
    if (!token) return false;
    
    // Check expiration if available
    if (expiryStr) {
      try {
        const expiry = JSON.parse(expiryStr);
        if (Date.now() > expiry) {
          // Token expired, clean up
          auth.logout();
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