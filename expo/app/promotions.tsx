import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gift,
  Users,
  Instagram,
  QrCode,
  Check,
  Lock,
  CircleCheck as CheckCircle2,
  Tag,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { caribuTheme } from '@/constants/caribu-theme';
import { useAuth } from '@/providers/auth-provider';
import { usePromotions } from '@/providers/promotions-provider';
import type { Promotion } from '@/types/promotions';

const PROMO_ICONS: Record<string, React.ReactNode> = {
  signup: <Gift color={caribuTheme.forest} size={22} />,
  referral: <Users color={caribuTheme.gold} size={22} />,
  social: <Instagram color="#E1306C" size={22} />,
};

const PROMO_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  signup: { bg: '#F0F7F2', border: '#D4E8DA', badge: caribuTheme.forest },
  referral: { bg: '#FBF6ED', border: '#EDE0C8', badge: caribuTheme.gold },
  social: { bg: '#FDF0F5', border: '#F5D5E0', badge: '#E1306C' },
};

function PromoCard({
  promo,
  isSelected,
  onSelect,
  onAction,
}: {
  promo: Promotion;
  isSelected: boolean;
  onSelect: () => void;
  onAction?: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colors = PROMO_COLORS[promo.type] ?? PROMO_COLORS.signup;

  const handlePress = () => {
    if (promo.status === 'used') return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    if (promo.status === 'locked' && onAction) {
      onAction();
    } else if (promo.status === 'available') {
      void Haptics.selectionAsync();
      onSelect();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.promoCard,
          { backgroundColor: colors.bg, borderColor: isSelected ? colors.badge : colors.border },
          isSelected && styles.promoCardSelected,
          promo.status === 'used' && styles.promoCardUsed,
        ]}
        testID={`promo-card-${promo.type}`}
      >
        <View style={styles.promoCardTop}>
          <View style={[styles.promoIconWrap, { backgroundColor: colors.bg }]}>
            {PROMO_ICONS[promo.type]}
          </View>
          <View style={styles.promoCardInfo}>
            <Text style={[styles.promoTitle, promo.status === 'used' && styles.promoTitleUsed]}>
              {promo.title}
            </Text>
            <Text style={styles.promoDesc}>{promo.description}</Text>
          </View>
        </View>

        <View style={styles.promoCardBottom}>
          <View style={[styles.discountBadge, { backgroundColor: colors.badge }]}>
            <Text style={styles.discountBadgeText}>{promo.discountPercent}% OFF</Text>
          </View>

          {promo.status === 'available' && !isSelected && (
            <View style={styles.statusPill}>
              <Tag color={caribuTheme.forest} size={13} />
              <Text style={[styles.statusText, { color: caribuTheme.forest }]}>Available</Text>
            </View>
          )}
          {promo.status === 'available' && isSelected && (
            <View style={[styles.statusPill, styles.statusPillActive]}>
              <CheckCircle2 color={caribuTheme.white} size={13} />
              <Text style={[styles.statusText, { color: caribuTheme.white }]}>Selected</Text>
            </View>
          )}
          {promo.status === 'locked' && (
            <Pressable
              onPress={onAction}
              style={({ pressed }) => [styles.unlockBtn, pressed && styles.unlockBtnPressed]}
            >
              <Lock color={caribuTheme.muted} size={13} />
              <Text style={styles.unlockText}>Unlock</Text>
              <ChevronRight color={caribuTheme.muted} size={13} />
            </Pressable>
          )}
          {promo.status === 'used' && (
            <View style={[styles.statusPill, styles.statusPillUsed]}>
              <Check color={caribuTheme.muted} size={13} />
              <Text style={[styles.statusText, { color: caribuTheme.muted }]}>Used</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PromotionsScreen() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { promotions, selectedPromoId, selectPromo, unlockReferral, unlockSocial } = usePromotions();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeIn]);

  const handleSelectPromo = useCallback(
    async (promoId: string) => {
      const newId = selectedPromoId === promoId ? null : promoId;
      await selectPromo(newId);
    },
    [selectedPromoId, selectPromo],
  );

  const handleReferralAction = useCallback(async () => {
    if (!user) return;
    const referralUrl = `https://caribu.app/ref/${user.referralCode}`;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(referralUrl);
        Alert.alert('Copied!', 'Referral link copied to clipboard. Share it with friends!');
      } else {
        await Share.share({
          message: `Join Caribu with my referral code: ${user.referralCode}\n\n${referralUrl}`,
        });
      }
      await unlockReferral();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('[Promos] Share error:', error);
    }
  }, [user, unlockReferral]);

  const handleSocialAction = useCallback(async () => {
    Alert.alert(
      'Follow us',
      'Follow Caribu on social media to unlock your 10% discount.',
      [
        { text: 'Instagram', onPress: () => { void Linking.openURL('https://instagram.com/caribu'); } },
        { text: 'TikTok', onPress: () => { void Linking.openURL('https://tiktok.com/@caribu'); } },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
    await unlockSocial();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [unlockSocial]);

  if (!isLoggedIn) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.lockedState}>
            <View style={styles.lockedIcon}>
              <Lock color={caribuTheme.muted} size={36} />
            </View>
            <Text style={styles.lockedTitle}>Sign in to view promotions</Text>
            <Text style={styles.lockedDesc}>Create an account or sign in to access exclusive offers and discounts.</Text>
            <Pressable
              onPress={() => router.push('/sign-in')}
              style={({ pressed }) => [styles.lockedBtn, pressed && styles.pressed]}
              testID="promos-sign-in"
            >
              <Text style={styles.lockedBtnText}>Sign In / Create Account</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <Animated.View style={[styles.animatedWrap, { opacity: fadeIn }]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headerSection}>
              <Text style={styles.pageTitle}>Promotions & Offers</Text>
              <Text style={styles.pageSubtitle}>Select one promotion to apply at checkout</Text>
            </View>

            {user && (
              <View style={styles.referralCard}>
                <View style={styles.referralTop}>
                  <QrCode color={caribuTheme.charcoal} size={20} />
                  <Text style={styles.referralTitle}>Your Referral Code</Text>
                </View>
                <View style={styles.referralCodeBox}>
                  <Text style={styles.referralCode}>{user.referralCode}</Text>
                </View>
                <Pressable
                  onPress={handleReferralAction}
                  style={({ pressed }) => [styles.shareBtn, pressed && styles.pressed]}
                  testID="promos-share-referral"
                >
                  <Users color={caribuTheme.white} size={16} />
                  <Text style={styles.shareBtnText}>Share & Earn 25% Off</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.promosList}>
              {promotions.map((promo) => (
                <PromoCard
                  key={promo.id}
                  promo={promo}
                  isSelected={selectedPromoId === promo.id}
                  onSelect={() => handleSelectPromo(promo.id)}
                  onAction={
                    promo.type === 'referral'
                      ? handleReferralAction
                      : promo.type === 'social'
                        ? handleSocialAction
                        : undefined
                  }
                />
              ))}
            </View>

            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>Discount Rules</Text>
              <View style={styles.ruleRow}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>Only one discount can be applied per order</Text>
              </View>
              <View style={styles.ruleRow}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>Select your preferred promotion before checkout</Text>
              </View>
              <View style={styles.ruleRow}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>Discounts cannot be combined or stacked</Text>
              </View>
              <View style={styles.ruleRow}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>Each promotion can only be used once</Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: caribuTheme.background,
  },
  safeArea: {
    flex: 1,
  },
  animatedWrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 22,
    gap: 4,
  },
  pageTitle: {
    color: caribuTheme.ink,
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    color: caribuTheme.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  referralCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    marginBottom: 20,
  },
  referralTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  referralTitle: {
    color: caribuTheme.ink,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  referralCodeBox: {
    backgroundColor: caribuTheme.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderStyle: 'dashed',
  },
  referralCode: {
    color: caribuTheme.charcoal,
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: 3,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareBtnText: {
    color: caribuTheme.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  promosList: {
    gap: 14,
    marginBottom: 24,
  },
  promoCard: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1.5,
  },
  promoCardSelected: {
    borderWidth: 2,
  },
  promoCardUsed: {
    opacity: 0.55,
  },
  promoCardTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  promoIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCardInfo: {
    flex: 1,
    gap: 4,
  },
  promoTitle: {
    color: caribuTheme.ink,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  promoTitleUsed: {
    textDecorationLine: 'line-through',
  },
  promoDesc: {
    color: caribuTheme.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  promoCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountBadgeText: {
    color: caribuTheme.white,
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusPillActive: {
    backgroundColor: caribuTheme.forest,
  },
  statusPillUsed: {
    backgroundColor: caribuTheme.card,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: caribuTheme.card,
    borderRadius: 10,
  },
  unlockBtnPressed: {
    opacity: 0.7,
  },
  unlockText: {
    color: caribuTheme.muted,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  rulesCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 18,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  rulesTitle: {
    color: caribuTheme.ink,
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: caribuTheme.forest,
    marginTop: 6,
  },
  ruleText: {
    color: caribuTheme.muted,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  lockedState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  lockedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockedTitle: {
    color: caribuTheme.ink,
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  lockedDesc: {
    color: caribuTheme.muted,
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 21,
  },
  lockedBtn: {
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  lockedBtnText: {
    color: caribuTheme.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
  },
});
