export type MenuCategory = 'starters' | 'mains' | 'sides';

export interface PortionSize {
  id: 'medium' | 'large';
  name: string;
  grams: number;
  calories: number;
  surcharge: number;
  subtitle: string;
}

export type MenuTag = 'vegetarian' | 'chefs-pick';

export type SauceLevel = 'mild' | 'medium' | 'hot' | 'extra-hot';

export interface SauceOption {
  id: SauceLevel;
  name: string;
  description: string;
  intensity: number;
}

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  price: number;
  calories: number;
  image: string;
  accent: string;
  tags?: MenuTag[];
}

export interface BoxSelection {
  sizeId: PortionSize['id'];
  starterId?: string;
  mainId: string;
  sideId: string;
  omitStarter: boolean;
  boostTarget: 'main' | 'side';
}

export interface CartItem {
  id: string;
  selection: BoxSelection;
  quantity: number;
  unitPrice: number;
}

export interface CustomerDetails {
  fulfilment: 'delivery' | 'pickup';
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export interface OrderSummary {
  id: string;
  reference: string;
  itemCount: number;
  total: number;
  discountApplied: number;
  promoCode: string | null;
  status: string;
  createdAt: string;
}
