// fuctions/api/client.ts
import axios from "axios";

// Create an axios instance with base URL and default config
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Define types
interface Userdata {
  email: string;
  first_name: string;
  is_active: boolean;
  is_verified: boolean;
  last_name: string;
  role: string;
  send_welcome_email: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export const client = {
  // Login
  async Login(email: string, password: string): Promise<LoginResponse> {
    console.log("Email client", email);
    console.log("Password", password);

    try {
      const response = await apiClient.post<LoginResponse>(
        "/users/login",
        new URLSearchParams({
          grant_type: "password",
          username: email,
          password: password,
          scope: "",
          client_id: "string",
          client_secret: "********",
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log("ssss", response.data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Server responded with error status
        throw new Error(
          error.response.data?.detail ||
            `Login failed: ${error.response.status}`
        );
      } else if (error.request) {
        throw new Error("No response from server");
      } else {
        throw new Error("Login request setup failed");
      }
    }
  },

  // Get User
  async GetUser(token: string) {
    try {
      const response = await apiClient.get("/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Failed to fetch user");
    }
  },

  // Refresh Token
  async refreshAccessToken() {
    try {
      const response = await apiClient.post<RefreshResponse>("/users/refresh");
      return {
        access_token: response.data.access_token,
        expires_at: Math.floor(Date.now() / 1000 + response.data.expires_in),
      };
    } catch (error: any) {
      console.error("Error refreshing token:", error);
      throw new Error("RefreshAccessTokenError");
    }
  },

  // Reset Password
  async resetPassword(email: string) {
    console.log("|Email: reset", email);
    try {
      const response = await apiClient.post("/users/request-password-reset", {
        email,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail ||
          `Failed to send reset email: ${
            error.response?.status || "network error"
          }`
      );
    }
  },

  // Change Password
  async changePassword(
    current_password: string,
    new_password: string,
    token: string
  ) {
    try {
      const response = await apiClient.post(
        "/users/change-password",
        { current_password, new_password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error changing password:", error);
      throw new Error(
        error.response?.data?.detail || "Failed to change password"
      );
    }
  },

  // Create User (Admin)
  async createUser(data: Userdata, token?: string) {
    try {
      const response = await apiClient.post("/admin/users", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Failed to create user");
    }
  },

  // Get Users (Admin)
  async getUsers(token: string, params: Record<string, any>) {
    console.log("Get");
    try {
      const response = await apiClient.get("/admin/users", {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Failed to fetch users");
    }
  },

  // Delete users (Admin)
  async deleteUser(userId: string, token?: string) {
    const response = await apiClient.delete(`/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    return response.data;
  },

  // Update user (Admin)
  async updateUser(userId: string, userData: Partial<Userdata>, token: string) {
    const response = await apiClient.put(`/admin/users/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  },
};
