interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface BusinessResponse {
  businesses: any[];
}

export const api = {
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`http://localhost:3000${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`
        };
      }

      return {
        success: true,
        data: data.data || data.businesses || data
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || `HTTP error! status: ${response.status}`
        };
      }

      return {
        success: true,
        data: responseData.data || responseData
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || `HTTP error! status: ${response.status}`
        };
      }

      return {
        success: true,
        data: responseData.data || responseData
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || `HTTP error! status: ${response.status}`
        };
      }

      return {
        success: true,
        data: responseData.data || responseData
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },
};

export const fetchBusinesses = async (search?: string, category?: string) => {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (category) params.category = category;

  const response = await api.get<BusinessResponse>('/api/businesses', params);
  return response;
};

export const fetchBusinessById = async (id: number) => {
  const response = await api.get(`/api/businesses/${id}`);
  return response;
};

export const setUserAlignment = async (userId: number, alignment: {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}) => {
  const response = await api.post('/api/user-alignment', {
    userId,
    ...alignment,
  });
  return response;
};

export const getBusinessAlignment = async (userId: number, businessId: number) => {
  const response = await api.get(`/api/business-alignment/${businessId}/${userId}`);
  return response;
};
