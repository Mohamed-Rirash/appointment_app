import axios from "axios";

// Create an axios instance with base URL and default config
const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}`,
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
  last_name: string;
  roles: string;
}

interface Office {
  name: string;
  description: string;
  location: string;
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

interface AvailabilityRecord {
  id?: string;
  daysofweek: string;
  specific_date?: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
}


export interface Appointment {
  appointment_id: string;
  host_first_name: string;
  host_last_name: string;
  citizen_firstname: string;
  citizen_lastname: string;
  citizen_email: string;
  citizen_phone: string;
  purpose: string;
  appointment_date: string; // ISO 8601
  time_slotted: string;     // "HH:mm:ss"
  status: "PENDING" | "APPROVED" | "DENIED" | "POSTPONED" | "CANCELED";
  office_id: string;
  created_at: string;
}
export const client = {
  // Set Password (first-time setup)
  async setPassword(data: { token: string; new_password: string }) {
    const response = await apiClient.post("/users/set-password", data);
    return response.data;
  },

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
    console.log("CREATE USER", data);
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
    console.log("clinettt", process.env.NEXT_PUBLIC_API_URL);
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

  // Resend Invite
  async resendInvite(userId: string, token?: string) {
    const response = await apiClient.post(
      `/admin/users/${userId}/resend-invite`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Activate User
  async activateUser(userId: string, token: string) {
    const response = await apiClient.patch(
      `/admin/users/${userId}/activate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("activ:::", response.data);
    return response.data;
  },

  // Deactivate User
  async deactivateUser(userId: string, token: string) {
    const response = await apiClient.patch(
      `/admin/users/${userId}/deactivate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Suspend User
  async suspendUser(userId: string, token: string) {
    const response = await apiClient.patch(
      `/admin/users/${userId}/suspend`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Assign Role
  async assignRole(userId: string, roleName: string, token: string) {
    console.log("ID", userId);
    const response = await apiClient.post(
      `/admin/users/${userId}/roles/${roleName}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Role:::", response.data);
    return response.data;
  },

  // Revoke Role
  async revokeRole(userId: string, roleName: string, token: string) {
    const response = await apiClient.post(
      `/admin/users/${userId}/roles/${roleName}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("revoke", response.data);
    return response.data;
  },

  // OFFICESSS

  // Get Offices
  // async getOffices(token: string) {
  //   const response = await apiClient.get("/offices", {
  //     headers: { Authorization: `Bearer ${token}` },
  //   });
  //   return response.data;
  // },

  // Get Office
  async getOffice(token?: string, id?: string) {
    // Validate id before making the request
    if (!id || typeof id !== "string") {
      throw new Error("Office ID is required and must be a string");
    }

    // Validate token
    if (!token) {
      throw new Error("Authentication token is required");
    }
    console.log("from client id:", id);

    const response = await apiClient.get(`/offices/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // create office
  async createOffice(
    data: { name: string; description: string; location: string },
    token?: string
  ) {
    const response = await apiClient.post("/offices", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  // edit pffice
  async editOffice(officeId: string, data: Office, token?: string) {
    const response = await apiClient.patch(`/offices/${officeId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  // Delete office
  async deleteOffice(officeId: string, token?: string) {
    const response = await apiClient.delete(`/offices/${officeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("delted data", response.data);
    return response.data;
  },
  // office deactivate
  async deactivateOffice(officeId: string, token: string) {
    const response = await apiClient.post(
      `/offices/${officeId}/deactivate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
  // office activate
  async activateOffice(officeId: string, token: string) {
    const response = await apiClient.post(
      `/offices/${officeId}/activate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
  // Get members of an office
  async getOfficeMembers(officeId: string, token: string) {
    const response = await apiClient.get(`/offices/${officeId}/memberships`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  // Get unassigned users
  async getUnassignedUsers(token: string) {
    try {
      const response = await apiClient.get("/offices/unassigned", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to fetch unassigned users"
      );
    }
  },

  //assing user to office

  async assigntoOffice(
    data: { user_id: string; position: string },
    officeId: string,
    token?: string
  ) {
    const response = await apiClient.post(
      `/offices/${officeId}/memberships`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
  //

  // host availability
  async getHotAvailability(officeId: string, token?: string) {
    try {
      const responce = await apiClient.get(`/availability/hosts/${officeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return responce.data;
    } catch (error: any) {
      error.response?.data?.detail || "Failed to get availability";
    }
  },

  // Set host availability
  async setHostAvailability(
    officeId: string,
    data: AvailabilityRecord,
    token?: string
  ) {
    try {
      const response = await apiClient.post(
        `/availability/hosts/${officeId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to set availability"
      );
    }
  },

  // Get Slot availability

  async getSlotAvailability(officeId: string, data: string, token?: string) {
    console.log("OFFICE ID client", officeId);

    console.log("TOKEN client", token);
    try {
      const response = await apiClient.get(
        `/availability/hosts/${officeId}/slots?target_date=${data}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error: any) {
      error.response?.data?.detail || "Failed to set availability";
    }
  },

  // create appoint
async createAppointment(data, token?: string) {
  try {
    const response = await apiClient.post(
      `/appointments/with-citizen`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("Error creating appointment:", error);
    
    // Handle 422 validation errors
    if (error.response?.status === 422 && error.response?.data?.detail) {
      const details = error.response.data.detail;
      
      // Extract all error messages from the detail array
      const errorMessages = details.map((err: any) => {
        // Format: "field: message" or just "message"
        const field = err.loc?.join('.') || 'validation';
        return `${field}: ${err.msg}`;
      }).join(', ');
      
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    // For other types of errors
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        "Failed to create appointment";
    
    // Ensure errorMessage is a string
    throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
  }
},

  // Get host dashboard stats
  async getHostDashboardStats(token: string) {
    try {
      const response = await apiClient.get("/host/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to fetch host dashboard stats"
      );
    }
  },


  // Get appointment queue
  async getAppointmentQueue(token: string,office_id:string,limit:number,offset:number) {
    console.log("Client",office_id)
    try {
      const response = await apiClient.get(`/views/${office_id}/appointments?status=PENDING&limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to fetch appointment queue"
      );
    }
  },
  // Get today's appointments
  async getTodaysAppointments(token: string) {
    try {
      const response = await apiClient.get("/admin/appointments/today", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to fetch today's appointments"
      );
    }
  },

  // get my appointment i create
  // Get current user's appointments (host or secretary or reception)
async getMyAppointments(
  token: string,
  on_date?: string,
  limit: number = 20,
  offset: number = 0
) {
  const params = new URLSearchParams();
  if (on_date) params.append("on_date", on_date);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await apiClient.get(`/views/my/appointments?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data as {
    total: number;
    limit: number;
    offset: number;
    appointments: Appointment[];
  };
},

// reception getting office and host
// 1. GET all offices (with optional status filter)
async getOffices(token: string, status?: 'active' | 'deactivated') {
  try {
    const params = status ? { status_filter: status } : {};
    const response = await apiClient.get('/offices/', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // returns Office[]
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail ||
      error.message ||
      'Failed to fetch offices'
    );
  }
},

// 2. GET hosts for a specific office
async getOfficeHosts(token: string, officeId: string) {
  try {
    const response = await apiClient.get(`/offices/${officeId}/hosts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // returns Host[]
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail ||
      error.message ||
      'Failed to fetch office hosts'
    );
  }
}
};
