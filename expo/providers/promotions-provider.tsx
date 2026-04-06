import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import type { Promotion, PromotionStatus } from '@/types/promotions';

const PROMOS_STORAGE_KEY = 'caribu_promotions';
const SELECTED_PROMO_KEY = 'caribu_selected_promo';

function buildDefaultPromotions(userId: string): Promotion[] {
  return [
    {
      id: `signup_${userId}`,
      type: 'signup',
      title: 'Welcome Bonus',
      description: 'Thanks for joining Caribu! Enjoy 20% off your first order.',
      discountPercent: 20,
      status: 'available',
      code: `WELCOME20_${userId.slice(-6).toUpperCase()}`,
    },
    {
      id: `referral_${userId}`,
      type: 'referral',
      title: 'Referral Reward',
      description: 'Share your QR code — when a friend signs up, you get 25% off.',
      discountPercent: 25,
      status: 'locked',
      code: `REFER25_${userId.slice(-6).toUpperCase()}`,
    },
    {
      id: `social_${userId}`,
      type: 'social',
      title: 'Social Follow',
      description: 'Follow us on Instagram or TikTok and unlock 10% off.',
      discountPercent: 10,
      status: 'locked',
      code: `SOCIAL10_${userId.slice(-6).toUpperCase()}`,
    },
  ];
}

async function syncPromosToSupabase(userId: string, promos: Promotion[]): Promise<void> {
  try {
    const rows = promos.map((p) => ({
      id: p.id,
      user_id: userId,
      type: p.type,
      title: p.title,
      description: p.description,
      discount_percent: p.discountPercent,
      status: p.status,
      code: p.code,
    }));
    const { error } = await supabase.from('promotions').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.log('[Promos] Supabase sync error (non-blocking):', error.message);
    } else {
      console.log('[Promos] Synced to Supabase for user:', userId);
    }
  } catch (e) {
    console.log('[Promos] Supabase sync failed (non-blocking):', e);
  }
}

async function syncSelectedPromoToSupabase(userId: string, promoId: string | null): Promise<void> {
  try {
    if (promoId) {
      const { error } = await supabase.from('selected_promotions').upsert({
        user_id: userId,
        promo_id: promoId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) {
        console.log('[Promos] Supabase selected sync error:', error.message);
      }
    } else {
      await supabase.from('selected_promotions').delete().eq('user_id', userId);
    }
  } catch (e) {
    console.log('[Promos] Supabase selected sync failed:', e);
  }
}

export const [PromotionsProvider, usePromotions] = createContextHook(() => {
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);

  const promosQuery = useQuery({
    queryKey: ['promotions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('[Promos] Loading promotions for user:', user.id);
      const stored = await AsyncStorage.getItem(`${PROMOS_STORAGE_KEY}_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Promotion[];
        void syncPromosToSupabase(user.id, parsed);
        return parsed;
      }
      const defaults = buildDefaultPromotions(user.id);
      await AsyncStorage.setItem(`${PROMOS_STORAGE_KEY}_${user.id}`, JSON.stringify(defaults));
      void syncPromosToSupabase(user.id, defaults);
      console.log('[Promos] Created default promotions');
      return defaults;
    },
    enabled: isLoggedIn,
  });

  const selectedQuery = useQuery({
    queryKey: ['selected-promo', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const stored = await AsyncStorage.getItem(`${SELECTED_PROMO_KEY}_${user.id}`);
      return stored ?? null;
    },
    enabled: isLoggedIn,
  });

  useEffect(() => {
    if (promosQuery.data) {
      setPromotions(promosQuery.data);
    }
  }, [promosQuery.data]);

  useEffect(() => {
    if (selectedQuery.data !== undefined) {
      setSelectedPromoId(selectedQuery.data);
    }
  }, [selectedQuery.data]);

  useEffect(() => {
    if (!isLoggedIn) {
      setPromotions([]);
      setSelectedPromoId(null);
    }
  }, [isLoggedIn]);

  const persistPromotions = useCallback(async (promos: Promotion[]) => {
    if (!user) return;
    await AsyncStorage.setItem(`${PROMOS_STORAGE_KEY}_${user.id}`, JSON.stringify(promos));
    void syncPromosToSupabase(user.id, promos);
  }, [user]);

  const selectPromoMutation = useMutation({
    mutationFn: async (promoId: string | null) => {
      if (!user) return null;
      console.log('[Promos] Selecting promotion:', promoId);
      if (promoId) {
        await AsyncStorage.setItem(`${SELECTED_PROMO_KEY}_${user.id}`, promoId);
      } else {
        await AsyncStorage.removeItem(`${SELECTED_PROMO_KEY}_${user.id}`);
      }
      void syncSelectedPromoToSupabase(user.id, promoId);
      return promoId;
    },
    onSuccess: (promoId) => {
      setSelectedPromoId(promoId);
      queryClient.setQueryData(['selected-promo', user?.id], promoId);
    },
  });

  const unlockReferralMutation = useMutation({
    mutationFn: async () => {
      console.log('[Promos] Unlocking referral reward');
      const updated = promotions.map((p) =>
        p.type === 'referral' && p.status === 'locked'
          ? { ...p, status: 'available' as PromotionStatus }
          : p,
      );
      setPromotions(updated);
      await persistPromotions(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['promotions', user?.id], updated);
    },
  });

  const unlockSocialMutation = useMutation({
    mutationFn: async () => {
      console.log('[Promos] Unlocking social follow reward');
      const updated = promotions.map((p) =>
        p.type === 'social' && p.status === 'locked'
          ? { ...p, status: 'available' as PromotionStatus }
          : p,
      );
      setPromotions(updated);
      await persistPromotions(updated);
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['promotions', user?.id], updated);
    },
  });

  const usePromotionMutation = useMutation({
    mutationFn: async (promoId: string) => {
      console.log('[Promos] Marking promotion as used:', promoId);
      const updated = promotions.map((p) =>
        p.id === promoId ? { ...p, status: 'used' as PromotionStatus } : p,
      );
      setPromotions(updated);
      await persistPromotions(updated);
      if (selectedPromoId === promoId) {
        setSelectedPromoId(null);
        if (user) {
          await AsyncStorage.removeItem(`${SELECTED_PROMO_KEY}_${user.id}`);
          void syncSelectedPromoToSupabase(user.id, null);
        }
      }
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['promotions', user?.id], updated);
      if (selectedPromoId) {
        queryClient.setQueryData(['selected-promo', user?.id], null);
      }
    },
  });

  const selectedPromotion = useMemo(() => {
    if (!selectedPromoId) return null;
    return promotions.find((p) => p.id === selectedPromoId && p.status === 'available') ?? null;
  }, [selectedPromoId, promotions]);

  const availablePromotions = useMemo(
    () => promotions.filter((p) => p.status === 'available'),
    [promotions],
  );

  const discountPercent = selectedPromotion?.discountPercent ?? 0;

  return useMemo(
    () => ({
      promotions,
      selectedPromoId,
      selectedPromotion,
      availablePromotions,
      discountPercent,
      selectPromo: selectPromoMutation.mutateAsync,
      unlockReferral: unlockReferralMutation.mutateAsync,
      unlockSocial: unlockSocialMutation.mutateAsync,
      markPromoUsed: usePromotionMutation.mutateAsync,
      isLoading: promosQuery.isLoading,
    }),
    [
      promotions,
      selectedPromoId,
      selectedPromotion,
      availablePromotions,
      discountPercent,
      selectPromoMutation.mutateAsync,
      unlockReferralMutation.mutateAsync,
      unlockSocialMutation.mutateAsync,
      usePromotionMutation.mutateAsync,
      promosQuery.isLoading,
    ],
  );
});
