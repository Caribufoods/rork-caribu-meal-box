import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, QrCode, RotateCcw } from 'lucide-react-native';
import { Image } from 'expo-image';

import { caribuTheme } from '@/constants/caribu-theme';
import { useCaribu } from '@/providers/caribu-provider';

function QrTile({ filled }: { filled: boolean }) {
  return <View style={[styles.qrTile, filled ? styles.qrTileFilled : styles.qrTileEmpty]} />;
}

const qrPattern: number[][] = [
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
];

export default function ConfirmationScreen() {
  const router = useRouter();
  const { details, lastOrder } = useCaribu();

  const checkScale = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(contentSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [checkScale, contentFade, contentSlide]);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successSection}>
          <View style={styles.logoStrip}>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8vpd7aucvwric7vv5ajx7' }}
              style={styles.confirmLogo}
              contentFit="contain"
              transition={200}
            />
          </View>
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
            <CheckCircle color={caribuTheme.white} size={32} />
          </Animated.View>
          <Text style={styles.successTitle}>Order Confirmed</Text>
          <Text style={styles.successSub}>Your Caribu box is being prepared.</Text>
          {lastOrder?.promoCode && (
            <Text style={styles.promoApplied}>Promo applied: {lastOrder.promoCode}</Text>
          )}
        </View>

        <Animated.View style={[styles.referenceCard, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
          <Text style={styles.referenceLabel}>Order Reference</Text>
          <Text style={styles.referenceValue}>{lastOrder?.reference ?? 'CAR-000000'}</Text>
          <View style={styles.referenceMeta}>
            <Text style={styles.referenceMetaText}>
              {lastOrder?.createdAt
                ? new Date(lastOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--'}
            </Text>
            <View style={styles.referenceDot} />
            <Text style={styles.referenceMetaText}>{details.fulfilment}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.qrCard, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
          <View style={styles.qrHeader}>
            <QrCode color={caribuTheme.ink} size={18} />
            <Text style={styles.qrTitle}>Scan for collection</Text>
          </View>
          <View style={styles.qrGrid}>
            {qrPattern.flatMap((row, rowIndex) =>
              row.map((filled, columnIndex) => <QrTile key={`${rowIndex}-${columnIndex}`} filled={filled === 1} />),
            )}
          </View>
        </Animated.View>

        <Animated.View style={[styles.infoCard, { opacity: contentFade, transform: [{ translateY: contentSlide }] }]}>
          <Text style={styles.infoTitle}>What happens next</Text>
          <Text style={styles.infoDesc}>
            {details.fulfilment === 'delivery'
              ? `Your box will be delivered to ${details.address || 'your address'}. We'll contact ${details.phone || 'you'} if needed.`
              : `Your box will be ready for pickup. We'll contact ${details.phone || 'you'} when it's ready.`}
          </Text>
          <View style={styles.infoDivider} />
          {(lastOrder?.discountApplied ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.discountValue}>-£{(lastOrder?.discountApplied ?? 0).toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>£{lastOrder?.total.toFixed(2) ?? '0.00'}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.replace('/builder')}
          style={({ pressed }) => [styles.newOrderBtn, pressed && styles.pressed]}
          testID="confirmation-new-order-button"
        >
          <RotateCcw color={caribuTheme.white} size={16} />
          <Text style={styles.newOrderText}>New Order</Text>
        </Pressable>
      </View>
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
    paddingTop: 20,
    paddingBottom: 120,
    gap: 20,
  },
  successSection: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  logoStrip: {
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  confirmLogo: {
    width: 100,
    height: 28,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: caribuTheme.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    color: caribuTheme.ink,
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
  },
  successSub: {
    color: caribuTheme.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  referenceCard: {
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 20,
    padding: 22,
    gap: 8,
  },
  referenceLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
  referenceValue: {
    color: caribuTheme.white,
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -1.2,
  },
  referenceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referenceMetaText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textTransform: 'capitalize' as const,
  },
  referenceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  qrCard: {
    backgroundColor: caribuTheme.surface,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderRadius: 20,
    padding: 22,
    gap: 18,
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrTitle: {
    color: caribuTheme.ink,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  qrGrid: {
    width: 198,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  qrTile: {
    width: 18,
    height: 18,
  },
  qrTileFilled: {
    backgroundColor: caribuTheme.ink,
    borderRadius: 2,
  },
  qrTileEmpty: {
    backgroundColor: caribuTheme.card,
    borderRadius: 2,
  },
  infoCard: {
    backgroundColor: caribuTheme.surface,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  infoTitle: {
    color: caribuTheme.ink,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  infoDesc: {
    color: caribuTheme.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  infoDivider: {
    height: 1,
    backgroundColor: caribuTheme.line,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: caribuTheme.muted,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  totalValue: {
    color: caribuTheme.forest,
    fontSize: 20,
    fontWeight: '700' as const,
  },
  discountValue: {
    color: caribuTheme.forest,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  promoApplied: {
    color: caribuTheme.forest,
    fontSize: 13,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  newOrderBtn: {
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  newOrderText: {
    color: caribuTheme.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
