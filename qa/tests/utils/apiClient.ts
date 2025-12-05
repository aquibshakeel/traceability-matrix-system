import axios, { AxiosInstance, AxiosError } from 'axios';

export interface CreateUserRequest {
  email: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: {
    error: string;
    message: string;
  };
}

export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.API_BASE_URL || 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Don't throw on any status code
    });
  }

  /**
   * Create a new user
   */
  async createUser(request: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.post('/api/user', request);
      return {
        status: response.status,
        data: response.status === 201 ? response.data : undefined,
        error: response.status !== 201 ? response.data : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.client.get(`/api/user/${id}`);
      return {
        status: response.status,
        data: response.status === 200 ? response.data : undefined,
        error: response.status !== 200 ? response.data : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create user with malformed JSON (for negative testing)
   */
  async createUserMalformed(payload: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/user', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        transformRequest: [(data) => data], // Don't transform, send as-is
      });
      return {
        status: response.status,
        data: response.status === 201 ? response.data : undefined,
        error: response.status !== 201 ? response.data : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Create user with wrong content type
   */
  async createUserWrongContentType(request: CreateUserRequest): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/api/user', request, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      return {
        status: response.status,
        data: response.status === 201 ? response.data : undefined,
        error: response.status !== 201 ? response.data : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    try {
      const response = await this.client.get('/health');
      return {
        status: response.status,
        data: response.status === 200 ? response.data : undefined,
        error: response.status !== 200 ? response.data : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Wait for service to be ready
   */
  async waitForService(maxRetries: number = 30, delayMs: number = 1000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.healthCheck();
        if (response.status === 200) {
          console.log(`✅ Service is ready (attempt ${i + 1}/${maxRetries})`);
          return true;
        }
      } catch (error) {
        // Service not ready yet
      }
      await this.sleep(delayMs);
      console.log(`⏳ Waiting for service... (attempt ${i + 1}/${maxRetries})`);
    }
    console.log(`❌ Service did not become ready after ${maxRetries} attempts`);
    return false;
  }

  private handleError(error: any): ApiResponse<any> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        status: axiosError.response?.status || 500,
        error: {
          error: 'Request Failed',
          message: axiosError.message,
        },
      };
    }
    return {
      status: 500,
      error: {
        error: 'Unknown Error',
        message: error.message || 'An unknown error occurred',
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Generic POST method for any endpoint
   */
  async post(url: string, data?: any): Promise<any> {
    const response = await this.client.post(url, data);
    return response;
  }

  /**
   * Generic GET method for any endpoint
   */
  async get(url: string): Promise<any> {
    const response = await this.client.get(url);
    return response;
  }

  /**
   * Generic PUT method for any endpoint
   */
  async put(url: string, data?: any): Promise<any> {
    const response = await this.client.put(url, data);
    return response;
  }

  /**
   * Generic DELETE method for any endpoint
   */
  async delete(url: string): Promise<any> {
    const response = await this.client.delete(url);
    return response;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
