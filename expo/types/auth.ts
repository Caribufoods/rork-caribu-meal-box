export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: 'email' | 'google' | 'apple' | 'facebook';
  referralCode: string;
  createdAt: string;
}

export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}
