export type PromotionType = 'signup' | 'referral' | 'social';
export type PromotionStatus = 'available' | 'used' | 'locked';

export interface Promotion {
  id: string;
  type: PromotionType;
  title: string;
  description: string;
  discountPercent: number;
  status: PromotionStatus;
  code: string;
}

export interface ReferralInfo {
  code: string;
  totalReferrals: number;
  pendingRewards: number;
}
