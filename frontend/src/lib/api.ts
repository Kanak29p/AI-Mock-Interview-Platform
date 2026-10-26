const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Token storage helpers
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },
  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
  setAuthData: (tokens: { accessToken: string; refreshToken: string }, user: User) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
  },
  clearAuth: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};

export class ApiError extends Error {
  statusCode: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode: number, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getAccessToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(
      "Unable to connect to the backend server. Please verify the backend is running.",
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP error ${response.status}`;
    throw new ApiError(errorMsg, response.status, data?.errors);
  }

  return data as T;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  refreshToken: async (refreshToken: string) => {
    return request<{ success: boolean; data: { tokens: { accessToken: string; refreshToken: string } } }>(
      "/api/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }
    );
  },

  getMe: async (): Promise<{ success: boolean; data: { user: User } }> => {
    return request<{ success: boolean; data: { user: User } }>("/api/auth/me", {
      method: "GET",
    });
  },
};

export interface Resume {
  id: string;
  fileName: string;
  parsedSkills: string[];
  createdAt: string;
}

export interface InterviewSession {
  id: string;
  roleTitle: string;
  difficulty: "junior" | "intermediate" | "senior" | "lead";
  interviewType: "technical" | "behavioral" | "coding";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  score?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  resumeId?: string | null;
  resumeFileName?: string | null;
}

export interface CreateInterviewPayload {
  roleTitle: string;
  difficulty: "junior" | "intermediate" | "senior" | "lead";
  interviewType: "technical" | "behavioral" | "coding";
  resumeId?: string | null;
}

export const resumeApi = {
  getResumes: async (): Promise<{ success: boolean; data: { resumes: Resume[] } }> => {
    return request<{ success: boolean; data: { resumes: Resume[] } }>("/api/resumes", {
      method: "GET",
    });
  },

  uploadResume: async (file: File): Promise<{ success: boolean; message: string; data: { resume: Resume } }> => {
    const formData = new FormData();
    formData.append("resume", file);

    const token = tokenStorage.getAccessToken();
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}/api/resumes/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new ApiError(data?.message || "Failed to upload resume", response.status);
    }

    return data;
  },

  deleteResume: async (id: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/api/resumes/${id}`, {
      method: "DELETE",
    });
  },
};

export const interviewApi = {
  getInterviews: async (): Promise<{ success: boolean; data: { interviews: InterviewSession[] } }> => {
    return request<{ success: boolean; data: { interviews: InterviewSession[] } }>("/api/interviews", {
      method: "GET",
    });
  },

  createInterview: async (
    payload: CreateInterviewPayload
  ): Promise<{ success: boolean; message: string; data: { interview: InterviewSession } }> => {
    return request<{ success: boolean; message: string; data: { interview: InterviewSession } }>(
      "/api/interviews",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  getInterviewById: async (
    id: string
  ): Promise<{ success: boolean; data: { interview: InterviewSession } }> => {
    return request<{ success: boolean; data: { interview: InterviewSession } }>(`/api/interviews/${id}`, {
      method: "GET",
    });
  },
};
