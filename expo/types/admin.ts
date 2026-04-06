import type { AuthUser } from './auth';

export interface AdminUser extends AuthUser {
  status: 'active' | 'deleted';
  orderCount: number;
  totalSpent: number;
  lastActive: string;
}

export interface AdminOrder {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reference: string;
  itemCount: number;
  total: number;
  discountApplied: number;
  promoCode: string | null;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  promoRedemptions: number;
  referralCount: number;
}
