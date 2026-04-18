export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  is_boss: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  image?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  name: string;
  password: string;
}
