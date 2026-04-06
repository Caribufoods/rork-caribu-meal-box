import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { AuthUser, AuthProvider as AuthProviderType, SignUpData, SignInData } from '@/types/auth';

const AUTH_STORAGE_KEY = 'caribu_auth_user';

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CAR-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function upsertProfile(user: AuthUser): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      provider: user.provider,
      referral_code: user.referralCode,
      status: 'active',
      order_count: 0,
      total_spent: 0,
      last_active: new Date().toISOString(),
      created_at: user.createdAt,
    }, { onConflict: 'id' });
    if (error) {
      console.log('[Auth] Supabase upsert error (non-blocking):', error.message);
    } else {
      console.log('[Auth] Profile synced to Supabase:', user.email);
    }
  } catch (e) {
    console.log('[Auth] Supabase sync failed (non-blocking):', e);
  }
}

async function deleteProfileFromSupabase(userId: string): Promise<void> {
  try {
    await supabase.from('selected_promotions').delete().eq('user_id', userId);
    await supabase.from('promotions').delete().eq('user_id', userId);
    await supabase.from('orders').update({ status: 'cancelled' }).eq('user_id', userId);
    await supabase.from('profiles').update({ status: 'deleted' }).eq('id', userId);
    console.log('[Auth] Profile marked deleted in Supabase:', userId);
  } catch (e) {
    console.log('[Auth] Supabase delete failed (non-blocking):', e);
  }
}

export const [AuthContextProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);

  const authQuery = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      console.log('[Auth] Loading stored user');
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        console.log('[Auth] Found stored user:', parsed.email);
        void upsertProfile(parsed);
        return parsed;
      }
      return null;
    },
  });

  useEffect(() => {
    if (authQuery.data !== undefined) {
      setUser(authQuery.data);
    }
  }, [authQuery.data]);

  const persistUser = useCallback(async (userData: AuthUser | null) => {
    if (userData) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      void upsertProfile(userData);
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
    return userData;
  }, []);

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      console.log('[Auth] Signing up with email:', data.email);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const newUser: AuthUser = {
        id: generateId(),
        name: data.name,
        email: data.email,
        provider: 'email',
        referralCode: generateReferralCode(),
        createdAt: new Date().toISOString(),
      };
      await persistUser(newUser);
      return newUser;
    },
    onSuccess: (newUser) => {
      setUser(newUser);
      queryClient.setQueryData(['auth-user'], newUser);
      console.log('[Auth] Sign up successful:', newUser.email);
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (data: SignInData) => {
      console.log('[Auth] Signing in with email:', data.email);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const existing = JSON.parse(stored) as AuthUser;
        if (existing.email === data.email) {
          return existing;
        }
      }
      const existingUser: AuthUser = {
        id: generateId(),
        name: data.email.split('@')[0] ?? 'User',
        email: data.email,
        provider: 'email',
        referralCode: generateReferralCode(),
        createdAt: new Date().toISOString(),
      };
      await persistUser(existingUser);
      return existingUser;
    },
    onSuccess: (loggedInUser) => {
      setUser(loggedInUser);
      queryClient.setQueryData(['auth-user'], loggedInUser);
      console.log('[Auth] Sign in successful:', loggedInUser.email);
    },
  });

  const socialSignInMutation = useMutation({
    mutationFn: async (provider: AuthProviderType) => {
      console.log('[Auth] Social sign in with:', provider);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const providerNames: Record<AuthProviderType, string> = {
        google: 'Google User',
        apple: 'Apple User',
        facebook: 'Facebook User',
        email: 'User',
      };
      const providerEmails: Record<AuthProviderType, string> = {
        google: 'user@gmail.com',
        apple: 'user@icloud.com',
        facebook: 'user@facebook.com',
        email: 'user@email.com',
      };
      const newUser: AuthUser = {
        id: generateId(),
        name: providerNames[provider],
        email: providerEmails[provider],
        provider,
        referralCode: generateReferralCode(),
        createdAt: new Date().toISOString(),
      };
      await persistUser(newUser);
      return newUser;
    },
    onSuccess: (newUser) => {
      setUser(newUser);
      queryClient.setQueryData(['auth-user'], newUser);
      console.log('[Auth] Social sign in successful:', newUser.provider);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Signing out');
      await persistUser(null);
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['auth-user'], null);
      console.log('[Auth] Sign out successful');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Deleting account for user:', user?.id);
      if (user) {
        await deleteProfileFromSupabase(user.id);
        await AsyncStorage.removeItem(`caribu_promotions_${user.id}`);
        await AsyncStorage.removeItem(`caribu_selected_promo_${user.id}`);
        await AsyncStorage.removeItem(`caribu_admin_users`);
      }
      await persistUser(null);
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      console.log('[Auth] Account deleted successfully');
    },
  });

  const isLoggedIn = user !== null;
  const isLoading = authQuery.isLoading;

  return useMemo(
    () => ({
      user,
      isLoggedIn,
      isLoading,
      signUp: signUpMutation.mutateAsync,
      signIn: signInMutation.mutateAsync,
      socialSignIn: socialSignInMutation.mutateAsync,
      signOut: signOutMutation.mutateAsync,
      deleteAccount: deleteAccountMutation.mutateAsync,
      isSigningUp: signUpMutation.isPending,
      isSigningIn: signInMutation.isPending,
      isSocialSigningIn: socialSignInMutation.isPending,
      isDeletingAccount: deleteAccountMutation.isPending,
    }),
    [
      user,
      isLoggedIn,
      isLoading,
      signUpMutation.mutateAsync,
      signInMutation.mutateAsync,
      socialSignInMutation.mutateAsync,
      signOutMutation.mutateAsync,
      deleteAccountMutation.mutateAsync,
      signUpMutation.isPending,
      signInMutation.isPending,
      socialSignInMutation.isPending,
      deleteAccountMutation.isPending,
    ],
  );
});
