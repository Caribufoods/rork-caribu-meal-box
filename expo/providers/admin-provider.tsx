import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { AdminUser, AdminOrder, AdminStats } from '@/types/admin';

const ADMIN_USERS_KEY = 'caribu_admin_users';
const ADMIN_ORDERS_KEY = 'caribu_admin_orders';
const ADMIN_PIN = '1234';

async function fetchUsersFromSupabase(): Promise<AdminUser[] | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('[Admin] Supabase users fetch error:', error.message);
      return null;
    }
    if (data && data.length > 0) {
      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        provider: (row.provider as string) as AdminUser['provider'],
        referralCode: (row.referral_code as string) ?? '',
        createdAt: row.created_at as string,
        status: (row.status as string) as AdminUser['status'],
        orderCount: (row.order_count as number) ?? 0,
        totalSpent: Number(row.total_spent) || 0,
        lastActive: (row.last_active as string) ?? row.created_at as string,
      }));
    }
    return null;
  } catch (e) {
    console.log('[Admin] Supabase users fetch failed:', e);
    return null;
  }
}

async function fetchOrdersFromSupabase(): Promise<AdminOrder[] | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.log('[Admin] Supabase orders fetch error:', error.message);
      return null;
    }
    if (data && data.length > 0) {
      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        userName: row.user_name as string,
        userEmail: row.user_email as string,
        reference: row.reference as string,
        itemCount: (row.item_count as number) ?? 0,
        total: Number(row.total) || 0,
        discountApplied: Number(row.discount_applied) || 0,
        promoCode: (row.promo_code as string) ?? null,
        status: (row.status as string) as AdminOrder['status'],
        createdAt: row.created_at as string,
      }));
    }
    return null;
  } catch (e) {
    console.log('[Admin] Supabase orders fetch failed:', e);
    return null;
  }
}

async function upsertOrderToSupabase(order: AdminOrder): Promise<void> {
  try {
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      user_id: order.userId,
      user_name: order.userName,
      user_email: order.userEmail,
      reference: order.reference,
      item_count: order.itemCount,
      total: order.total,
      discount_applied: order.discountApplied,
      promo_code: order.promoCode,
      status: order.status,
      created_at: order.createdAt,
    }, { onConflict: 'id' });
    if (error) {
      console.log('[Admin] Supabase order upsert error:', error.message);
    } else {
      console.log('[Admin] Order synced to Supabase:', order.reference);
    }
  } catch (e) {
    console.log('[Admin] Supabase order sync failed:', e);
  }
}

async function updateOrderStatusInSupabase(orderId: string, status: string): Promise<void> {
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      console.log('[Admin] Supabase order status update error:', error.message);
    }
  } catch (e) {
    console.log('[Admin] Supabase order status update failed:', e);
  }
}

async function markUserDeletedInSupabase(userId: string): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').update({ status: 'deleted' }).eq('id', userId);
    if (error) {
      console.log('[Admin] Supabase user delete error:', error.message);
    }
  } catch (e) {
    console.log('[Admin] Supabase user delete failed:', e);
  }
}

export const [AdminProvider, useAdmin] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log('[Admin] Loading users');
      const supabaseUsers = await fetchUsersFromSupabase();
      if (supabaseUsers && supabaseUsers.length > 0) {
        console.log('[Admin] Loaded', supabaseUsers.length, 'users from Supabase');
        await AsyncStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(supabaseUsers));
        return supabaseUsers;
      }
      const stored = await AsyncStorage.getItem(ADMIN_USERS_KEY);
      if (stored) {
        return JSON.parse(stored) as AdminUser[];
      }
      return [] as AdminUser[];
    },
    enabled: isAdminAuthenticated,
  });

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      console.log('[Admin] Loading orders');
      const supabaseOrders = await fetchOrdersFromSupabase();
      if (supabaseOrders && supabaseOrders.length > 0) {
        console.log('[Admin] Loaded', supabaseOrders.length, 'orders from Supabase');
        await AsyncStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(supabaseOrders));
        return supabaseOrders;
      }
      const stored = await AsyncStorage.getItem(ADMIN_ORDERS_KEY);
      if (stored) {
        return JSON.parse(stored) as AdminOrder[];
      }
      return [] as AdminOrder[];
    },
    enabled: isAdminAuthenticated,
  });

  useEffect(() => {
    if (usersQuery.data) {
      setUsers(usersQuery.data);
    }
  }, [usersQuery.data]);

  useEffect(() => {
    if (ordersQuery.data) {
      setOrders(ordersQuery.data);
    }
  }, [ordersQuery.data]);

  useEffect(() => {
    if (user) {
      const adminUser: AdminUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
        status: 'active',
        orderCount: 0,
        totalSpent: 0,
        lastActive: new Date().toISOString(),
      };
      void registerUserMutation.mutateAsync(adminUser).catch(() => {
        console.log('[Admin] Failed to auto-register user');
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const authenticateAdmin = useCallback((pin: string): boolean => {
    console.log('[Admin] Attempting admin authentication');
    if (pin === ADMIN_PIN) {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
  }, []);

  const registerUserMutation = useMutation({
    mutationFn: async (newUser: AdminUser) => {
      console.log('[Admin] Registering user in admin:', newUser.email);
      const current = await AsyncStorage.getItem(ADMIN_USERS_KEY);
      const existing = current ? (JSON.parse(current) as AdminUser[]) : [];
      const alreadyExists = existing.some((u) => u.id === newUser.id);
      if (alreadyExists) {
        return existing;
      }
      const updated = [newUser, ...existing];
      await AsyncStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      setUsers(updated);
      queryClient.setQueryData(['admin-users'], updated);
    },
  });

  const recordOrderMutation = useMutation({
    mutationFn: async (order: AdminOrder) => {
      console.log('[Admin] Recording order:', order.reference);
      void upsertOrderToSupabase(order);
      const current = await AsyncStorage.getItem(ADMIN_ORDERS_KEY);
      const existing = current ? (JSON.parse(current) as AdminOrder[]) : [];
      const updated = [order, ...existing];
      await AsyncStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      setOrders(updated);
      queryClient.setQueryData(['admin-orders'], updated);
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: AdminOrder['status'] }) => {
      console.log('[Admin] Updating order status:', orderId, status);
      void updateOrderStatusInSupabase(orderId, status);
      const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      await AsyncStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      setOrders(updated);
      queryClient.setQueryData(['admin-orders'], updated);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('[Admin] Marking user as deleted:', userId);
      void markUserDeletedInSupabase(userId);
      const updated = users.map((u) =>
        u.id === userId ? { ...u, status: 'deleted' as const } : u,
      );
      await AsyncStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (updated) => {
      setUsers(updated);
      queryClient.setQueryData(['admin-users'], updated);
    },
  });

  const stats: AdminStats = useMemo(() => {
    const activeUsers = users.filter((u) => u.status === 'active');
    const completedOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const promoRedemptions = completedOrders.filter((o) => o.promoCode !== null).length;
    const referralUsers = users.filter((u) => u.provider === 'email');

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      promoRedemptions,
      referralCount: Math.max(0, referralUsers.length - 1),
    };
  }, [users, orders]);

  const exportData = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      stats,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        provider: u.provider,
        status: u.status,
        orderCount: u.orderCount,
        totalSpent: u.totalSpent,
        createdAt: u.createdAt,
        lastActive: u.lastActive,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        reference: o.reference,
        userName: o.userName,
        userEmail: o.userEmail,
        itemCount: o.itemCount,
        total: o.total,
        discountApplied: o.discountApplied,
        promoCode: o.promoCode,
        status: o.status,
        createdAt: o.createdAt,
      })),
    };
    console.log('[Admin] Export data:', JSON.stringify(data, null, 2));
    return JSON.stringify(data, null, 2);
  }, [stats, users, orders]);

  return useMemo(
    () => ({
      isAdminAuthenticated,
      users,
      orders,
      stats,
      authenticateAdmin,
      logoutAdmin,
      registerUser: registerUserMutation.mutateAsync,
      recordOrder: recordOrderMutation.mutateAsync,
      updateOrderStatus: updateOrderStatusMutation.mutateAsync,
      deleteUser: deleteUserMutation.mutateAsync,
      exportData,
      isLoading: usersQuery.isLoading || ordersQuery.isLoading,
    }),
    [
      isAdminAuthenticated,
      users,
      orders,
      stats,
      authenticateAdmin,
      logoutAdmin,
      registerUserMutation.mutateAsync,
      recordOrderMutation.mutateAsync,
      updateOrderStatusMutation.mutateAsync,
      deleteUserMutation.mutateAsync,
      exportData,
      usersQuery.isLoading,
      ordersQuery.isLoading,
    ],
  );
});
