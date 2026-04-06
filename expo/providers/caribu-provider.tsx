import createContextHook from '@nkzw/create-context-hook';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';

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
  const [selection, setSelection] = useState<BoxSelection>(defaultSelection);
  const [boxStarted, setBoxStarted] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [details, setDetails] = useState<CustomerDetails>(defaultDetails);
  const [lastOrder, setLastOrder] = useState<OrderSummary | null>(null);

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

  const submitOrder = useCallback(() => {
    const reference = `CAR-${Math.floor(Date.now() % 1000000).toString().padStart(6, '0')}`;
    const summary: OrderSummary = {
      reference,
      itemCount: cartCount,
      total: cartTotal,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    console.log('[Caribu] Submitting order', summary);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLastOrder(summary);
    setCart([]);
  }, [cartCount, cartTotal]);

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
