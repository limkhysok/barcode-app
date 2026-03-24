export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
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
