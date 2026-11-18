const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Types
export interface NewsArticle {
  id: number;
  /** SEO-friendly URL slug, e.g. "government-announces-new-education-policy-42" */
  slug: string;
  titleEN: string;
  titleRW: string;
  titleFR: string;
  excerptEN: string;
  excerptRW: string;
  excerptFR: string;
  contentEN: string; // rich HTML supported
  contentRW: string;
  contentFR: string;
  category: string;
  image?: string; // legacy featured image
  images?: string[]; // gallery
  videos?: string[]; // embedded videos
  video?: string; // legacy single video
  imageCaptions?: Record<string, { EN?: string; RW?: string; FR?: string }>; // map of image URLs to captions
  author: string;
  authorImage?: string; // URL to the author's profile photo
  featured: boolean;
  trending: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export const AD_PLACEMENTS = [
  'banner',
  'sidebar',
  'inline',
  'header',
  'footer',
  'ticker',
  'hero',
  'article',
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export interface Advertisement {
  id: number;
  title: string;
  mediaUrl?: string;
  linkUrl?: string;
  placement: AdPlacement;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: number;
  name: string;
  url: string;
  type: 'image' | 'video';
  size?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  session_id: string;
  admin: {
    id: number;
    username: string;
  };
}

export interface StatsResponse {
  articles: number;
  totalViews: number;
  advertisements: number;
  mediaItems: number;
  admins: number;
  totalComments: number;
}

export interface Announcement {
  id: number;
  titleEN: string;
  titleRW: string;
  titleFR: string;
  descriptionEN: string;
  descriptionRW: string;
  descriptionFR: string;
  image?: string;
  video?: string;
  file?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token
const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// Helper function to get session ID
const getSessionId = (): string | null => {
  return localStorage.getItem('sessionId');
};

// Helper function to set session ID
const setSessionId = (sessionId: string): void => {
  localStorage.setItem('sessionId', sessionId);
};

// Helper function to remove session ID
const removeSessionId = (): void => {
  localStorage.removeItem('sessionId');
};

// Fetch wrapper with auth
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const sessionId = getSessionId();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Handle 401 errors - but check error message first for password-related errors
  if (response.status === 401) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Unauthorized' };
    }
    
    // Extract error message (NestJS can return message as string or array)
    let errorMessage = 'Unauthorized';
    if (errorData.message) {
      errorMessage = Array.isArray(errorData.message) 
        ? errorData.message[0] 
        : errorData.message;
    }
    
    // Don't redirect for password-related errors - let them be handled by the UI
    const isPasswordError = errorMessage.toLowerCase().includes('password') || 
                           errorMessage.toLowerCase().includes('incorrect') ||
                           url.includes('change-password');
    
    if (isPasswordError) {
      throw new Error(errorMessage);
    }
    
    // Check if it's a session error
    const isSessionError = errorMessage.toLowerCase().includes('session') || 
                          errorMessage.toLowerCase().includes('expired');
    
    if (isSessionError) {
      // Clear session and token
      removeAuthToken();
      removeSessionId();
      // Dispatch session expired event
      window.dispatchEvent(new CustomEvent('session-expired'));
      window.location.href = '/auth';
      throw new Error(errorMessage);
    }
    
    // For other 401 errors (token expired, invalid token), redirect to login
    removeAuthToken();
    removeSessionId();
    window.location.href = '/auth';
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    let error: any;
    try {
      error = await response.json();
    } catch {
      error = { message: 'An error occurred' };
    }
    
    // Extract error message (NestJS can return message as string or array)
    let errorMessage = `HTTP error! status: ${response.status}`;
    if (error.message) {
      errorMessage = Array.isArray(error.message) 
        ? error.message[0] 
        : error.message;
    }
    
    throw new Error(errorMessage);
  }

  return response;
};

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    if (data.session_id) {
      setSessionId(data.session_id);
    }
    return data;
  },

  logout: async (): Promise<void> => {
    const sessionId = getSessionId();
    const token = getAuthToken();
    
    // Try to invalidate session on server
    if (sessionId && token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Session-Id': sessionId,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Ignore errors during logout
        console.error('Error during logout:', error);
      }
    }
    
    removeAuthToken();
    removeSessionId();
  },

  validateSession: async (): Promise<{ valid: boolean }> => {
    const sessionId = getSessionId();
    if (!sessionId) {
      return { valid: false };
    }
    
    const response = await fetchWithAuth('/auth/validate-session', {
      method: 'POST',
    });
    
    if (!response.ok) {
      return { valid: false };
    }
    
    return response.json();
  },

  getActiveSessions: async (): Promise<any[]> => {
    const response = await fetchWithAuth('/auth/sessions');
    return response.json();
  },

  invalidateSession: async (sessionId: string): Promise<void> => {
    await fetchWithAuth(`/auth/sessions/${sessionId}/invalidate`, {
      method: 'POST',
    });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await fetchWithAuth('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response.json();
  },

  requestPasswordReset: async (usernameOrEmail: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernameOrEmail }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      let errorMessage = `HTTP error! status: ${response.status}`;
      if (error.message) {
        errorMessage = Array.isArray(error.message) ? error.message[0] : error.message;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  verifyResetOtp: async (usernameOrEmail: string, otp: string): Promise<{ valid: boolean; username: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernameOrEmail, otp }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      let errorMessage = `HTTP error! status: ${response.status}`;
      if (error.message) {
        errorMessage = Array.isArray(error.message) ? error.message[0] : error.message;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  resetPasswordWithOtp: async (usernameOrEmail: string, otp: string, newPassword: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernameOrEmail, otp, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      let errorMessage = `HTTP error! status: ${response.status}`;
      if (error.message) {
        errorMessage = Array.isArray(error.message) ? error.message[0] : error.message;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },
};

// News API
export const newsAPI = {
  getAll: async (filters?: {
    category?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: NewsArticle[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.featured !== undefined) params.append('featured', String(filters.featured));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await fetchWithAuth(`/news?${params.toString()}`);
    return response.json();
  },

  getById: async (id: number): Promise<NewsArticle> => {
    const response = await fetchWithAuth(`/news/${id}`);
    return response.json();
  },

  getBySlug: async (slug: string): Promise<NewsArticle> => {
    const response = await fetchWithAuth(`/news/slug/${encodeURIComponent(slug)}`);
    return response.json();
  },

  getFeatured: async (limit: number = 3): Promise<NewsArticle[]> => {
    const response = await fetchWithAuth(`/news/featured?limit=${limit}`);
    return response.json();
  },

  getTrending: async (limit: number = 5): Promise<NewsArticle[]> => {
    const response = await fetchWithAuth(`/news/trending?limit=${limit}`);
    return response.json();
  },

  getByCategory: async (category: string, limit?: number): Promise<NewsArticle[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetchWithAuth(`/news/category/${category}${params}`);
    return response.json();
  },

  create: async (article: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt' | 'views'>): Promise<NewsArticle> => {
    const response = await fetchWithAuth('/news', {
      method: 'POST',
      body: JSON.stringify(article),
    });
    return response.json();
  },

  update: async (id: number, article: Partial<NewsArticle>): Promise<NewsArticle> => {
    const response = await fetchWithAuth(`/news/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(article),
    });
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetchWithAuth(`/news/${id}`, {
      method: 'DELETE',
    });
  },

  /** Fetch related articles in the same category, excluding the given ID */
  getRelated: async (id: number, category: string, limit = 4): Promise<NewsArticle[]> => {
    const response = await fetch(
      `${API_BASE_URL}/news-related/${id}?category=${encodeURIComponent(category)}&limit=${limit}`,
    );
    if (!response.ok) return [];
    return response.json();
  },
};

// Advertisement API
export const advertisementsAPI = {
  getAll: async (filters?: {
    placement?: AdPlacement;
    isPublished?: boolean;
  }): Promise<Advertisement[]> => {
    const params = new URLSearchParams();
    if (filters?.placement) params.append('placement', filters.placement);
    if (filters?.isPublished !== undefined) params.append('isPublished', String(filters.isPublished));

    const search = params.toString();
    const response = await fetchWithAuth(`/advertisements${search ? `?${search}` : ''}`);
    return response.json();
  },

  getByPlacement: async (placement: AdPlacement | string): Promise<Advertisement[]> => {
    const response = await fetchWithAuth(`/advertisements/placement/${placement}`);
    return response.json();
  },

  getById: async (id: number): Promise<Advertisement> => {
    const response = await fetchWithAuth(`/advertisements/${id}`);
    return response.json();
  },

  create: async (
    ad: Omit<Advertisement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Advertisement> => {
    const response = await fetchWithAuth('/advertisements', {
      method: 'POST',
      body: JSON.stringify(ad),
    });
    return response.json();
  },

  update: async (id: number, ad: Partial<Advertisement>): Promise<Advertisement> => {
    const response = await fetchWithAuth(`/advertisements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(ad),
    });
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetchWithAuth(`/advertisements/${id}`, {
      method: 'DELETE',
    });
  },
};

// Media API
export const mediaAPI = {
  getAll: async (filters?: { type?: string }): Promise<MediaItem[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);

    const response = await fetchWithAuth(`/media?${params.toString()}`);
    return response.json();
  },

  getById: async (id: number): Promise<MediaItem> => {
    const response = await fetchWithAuth(`/media/${id}`);
    return response.json();
  },

  create: async (media: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaItem> => {
    const response = await fetchWithAuth('/media', {
      method: 'POST',
      body: JSON.stringify(media),
    });
    return response.json();
  },

  update: async (id: number, media: Partial<MediaItem>): Promise<MediaItem> => {
    const response = await fetchWithAuth(`/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(media),
    });
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetchWithAuth(`/media/${id}`, {
      method: 'DELETE',
    });
  },
};

// Upload API
export const uploadAPI = {
  uploadFile: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  uploadFiles: async (files: File[]): Promise<Array<{ url: string; filename: string }>> => {
    const formData = new FormData();
    for (const f of files) formData.append('files', f);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/many`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },
};

// Stats API
export const statsAPI = {
  get: async (): Promise<StatsResponse> => {
    const response = await fetchWithAuth('/stats');
    return response.json();
  },
};

// Comments API
export interface Comment {
  id: number;
  newsId: number;
  name: string;
  email?: string;
  content: string;
  approved: boolean;
  createdAt: string;
  news?: { id: number; slug: string; titleEN: string };
}

export const commentsAPI = {
  /** Fetch approved comments for an article (public) */
  getByArticle: async (newsId: number): Promise<Comment[]> => {
    const response = await fetch(`${API_BASE_URL}/comments?newsId=${newsId}`);
    if (!response.ok) return [];
    return response.json();
  },

  /** Count approved comments for an article (public) */
  countByArticle: async (newsId: number): Promise<number> => {
    const response = await fetch(`${API_BASE_URL}/comments/count?newsId=${newsId}`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count ?? 0;
  },

  /** Submit a new comment (public — starts unapproved) */
  submit: async (newsId: number, name: string, content: string, email?: string): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsId, name, content, ...(email ? { email } : {}) }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to submit comment' }));
      throw new Error(err.message || 'Failed to submit comment');
    }
    return response.json();
  },

  /** Admin: get all comments, optionally filtered by approval status */
  getAll: async (approved?: boolean): Promise<Comment[]> => {
    const params = approved !== undefined ? `?approved=${approved}` : '';
    const response = await fetchWithAuth(`/comments/all${params}`);
    return response.json();
  },

  /** Admin: approve a comment */
  approve: async (id: number): Promise<Comment> => {
    const response = await fetchWithAuth(`/comments/${id}/approve`, { method: 'PATCH' });
    return response.json();
  },

  /** Admin: delete a comment */
  delete: async (id: number): Promise<void> => {
    await fetchWithAuth(`/comments/${id}`, { method: 'DELETE' });
  },
};

// Announcements API
export const announcementsAPI = {  getAll: async (): Promise<Announcement[]> => {
    const response = await fetchWithAuth('/announcements');
    return response.json();
  },

  getById: async (id: number): Promise<Announcement> => {
    const response = await fetchWithAuth(`/announcements/${id}`);
    return response.json();
  },

  create: async (
    announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Announcement> => {
    const response = await fetchWithAuth('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcement),
    });
    return response.json();
  },

  update: async (id: number, announcement: Partial<Announcement>): Promise<Announcement> => {
    const response = await fetchWithAuth(`/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(announcement),
    });
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetchWithAuth(`/announcements/${id}`, {
      method: 'DELETE',
    });
  },
};

