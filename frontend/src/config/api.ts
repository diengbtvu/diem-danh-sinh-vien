// API Configuration
export const API_CONFIG = {
  // Base URL for API calls
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://diemdanh.zettix.net',
  
  // External Face API base URL
  FACE_API_BASE_URL: import.meta.env.VITE_FACE_API_BASE_URL || 'http://apimaycogiau.zettix.net',
  
  // API endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/api/auth/login',
      VERIFY: '/api/auth/verify',
      CHANGE_PASSWORD: '/api/auth/change-password',
    },
    
    // Admin endpoints
    ADMIN: {
      USERS: '/api/admin/users',
      USERS_DASHBOARD: '/api/admin/users/dashboard',
      USERS_TOGGLE_STATUS: (userId: number) => `/api/admin/users/${userId}/toggle-status`,
      SESSIONS: '/api/admin/sessions',
      STUDENTS: '/api/admin/students',
      STUDENTS_IMPORT: '/api/admin/students/import',
      STUDENTS_BY_ID: (mssv: string) => `/api/admin/students/${mssv}`,
    },
    
    // Teacher endpoints
    TEACHER: {
      SESSIONS: '/api/teacher/sessions',
      CLASSES: '/api/teacher/classes',
      CLASSES_CODES: '/api/teacher/classes/codes',
      STUDENTS: '/api/teacher/students',
      STUDENTS_IMPORT: '/api/teacher/students/import',
      DASHBOARD: '/api/teacher/dashboard',
    },
    
    // Session endpoints
    SESSIONS: {
      BASE: '/api/sessions',
      VALIDATE: '/api/sessions/validate',
      CURRENT: '/api/sessions/current',
      BY_ID: (sessionId: string) => `/api/sessions/${sessionId}`,
    },
    
    // Attendance endpoints
    ATTENDANCE: {
      BASE: '/api/attendances',
    },

    // Face Recognition API endpoints (external)
    FACE_API: {
      HEALTH: '/api/v1/face-recognition/health',
      PREDICT_BASE64: '/api/v1/face-recognition/predict/base64',
      PREDICT_FILE: '/api/v1/face-recognition/predict/file',
    }
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Build URL for external Face API
export const buildFaceApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.FACE_API_BASE_URL}${endpoint}`;
};

// Helper function for common fetch with error handling
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Attach Authorization header automatically if token exists in localStorage
  try {
    const stored = localStorage.getItem('diemdanh_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      const token = parsed?.token as string | undefined;
      const hasAuthHeader = !!(defaultOptions.headers as Record<string, string>)?.['Authorization'];
      if (token && !hasAuthHeader) {
        (defaultOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore
  }

  try {
    const response = await fetch(url, defaultOptions);
    return response;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
};

// Face API helpers
export const faceApiHealth = async (): Promise<Response> => {
  const url = buildFaceApiUrl(API_CONFIG.ENDPOINTS.FACE_API.HEALTH);
  return fetch(url, { method: 'GET' });
};

export const faceApiPredictBase64 = async (imageBase64: string): Promise<Response> => {
  const url = buildFaceApiUrl(API_CONFIG.ENDPOINTS.FACE_API.PREDICT_BASE64);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 })
  });
};

export const faceApiPredictFile = async (file: File): Promise<Response> => {
  const url = buildFaceApiUrl(API_CONFIG.ENDPOINTS.FACE_API.PREDICT_FILE);
  const form = new FormData();
  form.append('image', file);
  return fetch(url, { method: 'POST', body: form });
};

// Helper for authenticated requests
export const authenticatedRequest = async (
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> => {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
};
