import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronRight, RefreshCw, Zap } from 'lucide-react-native';
import { caribuTheme } from '@/constants/caribu-theme';
import { useCaribu } from '@/providers/caribu-provider';
import { MenuCategory } from '@/types/caribu';

const categories: MenuCategory[] = ['starters', 'mains', 'sides'];
const categoryLabels: Record<MenuCategory, string> = { starters: 'Starter', mains: 'Main', sides: 'Side' };

export default function BuilderScreen() {
  const router = useRouter();
  const {
    menuItems,
    portionSizes,
    selection,
    size,
    starter,
    main,
    side,
    currentUnitPrice,
    boostSurcharge,
    getBoostPriceForItem,
    chooseSize,
    selectItem,
    setStarterOmission,
    chooseBoostTarget,
    addCurrentBoxToCart,
    cartCount,
  } = useCaribu();

  const groupedItems = useMemo(() => {
    return categories.map((category) => ({
      category,
      items: menuItems.filter((item) => item.category === category),
    }));
  }, [menuItems]);

  const handleAddToCart = useCallback(() => {
    addCurrentBoxToCart();
    router.push('/cart');
  }, [addCurrentBoxToCart, router]);

  const footerScale = useRef(new Animated.Value(1)).current;

  const handleFooterPressIn = useCallback(() => {
    Animated.spring(footerScale, { toValue: 0.97, friction: 8, useNativeDriver: true }).start();
  }, [footerScale]);

  const handleFooterPressOut = useCallback(() => {
    Animated.spring(footerScale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [footerScale]);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sizeSection}>
          <Text style={styles.sectionLabel}>Portion size</Text>
          <View style={styles.sizeRow}>
            {portionSizes.map((item) => {
              const selected = item.id === selection.sizeId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => chooseSize(item.id)}
                  style={[styles.sizeCard, selected && styles.sizeCardActive]}
                  testID={`size-${item.id}`}
                >
                  <View style={styles.sizeTop}>
                    <Text style={[styles.sizeName, selected && styles.sizeNameActive]}>{item.name}</Text>
                    {selected ? (
                      <View style={styles.checkCircle}>
                        <Check color={caribuTheme.white} size={12} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.sizeGrams, selected && styles.sizeGramsActive]}>{item.grams}g · {item.calories} kcal</Text>
                  <Text style={[styles.sizeSub, selected && styles.sizeSubActive]}>{item.subtitle}</Text>
                  <Text style={[styles.sizePrice, selected && styles.sizePriceActive]}>
                    {item.surcharge === 0 ? 'Included' : `+£${item.surcharge}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.swapSection}>
          <View style={styles.swapHeader}>
            <RefreshCw color={caribuTheme.forest} size={18} />
            <Text style={styles.swapTitle}>Starter Swap</Text>
          </View>
          <Text style={styles.swapDesc}>Skip the starter and boost your main or side by +25% portion for just £{boostSurcharge.toFixed(2)}.</Text>
          <View style={styles.toggleRow}>
            {([false, true] as const).map((value) => {
              const active = selection.omitStarter === value;
              return (
                <Pressable
                  key={`${value}`}
                  onPress={() => setStarterOmission(value)}
                  style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                  testID={value ? 'omit-starter-on' : 'omit-starter-off'}
                >
                  <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                    {value ? 'Omit starter' : 'Keep starter'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {selection.omitStarter ? (
            <View style={styles.boostRow}>
              <Text style={styles.boostLabel}>Boost:</Text>
              {(['main', 'side'] as const).map((target) => {
                const active = selection.boostTarget === target;
                return (
                  <Pressable
                    key={target}
                    onPress={() => chooseBoostTarget(target)}
                    style={[styles.boostChip, active && styles.boostChipActive]}
                    testID={`boost-${target}`}
                  >
                    <Text style={[styles.boostChipText, active && styles.boostChipTextActive]}>
                      {target === 'main' ? 'Main' : 'Side'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        {groupedItems.map((group) => {
          const isDisabled = group.category === 'starters' && selection.omitStarter;
          return (
            <View key={group.category} style={styles.menuSection}>
              <View style={styles.menuSectionHeader}>
                <Text style={styles.menuSectionTitle}>{categoryLabels[group.category]}</Text>
                <Text style={styles.menuSectionHint}>
                  {isDisabled ? 'Omitted' : 'Choose one'}
                </Text>
              </View>
              {group.items.map((item) => {
                const selected =
                  (group.category === 'starters' && selection.starterId === item.id && !selection.omitStarter) ||
                  (group.category === 'mains' && selection.mainId === item.id) ||
                  (group.category === 'sides' && selection.sideId === item.id);

                const isBoosted = selection.omitStarter && (
                  (group.category === 'mains' && selection.boostTarget === 'main') ||
                  (group.category === 'sides' && selection.boostTarget === 'side')
                );
                const displayPrice = isBoosted ? getBoostPriceForItem(item.price) : item.price;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => selectItem(group.category, item.id)}
                    style={({ pressed }) => [
                      styles.itemCard,
                      selected && styles.itemCardSelected,
                      isBoosted && selected && styles.itemCardBoosted,
                      isDisabled && styles.itemCardDisabled,
                      pressed && !isDisabled && styles.pressed,
                    ]}
                    testID={`${group.category}-${item.id}`}
                    disabled={isDisabled}
                  >
                    <Image source={{ uri: item.image }} style={styles.itemImage} contentFit="cover" transition={200} />
                    <View style={styles.itemBody}>
                      <View style={styles.itemNameRow}>
                        <Text style={[styles.itemName, isDisabled && styles.itemNameDisabled]} numberOfLines={1}>{item.name}</Text>
                        {isBoosted && (
                          <View style={styles.boostedBadge}>
                            <Zap size={10} color={caribuTheme.white} />
                            <Text style={styles.boostedBadgeText}>Boosted</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                      {isBoosted && (
                        <Text style={styles.boostDetail}>+25% portion · +£{boostSurcharge.toFixed(2)}</Text>
                      )}
                      <View style={styles.itemFooter}>
                        <Text style={styles.itemCal}>{item.calories} kcal</Text>
                        <View style={styles.priceRow}>
                          {isBoosted && (
                            <Text style={styles.itemPriceOriginal}>£{item.price.toFixed(2)}</Text>
                          )}
                          <Text style={[styles.itemPrice, isBoosted && styles.itemPriceBoosted]}>£{displayPrice.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>
                    {selected ? (
                      <View style={[styles.selectedDot, isBoosted && styles.selectedDotBoosted]}>
                        {isBoosted ? <Zap color={caribuTheme.white} size={14} /> : <Check color={caribuTheme.white} size={14} />}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <Animated.View style={[styles.footer, { transform: [{ scale: footerScale }] }]}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerPrice}>£{currentUnitPrice.toFixed(2)}</Text>
          <Text style={styles.footerMeta}>
            {size?.name} · {size?.grams}g · {size?.calories} kcal
          </Text>
          <Text style={styles.footerItems}>
            {(selection.omitStarter ? 'No starter' : starter?.name) ?? 'Starter'} · {main?.name ?? 'Main'} · {side?.name ?? 'Side'}
          </Text>
        </View>
        <Pressable
          onPress={handleAddToCart}
          onPressIn={handleFooterPressIn}
          onPressOut={handleFooterPressOut}
          style={styles.addButton}
          testID="builder-add-to-cart-button"
        >
          <Text style={styles.addButtonText}>Add to Cart</Text>
          <View style={styles.addButtonBadge}>
            <Text style={styles.addButtonBadgeText}>{cartCount + 1}</Text>
          </View>
          <ChevronRight color={caribuTheme.white} size={16} />
        </Pressable>
      </Animated.View>
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
    paddingTop: 8,
    paddingBottom: 200,
    gap: 24,
  },
  sectionLabel: {
    color: caribuTheme.muted,
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  sizeSection: {},
  sizeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: caribuTheme.surface,
    borderWidth: 1.5,
    borderColor: caribuTheme.line,
    gap: 6,
  },
  sizeCardActive: {
    backgroundColor: caribuTheme.charcoal,
    borderColor: caribuTheme.charcoal,
  },
  sizeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sizeName: {
    color: caribuTheme.ink,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  sizeNameActive: {
    color: caribuTheme.white,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: caribuTheme.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeGrams: {
    color: caribuTheme.forest,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  sizeGramsActive: {
    color: caribuTheme.sage,
  },
  sizeSub: {
    color: caribuTheme.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  sizeSubActive: {
    color: 'rgba(255,255,255,0.55)',
  },
  sizePrice: {
    color: caribuTheme.ink,
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  sizePriceActive: {
    color: caribuTheme.gold,
  },
  swapSection: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  swapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swapTitle: {
    color: caribuTheme.ink,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  swapDesc: {
    color: caribuTheme.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: caribuTheme.forest,
  },
  toggleText: {
    color: caribuTheme.ink,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  toggleTextActive: {
    color: caribuTheme.white,
  },
  boostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boostLabel: {
    color: caribuTheme.muted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  boostChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: caribuTheme.card,
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  boostChipActive: {
    backgroundColor: caribuTheme.warm,
    borderColor: caribuTheme.forest,
  },
  boostChipText: {
    color: caribuTheme.muted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  boostChipTextActive: {
    color: caribuTheme.forest,
  },
  menuSection: {
    gap: 12,
  },
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuSectionTitle: {
    color: caribuTheme.ink,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  menuSectionHint: {
    color: caribuTheme.muted,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: caribuTheme.line,
  },
  itemCardSelected: {
    borderColor: caribuTheme.forest,
    backgroundColor: '#F0F7F2',
  },
  itemCardDisabled: {
    opacity: 0.4,
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemCardBoosted: {
    borderColor: '#C9A96E',
    backgroundColor: '#FFFBF2',
  },
  itemBody: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: 'center',
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    color: caribuTheme.ink,
    fontSize: 15,
    fontWeight: '700' as const,
    flexShrink: 1,
  },
  itemNameDisabled: {
    color: caribuTheme.muted,
  },
  boostedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#C9A96E',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  boostedBadgeText: {
    color: caribuTheme.white,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  itemDesc: {
    color: caribuTheme.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  boostDetail: {
    color: '#C9A96E',
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemCal: {
    color: caribuTheme.muted,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  itemPriceOriginal: {
    color: caribuTheme.muted,
    fontSize: 12,
    fontWeight: '500' as const,
    textDecorationLine: 'line-through' as const,
  },
  itemPrice: {
    color: caribuTheme.forest,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  itemPriceBoosted: {
    color: '#C9A96E',
  },
  selectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: caribuTheme.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDotBoosted: {
    backgroundColor: '#C9A96E',
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  footerInfo: {
    gap: 2,
  },
  footerPrice: {
    color: caribuTheme.white,
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  footerMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  footerItems: {
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    fontSize: 13,
  },
  addButton: {
    backgroundColor: caribuTheme.forest,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addButtonText: {
    flex: 1,
    color: caribuTheme.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  addButtonBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonBadgeText: {
    color: caribuTheme.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
