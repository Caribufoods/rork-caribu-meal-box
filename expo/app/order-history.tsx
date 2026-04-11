import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Package, RotateCcw, Tag } from 'lucide-react-native';

import { caribuTheme } from '@/constants/caribu-theme';
import { useCaribu } from '@/providers/caribu-provider';
import { useAuth } from '@/providers/auth-provider';

const statusColors: Record<string, { bg: string; dot: string; text: string }> = {
  pending: { bg: '#FFF8E1', dot: '#FFA000', text: '#F57F17' },
  confirmed: { bg: '#E3F2FD', dot: '#1976D2', text: '#1565C0' },
  preparing: { bg: '#FFF3E0', dot: '#E65100', text: '#BF360C' },
  ready: { bg: '#E8F5E9', dot: '#2E7D32', text: '#1B5E20' },
  completed: { bg: '#E8F5E9', dot: caribuTheme.forest, text: caribuTheme.forest },
  cancelled: { bg: '#FFEBEE', dot: '#C62828', text: '#B71C1C' },
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { orderHistory } = useCaribu();
  const { isLoggedIn } = useAuth();

  const isLoading = false;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={caribuTheme.forest} />
            <Text style={styles.emptyDesc}>Loading your orders...</Text>
          </View>
        ) : orderHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Clock color={caribuTheme.muted} size={32} />
            </View>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyDesc}>
              {isLoggedIn
                ? 'Your order history will appear here after your first order.'
                : 'Sign in to see your order history across devices.'}
            </Text>
            <Pressable
              onPress={() => router.push(isLoggedIn ? '/builder' : '/sign-in')}
              style={({ pressed }) => [styles.emptyBtn, pressed && styles.pressed]}
              testID="empty-build-button"
            >
              <Text style={styles.emptyBtnText}>{isLoggedIn ? 'Build a Box' : 'Sign In'}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.pageHeader}>{orderHistory.length} {orderHistory.length === 1 ? 'order' : 'orders'}</Text>

            {orderHistory.map((order, index) => {
              const status = order.status ?? 'pending';
              const statusStyle = statusColors[status] ?? statusColors.pending;
              const hasDiscount = (order.discountApplied ?? 0) > 0;

              return (
                <View key={`${order.reference}-${index}`} style={styles.orderCard}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTopLeft}>
                      <View style={styles.orderIconWrap}>
                        <Package color={caribuTheme.forest} size={18} />
                      </View>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderRef}>{order.reference}</Text>
                        <Text style={styles.orderMeta}>
                          {order.itemCount} {order.itemCount === 1 ? 'box' : 'boxes'} · {formatDate(order.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderTotal}>£{order.total.toFixed(2)}</Text>
                  </View>

                  {hasDiscount && (
                    <View style={styles.discountRow}>
                      <Tag color={caribuTheme.forest} size={12} />
                      <Text style={styles.discountText}>
                        {order.promoCode ?? 'Promo'} · -£{(order.discountApplied ?? 0).toFixed(2)} saved
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardDivider} />

                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => router.push('/builder')}
                      style={({ pressed }) => [styles.reorderBtn, pressed && styles.pressed]}
                      testID={`reorder-${order.reference}`}
                    >
                      <RotateCcw color={caribuTheme.forest} size={13} />
                      <Text style={styles.reorderText}>Reorder</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
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
    paddingBottom: 40,
    gap: 14,
  },
  pageHeader: {
    color: caribuTheme.ink,
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    marginBottom: 4,
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
    textAlign: 'center' as const,
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
  orderCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    gap: 2,
  },
  orderRef: {
    color: caribuTheme.ink,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  orderMeta: {
    color: caribuTheme.muted,
    fontSize: 13,
  },
  orderTotal: {
    color: caribuTheme.forest,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  cardDivider: {
    height: 1,
    backgroundColor: caribuTheme.line,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F7F2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  discountText: {
    color: caribuTheme.forest,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: caribuTheme.forest,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: caribuTheme.forest,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: caribuTheme.card,
  },
  reorderText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: caribuTheme.forest,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
