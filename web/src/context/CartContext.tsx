import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BoxSelection, CartItem, CustomerDetails, OrderSummary, MenuItem, PortionSize } from '../types/caribu';
import { menuItems, portionSizes } from '../data/menu';
import { supabase } from '../lib/supabase';

const BOOST_SURCHARGE = 2.5;

interface CartContextValue {
  selection: BoxSelection;
  cart: CartItem[];
  details: CustomerDetails;
  lastOrder: OrderSummary | null;
  boxStarted: boolean;

  size: PortionSize;
  starter: MenuItem | undefined;
  main: MenuItem | undefined;
  side: MenuItem | undefined;
  currentUnitPrice: number;
  cartCount: number;
  cartTotal: number;

  selectItem: (category: 'starters' | 'mains' | 'sides', itemId: string) => void;
  chooseSize: (sizeId: 'medium' | 'large') => void;
  setStarterOmission: (omit: boolean) => void;
  chooseBoostTarget: (target: 'main' | 'side') => void;
  addCurrentBoxToCart: () => void;
  updateQuantity: (itemId: string, delta: number) => void;
  removeItem: (itemId: string) => void;
  updateDetails: (d: Partial<CustomerDetails>) => void;
  submitOrder: () => Promise<void>;
  resetSelection: () => void;
}

const defaultSelection: BoxSelection = {
  sizeId: 'medium',
  starterId: undefined,
  mainId: '',
  sideId: '',
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

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<BoxSelection>(defaultSelection);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [details, setDetails] = useState<CustomerDetails>(defaultDetails);
  const [lastOrder, setLastOrder] = useState<OrderSummary | null>(null);
  const [boxStarted, setBoxStarted] = useState(false);

  const size = portionSizes.find(s => s.id === selection.sizeId) || portionSizes[0];
  const starter = menuItems.find(i => i.id === selection.starterId);
  const main = menuItems.find(i => i.id === selection.mainId);
  const side = menuItems.find(i => i.id === selection.sideId);

  const currentUnitPrice = (() => {
    let price = size.surcharge;
    if (!selection.omitStarter && starter) price += starter.price;
    if (selection.omitStarter) price += BOOST_SURCHARGE;
    if (main) price += main.price;
    if (side) price += side.price;
    return price;
  })();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const selectItem = useCallback((category: 'starters' | 'mains' | 'sides', itemId: string) => {
    setBoxStarted(true);
    if (category === 'starters') setSelection(s => ({ ...s, starterId: itemId }));
    else if (category === 'mains') setSelection(s => ({ ...s, mainId: itemId }));
    else setSelection(s => ({ ...s, sideId: itemId }));
  }, []);

  const chooseSize = useCallback((sizeId: 'medium' | 'large') => {
    setSelection(s => ({ ...s, sizeId }));
  }, []);

  const setStarterOmission = useCallback((omit: boolean) => {
    setSelection(s => ({ ...s, omitStarter: omit, starterId: omit ? undefined : s.starterId }));
  }, []);

  const chooseBoostTarget = useCallback((target: 'main' | 'side') => {
    setSelection(s => ({ ...s, boostTarget: target }));
  }, []);

  const addCurrentBoxToCart = useCallback(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setCart(prev => [...prev, { id, selection: { ...selection }, quantity: 1, unitPrice: currentUnitPrice }]);
    setSelection(defaultSelection);
    setBoxStarted(false);
  }, [selection, currentUnitPrice]);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateDetails = useCallback((d: Partial<CustomerDetails>) => {
    setDetails(prev => ({ ...prev, ...d }));
  }, []);

  const resetSelection = useCallback(() => {
    setSelection(defaultSelection);
    setBoxStarted(false);
  }, []);

  const submitOrder = useCallback(async () => {
    const reference = `CAR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const total = cartTotal;
    const itemCount = cartCount;
    const createdAt = new Date().toISOString();

    await supabase.from('orders').insert({
      reference,
      fulfilment: details.fulfilment,
      customer_name: details.name,
      customer_phone: details.phone,
      customer_address: details.address,
      notes: details.notes,
      items: cart,
      total,
      item_count: itemCount,
      status: 'pending',
    });

    setLastOrder({ reference, itemCount, total, createdAt });
    setCart([]);
    setDetails(defaultDetails);
  }, [cart, cartTotal, cartCount, details]);

  return (
    <CartContext.Provider
      value={{
        selection,
        cart,
        details,
        lastOrder,
        boxStarted,
        size,
        starter,
        main,
        side,
        currentUnitPrice,
        cartCount,
        cartTotal,
        selectItem,
        chooseSize,
        setStarterOmission,
        chooseBoostTarget,
        addCurrentBoxToCart,
        updateQuantity,
        removeItem,
        updateDetails,
        submitOrder,
        resetSelection,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
