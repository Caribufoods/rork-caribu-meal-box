import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { menuItems, portionSizes } from '@/mocks/caribu-menu';
import { BoxSelection, CartItem, CustomerDetails, MenuCategory, OrderSummary } from '@/types/caribu';

const starters = menuItems.filter((item) => item.category === 'starters');
const mains = menuItems.filter((item) => item.category === 'mains');
const sides = menuItems.filter((item) => item.category === 'sides');

const defaultSelection: BoxSelection = {
  sizeId: 'medium',
  starterId: starters[0]?.id,
  mainId: mains[0]?.id ?? '',
  sideId: sides[0]?.id ?? '',
  omitStarter: false,
  boostTarget: 'main',
};

const defaultDetails: CustomerDetails = {
  fulfilment: 'delivery',
  name: '',
  phone: '',
  address: '',
  notes: '',
};

const BOOST_SURCHARGE = 2.5;
const ORDER_HISTORY_KEY = 'caribu_order_history';

async function syncOrderToSupabase(
  order: OrderSummary,
  userId: string,
  userName: string,
  userEmail: string,
  discountApplied: number,
  promoCode: string | null,
): Promise<void> {
  try {
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      reference: order.reference,
      item_count: order.itemCount,
      total: order.total,
      discount_applied: discountApplied,
      promo_code: promoCode,
      status: order.status ?? 'pending',
      created_at: order.createdAt,
    }, { onConflict: 'id' });
    if (error) {
      console.log('[Caribu] Supabase order sync error:', error.message);
    } else {
      console.log('[Caribu] Order synced to Supabase:', order.reference);
    }
  } catch (e) {
    console.log('[Caribu] Supabase order sync failed:', e);
  }
}

async function updateProfileStatsInSupabase(
  userId: string,
  orderTotal: number,
): Promise<void> {
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('order_count, total_spent')
      .eq('id', userId)
      .single();
    if (fetchError) {
      console.log('[Caribu] Profile stats fetch error:', fetchError.message);
      return;
    }
    const currentCount = (data?.order_count as number) ?? 0;
    const currentSpent = Number(data?.total_spent) || 0;
    const { error } = await supabase.from('profiles').update({
      order_count: currentCount + 1,
      total_spent: currentSpent + orderTotal,
      last_active: new Date().toISOString(),
    }).eq('id', userId);
    if (error) {
      console.log('[Caribu] Profile stats update error:', error.message);
    } else {
      console.log('[Caribu] Profile stats updated — orders:', currentCount + 1, 'spent:', currentSpent + orderTotal);
    }
  } catch (e) {
    console.log('[Caribu] Profile stats update failed:', e);
  }
}

async function fetchOrderHistoryFromSupabase(userId: string): Promise<OrderSummary[] | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.log('[Caribu] Supabase order history fetch error:', error.message);
      return null;
    }
    if (data && data.length > 0) {
      return data.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        reference: row.reference as string,
        itemCount: (row.item_count as number) ?? 0,
        total: Number(row.total) || 0,
        discountApplied: Number(row.discount_applied) || 0,
        promoCode: (row.promo_code as string) ?? null,
        status: (row.status as string) ?? 'pending',
        createdAt: row.created_at as string,
      }));
    }
    return null;
  } catch (e) {
    console.log('[Caribu] Supabase order history fetch failed:', e);
    return null;
  }
}

function calculateUnitPrice(selection: BoxSelection) {
  const size = portionSizes.find((item) => item.id === selection.sizeId);
  const starter = selection.omitStarter ? undefined : menuItems.find((item) => item.id === selection.starterId);
  const main = menuItems.find((item) => item.id === selection.mainId);
  const side = menuItems.find((item) => item.id === selection.sideId);

  let total = (starter?.price ?? 0) + (main?.price ?? 0) + (side?.price ?? 0) + (size?.surcharge ?? 0);
  if (selection.omitStarter) {
    total += BOOST_SURCHARGE;
  }
  return total;
}

function getBoostPriceForItem(basePrice: number): number {
  return basePrice + BOOST_SURCHARGE;
}

export const [CaribuProvider, useCaribu] = createContextHook(() => {
  const { user, isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const [selection, setSelection] = useState<BoxSelection>(defaultSelection);
  const [boxStarted, setBoxStarted] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [details, setDetails] = useState<CustomerDetails>(defaultDetails);
  const [lastOrder, setLastOrder] = useState<OrderSummary | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderSummary[]>([]);

  const orderHistoryQuery = useQuery({
    queryKey: ['order-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('[Caribu] Loading order history for user:', user.id);
      const supabaseOrders = await fetchOrderHistoryFromSupabase(user.id);
      if (supabaseOrders && supabaseOrders.length > 0) {
        console.log('[Caribu] Loaded', supabaseOrders.length, 'orders from Supabase');
        await AsyncStorage.setItem(`${ORDER_HISTORY_KEY}_${user.id}`, JSON.stringify(supabaseOrders));
        return supabaseOrders;
      }
      const stored = await AsyncStorage.getItem(`${ORDER_HISTORY_KEY}_${user.id}`);
      if (stored) {
        return JSON.parse(stored) as OrderSummary[];
      }
      return [] as OrderSummary[];
    },
    enabled: isLoggedIn,
  });

  useEffect(() => {
    if (orderHistoryQuery.data) {
      setOrderHistory(orderHistoryQuery.data);
    }
  }, [orderHistoryQuery.data]);

  useEffect(() => {
    if (!isLoggedIn) {
      setOrderHistory([]);
    }
  }, [isLoggedIn]);

  const size = useMemo(() => portionSizes.find((item) => item.id === selection.sizeId) ?? portionSizes[0], [selection.sizeId]);
  const starter = useMemo(
    () => (selection.omitStarter ? undefined : menuItems.find((item) => item.id === selection.starterId)),
    [selection.omitStarter, selection.starterId],
  );
  const main = useMemo(() => menuItems.find((item) => item.id === selection.mainId), [selection.mainId]);
  const side = useMemo(() => menuItems.find((item) => item.id === selection.sideId), [selection.sideId]);

  const currentUnitPrice = useMemo(() => calculateUnitPrice(selection), [selection]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [cart]);

  const selectItem = useCallback((category: MenuCategory, itemId: string) => {
    console.log('[Caribu] Selecting menu item', { category, itemId });
    void Haptics.selectionAsync();
    setBoxStarted(true);
    setSelection((current) => {
      if (category === 'starters') {
        return { ...current, starterId: itemId };
      }
      if (category === 'mains') {
        return { ...current, mainId: itemId };
      }
      return { ...current, sideId: itemId };
    });
  }, []);

  const chooseSize = useCallback((sizeId: BoxSelection['sizeId']) => {
    console.log('[Caribu] Choosing portion size', { sizeId });
    void Haptics.selectionAsync();
    setBoxStarted(true);
    setSelection((current) => ({ ...current, sizeId }));
  }, []);

  const setStarterOmission = useCallback((omitStarter: boolean) => {
    console.log('[Caribu] Updating omit starter', { omitStarter });
    void Haptics.selectionAsync();
    setSelection((current) => ({
      ...current,
      omitStarter,
      starterId: omitStarter ? current.starterId : current.starterId ?? starters[0]?.id,
    }));
  }, []);

  const chooseBoostTarget = useCallback((boostTarget: 'main' | 'side') => {
    console.log('[Caribu] Choosing boost target', { boostTarget });
    void Haptics.selectionAsync();
    setSelection((current) => ({ ...current, boostTarget }));
  }, []);

  const addCurrentBoxToCart = useCallback(() => {
    const nextItem: CartItem = {
      id: `${Date.now()}`,
      selection,
      quantity: 1,
      unitPrice: currentUnitPrice,
    };

    console.log('[Caribu] Adding box to cart', nextItem);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCart((current) => [nextItem, ...current]);
  }, [currentUnitPrice, selection]);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    console.log('[Caribu] Updating cart quantity', { itemId, delta });
    void Haptics.selectionAsync();
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          return {
            ...item,
            quantity: Math.max(0, item.quantity + delta),
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    console.log('[Caribu] Removing cart item', { itemId });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCart((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const updateDetails = useCallback((nextDetails: CustomerDetails) => {
    console.log('[Caribu] Updating customer details', { fulfilment: nextDetails.fulfilment, name: nextDetails.name });
    setDetails(nextDetails);
  }, []);

  const submitOrder = useCallback((discountApplied?: number, promoCode?: string | null) => {
    const reference = `CAR-${Math.floor(Date.now() % 1000000).toString().padStart(6, '0')}`;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const finalTotal = discountApplied ? Math.max(0, cartTotal - discountApplied) : cartTotal;
    const summary: OrderSummary = {
      id: orderId,
      reference,
      itemCount: cartCount,
      total: finalTotal,
      discountApplied: discountApplied ?? 0,
      promoCode: promoCode ?? null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    console.log('[Caribu] Submitting order', summary);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLastOrder(summary);
    setOrderHistory((current) => [summary, ...current]);
    setCart([]);

    if (user) {
      void syncOrderToSupabase(
        summary,
        user.id,
        user.name,
        user.email,
        discountApplied ?? 0,
        promoCode ?? null,
      );
      void updateProfileStatsInSupabase(user.id, finalTotal);
      void AsyncStorage.setItem(
        `${ORDER_HISTORY_KEY}_${user.id}`,
        JSON.stringify([summary, ...orderHistory]),
      );
      queryClient.invalidateQueries({ queryKey: ['order-history', user.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  }, [cartCount, cartTotal, user, orderHistory, queryClient]);

  const boostSurcharge = BOOST_SURCHARGE;

  return useMemo(
    () => ({
      menuItems,
      portionSizes,
      selection,
      boxStarted,
      size,
      starter,
      main,
      side,
      currentUnitPrice,
      boostSurcharge,
      getBoostPriceForItem,
      cart,
      cartCount,
      cartTotal,
      details,
      lastOrder,
      orderHistory,
      selectItem,
      chooseSize,
      setStarterOmission,
      chooseBoostTarget,
      addCurrentBoxToCart,
      updateQuantity,
      removeItem,
      updateDetails,
      submitOrder,
    }),
    [
      addCurrentBoxToCart,
      boostSurcharge,
      boxStarted,
      cart,
      cartCount,
      cartTotal,
      chooseBoostTarget,
      chooseSize,
      currentUnitPrice,
      details,
      lastOrder,
      orderHistory,
      main,
      removeItem,
      selectItem,
      selection,
      setStarterOmission,
      side,
      size,
      starter,
      submitOrder,
      updateDetails,
      updateQuantity,
    ],
  );
});
