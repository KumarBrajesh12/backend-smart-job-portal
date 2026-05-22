export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface AuthUser {
  id: string;
  role: UserRole;
}

export interface JwtTokenPayload {
  id: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
}
