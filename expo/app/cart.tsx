import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Minus, Package, Plus, Tag, Trash2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { caribuTheme } from '@/constants/caribu-theme';
import { menuItems, portionSizes } from '@/mocks/caribu-menu';
import { useCaribu } from '@/providers/caribu-provider';
import { useAuth } from '@/providers/auth-provider';
import { usePromotions } from '@/providers/promotions-provider';

export default function CartScreen() {
  const router = useRouter();
  const { cart, cartCount, cartTotal, updateQuantity, removeItem } = useCaribu();
  const { isLoggedIn } = useAuth();
  const { selectedPromotion, selectPromo, availablePromotions } = usePromotions();

  const discountAmount = useMemo(() => {
    if (!selectedPromotion) return 0;
    return cartTotal * (selectedPromotion.discountPercent / 100);
  }, [cartTotal, selectedPromotion]);

  const finalTotal = useMemo(() => {
    return Math.max(0, cartTotal - discountAmount);
  }, [cartTotal, discountAmount]);

  const handleRemovePromo = async () => {
    void Haptics.selectionAsync();
    await selectPromo(null);
  };

  const handleSelectPromo = async (promoId: string) => {
    void Haptics.selectionAsync();
    await selectPromo(promoId);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {cart.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Package color={caribuTheme.muted} size={32} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyDesc}>Build a Caribu box to get started with your order.</Text>
            <Pressable
              onPress={() => router.push('/builder')}
              style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
              testID="empty-build-box-button"
            >
              <Text style={styles.emptyBtnText}>Build a Box</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.cartHeader}>{cartCount} {cartCount === 1 ? 'box' : 'boxes'}</Text>

            {cart.map((item) => {
              const sizeInfo = portionSizes.find((entry) => entry.id === item.selection.sizeId);
              const starterInfo = item.selection.omitStarter ? undefined : menuItems.find((entry) => entry.id === item.selection.starterId);
              const mainInfo = menuItems.find((entry) => entry.id === item.selection.mainId);
              const sideInfo = menuItems.find((entry) => entry.id === item.selection.sideId);

              return (
                <View key={item.id} style={styles.cartCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardHeading}>
                      <Text style={styles.cardTitle}>{sizeInfo?.name} Box</Text>
                      <Text style={styles.cardMeta}>{sizeInfo?.grams}g · {sizeInfo?.calories} kcal</Text>
                    </View>
                    <Text style={styles.cardPrice}>£{(item.unitPrice * item.quantity).toFixed(2)}</Text>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.lineItems}>
                    <Text style={styles.lineItem}>{starterInfo?.name ?? 'Starter omitted'}</Text>
                    <Text style={styles.lineItem}>{mainInfo?.name ?? 'Main'}</Text>
                    <Text style={styles.lineItem}>{sideInfo?.name ?? 'Side'}</Text>
                    {item.selection.omitStarter ? (
                      <Text style={styles.boostNote}>Extra portion → {item.selection.boostTarget}</Text>
                    ) : null}
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.actionsRow}>
                    <View style={styles.qtyControl}>
                      <Pressable
                        onPress={() => updateQuantity(item.id, -1)}
                        style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
                        testID={`decrease-${item.id}`}
                      >
                        <Minus color={caribuTheme.ink} size={14} />
                      </Pressable>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <Pressable
                        onPress={() => updateQuantity(item.id, 1)}
                        style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
                        testID={`increase-${item.id}`}
                      >
                        <Plus color={caribuTheme.ink} size={14} />
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => removeItem(item.id)}
                      style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                      testID={`remove-${item.id}`}
                    >
                      <Trash2 color={caribuTheme.error} size={14} />
                      <Text style={styles.removeText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {isLoggedIn && availablePromotions.length > 0 && (
              <View style={styles.promoSection}>
                <Text style={styles.promoSectionTitle}>Apply a promotion</Text>
                {selectedPromotion ? (
                  <View style={styles.appliedPromo}>
                    <View style={styles.appliedPromoLeft}>
                      <View style={styles.appliedPromoBadge}>
                        <Tag color={caribuTheme.white} size={14} />
                      </View>
                      <View style={styles.appliedPromoInfo}>
                        <Text style={styles.appliedPromoTitle}>{selectedPromotion.title}</Text>
                        <Text style={styles.appliedPromoDiscount}>{selectedPromotion.discountPercent}% off · -£{discountAmount.toFixed(2)}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={handleRemovePromo}
                      style={({ pressed }) => [styles.removePromoBtn, pressed && styles.pressed]}
                      testID="remove-promo"
                    >
                      <X color={caribuTheme.muted} size={16} />
                    </Pressable>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoChips}>
                    {availablePromotions.map((promo) => (
                      <Pressable
                        key={promo.id}
                        onPress={() => handleSelectPromo(promo.id)}
                        style={({ pressed }) => [styles.promoChip, pressed && styles.promoChipPressed]}
                        testID={`apply-promo-${promo.type}`}
                      >
                        <Tag color={caribuTheme.forest} size={14} />
                        <Text style={styles.promoChipText}>{promo.discountPercent}% – {promo.title}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {!isLoggedIn && cart.length > 0 && (
              <Pressable
                onPress={() => router.push('/sign-in')}
                style={({ pressed }) => [styles.signInPromo, pressed && styles.pressed]}
                testID="cart-sign-in-promo"
              >
                <Tag color={caribuTheme.forest} size={16} />
                <Text style={styles.signInPromoText}>Sign in to apply promotions & discounts</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      {cart.length > 0 ? (
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerLabel}>Total</Text>
            {selectedPromotion ? (
              <View style={styles.footerPriceRow}>
                <Text style={styles.footerPriceStrike}>£{cartTotal.toFixed(2)}</Text>
                <Text style={styles.footerPrice}>£{finalTotal.toFixed(2)}</Text>
              </View>
            ) : (
              <Text style={styles.footerPrice}>£{cartTotal.toFixed(2)}</Text>
            )}
          </View>
          <Pressable
            onPress={() => router.push('/details')}
            style={({ pressed }) => [styles.checkoutBtn, pressed && styles.pressed]}
            testID="cart-checkout-button"
          >
            <Text style={styles.checkoutText}>Checkout</Text>
            <ArrowRight color={caribuTheme.white} size={16} />
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: caribuTheme.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 16,
  },
  cartHeader: {
    color: caribuTheme.ink,
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 14,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: caribuTheme.ink,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  emptyDesc: {
    color: caribuTheme.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnText: {
    color: caribuTheme.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  cartCard: {
    backgroundColor: caribuTheme.surface,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeading: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: caribuTheme.ink,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  cardMeta: {
    color: caribuTheme.muted,
    fontSize: 13,
  },
  cardPrice: {
    color: caribuTheme.forest,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  cardDivider: {
    height: 1,
    backgroundColor: caribuTheme.line,
  },
  lineItems: {
    gap: 4,
  },
  lineItem: {
    color: caribuTheme.ink,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  boostNote: {
    color: caribuTheme.forest,
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: caribuTheme.card,
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: caribuTheme.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: caribuTheme.ink,
    fontSize: 15,
    fontWeight: '700' as const,
    minWidth: 28,
    textAlign: 'center',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  removeText: {
    color: caribuTheme.error,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  promoSection: {
    gap: 10,
  },
  promoSectionTitle: {
    color: caribuTheme.muted,
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
  appliedPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F7F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: caribuTheme.forest,
  },
  appliedPromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appliedPromoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: caribuTheme.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedPromoInfo: {
    flex: 1,
    gap: 2,
  },
  appliedPromoTitle: {
    color: caribuTheme.ink,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  appliedPromoDiscount: {
    color: caribuTheme.forest,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  removePromoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoChips: {
    gap: 10,
    paddingVertical: 2,
  },
  promoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: caribuTheme.surface,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  promoChipPressed: {
    backgroundColor: '#F0F7F2',
    borderColor: caribuTheme.forest,
  },
  promoChipText: {
    color: caribuTheme.ink,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  signInPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F7F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D4E8DA',
  },
  signInPromoText: {
    color: caribuTheme.forest,
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  footerLeft: {
    gap: 2,
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  footerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerPriceStrike: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    fontWeight: '600' as const,
    textDecorationLine: 'line-through',
  },
  footerPrice: {
    color: caribuTheme.white,
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
  },
  checkoutBtn: {
    backgroundColor: caribuTheme.forest,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutText: {
    color: caribuTheme.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
