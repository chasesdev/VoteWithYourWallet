// API utility functions for VoteWithYourWallet

// Use relative URLs for API calls to work with any domain
const API_BASE_URL = '/api';

// Generic API request function
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Business API functions
export async function fetchBusinesses(searchQuery?: string, category?: string) {
  const params = new URLSearchParams();
  if (searchQuery) params.append('search', searchQuery);
  if (category) params.append('category', category);
  
  const endpoint = `/businesses${params.toString() ? `?${params.toString()}` : ''}`;
  return apiRequest(endpoint);
}

export async function fetchBusinessById(id: number) {
  return apiRequest(`/businesses/${id}`);
}

// User Alignment API functions
export async function setUserAlignment(userId: number, alignment: any) {
  return apiRequest(`/user-alignment`, {
    method: 'POST',
    body: JSON.stringify({ userId, alignment }),
  });
}

export async function getUserAlignment(userId: number) {
  return apiRequest(`/user-alignment/${userId}`);
}

// Business Alignment API functions
export async function getBusinessAlignment(userId: number, businessId: number) {
  return apiRequest(`/business-alignment/${businessId}/${userId}`);
}

// Reviews API functions
export async function fetchBusinessReviews(businessId: number) {
  return apiRequest(`/businesses/${businessId}/reviews`);
}

export async function submitReview(
  businessId: number,
  userId: number,
  rating: number,
  comment: string,
  media?: any[],
  userAlignment?: any
) {
  return apiRequest(`/businesses/${businessId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      rating,
      comment,
      media,
      userAlignment,
    }),
  });
}

export async function markReviewHelpful(reviewId: number) {
  return apiRequest(`/reviews/${reviewId}/helpful`, {
    method: 'POST',
  });
}

// Media Upload API functions
export async function uploadMedia(file: File, type: 'image' | 'video', caption?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (caption) formData.append('caption', caption);

  try {
    const url = `${API_BASE_URL}/media/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Media upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Search History API functions
export async function saveSearchHistory(userId: number, query: string) {
  return apiRequest(`/search/history`, {
    method: 'POST',
    body: JSON.stringify({ userId, query }),
  });
}

export async function getSearchHistory(userId: number) {
  return apiRequest(`/search/history/${userId}`);
}

export async function clearSearchHistory(userId: number) {
  return apiRequest(`/search/history/${userId}`, {
    method: 'DELETE',
  });
}

// User Preferences API functions
export async function updateUserPreferences(userId: number, preferences: any) {
  return apiRequest(`/user/preferences`, {
    method: 'POST',
    body: JSON.stringify({ userId, preferences }),
  });
}

export async function getUserPreferences(userId: number) {
  return apiRequest(`/user/preferences/${userId}`);
}

// Business Suggestions API functions
export async function getBusinessSuggestions(query: string) {
  return apiRequest(`/businesses/suggestions?query=${encodeURIComponent(query)}`);
}

// Analytics API functions
export async function trackUserAction(userId: number, action: string, data?: any) {
  return apiRequest(`/analytics/track`, {
    method: 'POST',
    body: JSON.stringify({ userId, action, data }),
  });
}

// Utility functions
export function generateUserId(): number {
  return Math.floor(Math.random() * 1000000);
}

export function getCurrentUserId(): number {
  // In a real app, this would come from authentication
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) {
    return parseInt(storedUserId);
  }
  
  const newUserId = generateUserId();
  localStorage.setItem('userId', newUserId.toString());
  return newUserId;
}

// Speech-to-text API functions
export async function transcribeAudio(audioFile: File) {
  const formData = new FormData();
  formData.append('audio', audioFile);

  try {
    const url = `${API_BASE_URL}/speech-to-text`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Speech-to-text failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
