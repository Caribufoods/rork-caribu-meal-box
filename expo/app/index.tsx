import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ChefHat, Clock, Menu, Package, ShoppingBag, Utensils } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { caribuTheme } from '@/constants/caribu-theme';
import { useCaribu } from '@/providers/caribu-provider';
import DrawerMenu from '@/components/DrawerMenu';

const heroImage = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
const logoImage = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8vpd7aucvwric7vv5ajx7';


export default function HomeScreen() {
  const router = useRouter();
  const { size, starter, main, side, cartCount, boxStarted, orderHistory } = useCaribu();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.spring(cardScale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeIn, slideUp, cardScale]);

  const summaryText = useMemo(() => {
    return [starter?.name ?? 'Starter', main?.name ?? 'Main', side?.name ?? 'Side'].join(' · ');
  }, [main?.name, side?.name, starter?.name]);

  const heroTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [-30, 0, 40],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [1.3, 1],
    extrapolate: 'clamp',
  });

  const handleHamburger = React.useCallback(() => {
    void Haptics.selectionAsync();
    setDrawerOpen(true);
  }, []);

  const handleCartPress = React.useCallback(() => {
    void Haptics.selectionAsync();
    router.push('/cart');
  }, [router]);

  const handleBuildPress = React.useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/builder');
  }, [router]);

  const handleMenuPress = React.useCallback(() => {
    void Haptics.selectionAsync();
    router.push('/menus');
  }, [router]);

  const handleHistoryPress = React.useCallback(() => {
    void Haptics.selectionAsync();
    router.push('/order-history');
  }, [router]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
            <View style={styles.topBar}>
              <Pressable
                onPress={handleHamburger}
                style={({ pressed }) => [styles.hamburgerBtn, pressed && styles.pressed]}
                testID="home-hamburger-button"
              >
                <Menu color={caribuTheme.white} size={20} />
              </Pressable>
              <View style={styles.logoCenter}>
                <Image source={{ uri: logoImage }} style={styles.logo} contentFit="contain" transition={200} />
              </View>
              <Pressable
                onPress={handleCartPress}
                style={({ pressed }) => [styles.cartButton, pressed && styles.pressed]}
                testID="home-cart-button"
              >
                <ShoppingBag color={caribuTheme.white} size={20} />
                {cartCount > 0 ? (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View style={[styles.heroContainer, { opacity: fadeIn, transform: [{ scale: cardScale }] }]}>
            <Animated.View style={[styles.heroImageWrap, { transform: [{ translateY: heroTranslateY }, { scale: heroScale }] }]}>
              <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" transition={400} />
            </Animated.View>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.heroOverlay}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>Premium Food Boxes</Text>
              </View>
              <Text style={styles.heroTitle}>Curated meals,{'\n'}crafted for you.</Text>
              <Text style={styles.heroSubtitle}>
                Build your perfect box with starters, mains & sides
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.ctaRow, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            <Pressable
              accessibilityRole="button"
              onPress={handleBuildPress}
              style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
              testID="home-build-button"
            >
              <View style={styles.ctaContent}>
                <Text style={styles.primaryCtaText}>Start Building</Text>
                <Text style={styles.primaryCtaSub}>Create your box</Text>
              </View>
              <View style={styles.ctaArrow}>
                <ArrowRight color={caribuTheme.white} size={18} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleMenuPress}
              style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
              testID="home-menu-button"
            >
              <Utensils color={caribuTheme.forest} size={18} />
              <Text style={styles.secondaryCtaText}>View Menu</Text>
            </Pressable>
          </Animated.View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>How it works</Text>
          </View>

          <View style={styles.stepsContainer}>
            {[
              { num: '01', icon: Utensils, title: 'Choose dishes', desc: 'Pick a starter, main and side from our kitchen.' },
              { num: '02', icon: ChefHat, title: 'Customise portions', desc: 'Go medium or large. Swap the starter for extra mains or sides.' },
              { num: '03', icon: Package, title: 'Order & collect', desc: 'Confirm details and get your QR code for collection.' },
            ].map((step, index) => (
              <View key={step.num} style={[styles.stepCard, index === 2 && styles.stepCardLast]}>
                <View style={styles.stepIconWrap}>
                  <step.icon color={caribuTheme.forest} size={20} />
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepNum}>{step.num}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Current box</Text>
          </View>

          {boxStarted ? (
            <Pressable
              onPress={() => router.push('/builder')}
              style={({ pressed }) => [styles.currentBox, pressed && styles.pressed]}
              testID="home-current-box"
            >
              <View style={styles.currentBoxTop}>
                <View>
                  <Text style={styles.currentBoxSize}>{size?.name} · {size?.grams}g</Text>
                  <Text style={styles.currentBoxCal}>{size?.calories} kcal</Text>
                </View>
                <View style={styles.currentBoxArrow}>
                  <ArrowRight color={caribuTheme.white} size={16} />
                </View>
              </View>
              <View style={styles.currentBoxDivider} />
              <Text style={styles.currentBoxItems}>{summaryText}</Text>
            </Pressable>
          ) : (
            <View style={styles.emptyBoxState} testID="home-no-box">
              <Package color={caribuTheme.muted} size={28} />
              <Text style={styles.emptyBoxText}>No box started yet.</Text>
              <Text style={styles.emptyBoxSub}>Tap "Start Building" to create your first box.</Text>
            </View>
          )}

          {orderHistory.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>Recent orders</Text>
                  <Pressable onPress={handleHistoryPress} hitSlop={8}>
                    <Text style={styles.seeAllText}>See all</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.recentOrdersContainer}>
                {orderHistory.slice(0, 2).map((order) => (
                  <Pressable
                    key={order.reference}
                    onPress={handleHistoryPress}
                    style={({ pressed }) => [styles.recentOrderCard, pressed && styles.pressed]}
                    testID={`recent-order-${order.reference}`}
                  >
                    <View style={styles.recentOrderLeft}>
                      <View style={styles.recentOrderIcon}>
                        <Clock color={caribuTheme.forest} size={16} />
                      </View>
                      <View style={styles.recentOrderInfo}>
                        <Text style={styles.recentOrderRef}>{order.reference}</Text>
                        <Text style={styles.recentOrderMeta}>{order.itemCount} {order.itemCount === 1 ? 'box' : 'boxes'} · {order.createdAt}</Text>
                      </View>
                    </View>
                    <Text style={styles.recentOrderTotal}>£{order.total.toFixed(2)}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(route) => router.push(route as never)}
      />
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
  content: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: caribuTheme.charcoal,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 18,
  },
  logoCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 36,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: caribuTheme.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: caribuTheme.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  heroContainer: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 24,
    overflow: 'hidden',
    height: 280,
  },
  heroImageWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    gap: 8,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroPillText: {
    color: caribuTheme.white,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  heroTitle: {
    color: caribuTheme.white,
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    lineHeight: 21,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 20,
  },
  primaryCta: {
    flex: 1,
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaContent: {
    gap: 2,
  },
  primaryCtaText: {
    color: caribuTheme.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  primaryCtaSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  ctaArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: caribuTheme.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCta: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    minWidth: 100,
  },
  secondaryCtaText: {
    color: caribuTheme.forest,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 14,
    marginHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: caribuTheme.muted,
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  seeAllText: {
    color: caribuTheme.forest,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  stepsContainer: {
    marginHorizontal: 20,
    backgroundColor: caribuTheme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    overflow: 'hidden',
  },
  stepCard: {
    flexDirection: 'row',
    padding: 18,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: caribuTheme.line,
  },
  stepCardLast: {
    borderBottomWidth: 0,
  },
  stepIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    gap: 2,
  },
  stepNum: {
    color: caribuTheme.forest,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  stepTitle: {
    color: caribuTheme.ink,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  stepDesc: {
    color: caribuTheme.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  currentBox: {
    marginHorizontal: 20,
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  currentBoxTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentBoxSize: {
    color: caribuTheme.white,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  currentBoxCal: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  currentBoxArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: caribuTheme.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBoxDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  currentBoxItems: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyBoxState: {
    marginHorizontal: 20,
    backgroundColor: caribuTheme.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  emptyBoxText: {
    color: caribuTheme.ink,
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  emptyBoxSub: {
    color: caribuTheme.muted,
    fontSize: 13,
    textAlign: 'center' as const,
    lineHeight: 19,
  },
  recentOrdersContainer: {
    marginHorizontal: 20,
    gap: 10,
  },
  recentOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  recentOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentOrderIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentOrderInfo: {
    flex: 1,
    gap: 2,
  },
  recentOrderRef: {
    color: caribuTheme.ink,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  recentOrderMeta: {
    color: caribuTheme.muted,
    fontSize: 12,
  },
  recentOrderTotal: {
    color: caribuTheme.forest,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
