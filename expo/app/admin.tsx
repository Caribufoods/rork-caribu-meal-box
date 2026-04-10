import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  ShoppingBag,
  TrendingUp,
  Tag,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Lock,
  LogOut,
  Search,
  DollarSign,
  BarChart3,
  UserCheck,
  Gift,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { caribuTheme } from '@/constants/caribu-theme';
import { useAdmin } from '@/providers/admin-provider';
import type { AdminOrder } from '@/types/admin';

type AdminTab = 'overview' | 'users' | 'orders' | 'promos';

const ORDER_STATUS_COLORS: Record<AdminOrder['status'], string> = {
  pending: '#E8A838',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#2D6A4F',
  completed: '#6B7280',
  cancelled: '#C4534A',
};

function AdminLoginGate({ onAuthenticate }: { onAuthenticate: (pin: string) => boolean }) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [shakeAnim] = useState(new Animated.Value(0));

  const handleSubmit = () => {
    const success = onAuthenticate(pin);
    if (!success) {
      setError(true);
      setPin('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setError(false), 2000);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={loginStyles.container}>
      <View style={loginStyles.lockIcon}>
        <Lock color={caribuTheme.forest} size={32} />
      </View>
      <Text style={loginStyles.title}>Admin Access</Text>
      <Text style={loginStyles.subtitle}>Enter the admin PIN to continue</Text>

      <Animated.View style={[loginStyles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="Enter PIN"
          placeholderTextColor={caribuTheme.muted}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          style={[loginStyles.input, error && loginStyles.inputError]}
          testID="admin-pin-input"
          onSubmitEditing={handleSubmit}
        />
      </Animated.View>

      {error && <Text style={loginStyles.errorText}>Incorrect PIN. Try again.</Text>}

      <Pressable
        onPress={handleSubmit}
        style={({ pressed }) => [loginStyles.submitBtn, pressed && loginStyles.pressed]}
        testID="admin-pin-submit"
      >
        <Text style={loginStyles.submitBtnText}>Unlock Dashboard</Text>
      </Pressable>

      <Text style={loginStyles.hint}>Default PIN: 1234</Text>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <View style={[statStyles.card, { borderLeftColor: color }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: color + '15' }]}>{icon}</View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function AccessDenied({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={loginStyles.container}>
      <View style={loginStyles.lockIcon}>
        <Lock color={caribuTheme.error} size={32} />
      </View>
      <Text style={loginStyles.title}>Access Denied</Text>
      <Text style={loginStyles.subtitle}>This area is restricted to authorized administrators only.</Text>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [{
          marginTop: 28,
          backgroundColor: caribuTheme.forest,
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: 12,
          opacity: pressed ? 0.85 : 1,
        }]}
      >
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' as const }}>Go Back</Text>
      </Pressable>
    </SafeAreaView>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const {
    isAdminAuthenticated,
    isAdminEmail,
    users,
    orders,
    stats,
    authenticateAdmin,
    logoutAdmin,
    updateOrderStatus,
    deleteUser,
    exportData,
    isLoading,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [userSearch, setUserSearch] = useState<string>('');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const query = userSearch.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
    );
  }, [users, userSearch]);

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const query = orderSearch.toLowerCase();
    return orders.filter(
      (o) =>
        o.reference.toLowerCase().includes(query) ||
        o.userName.toLowerCase().includes(query) ||
        o.userEmail.toLowerCase().includes(query),
    );
  }, [orders, orderSearch]);

  const handleExport = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const data = exportData();
    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caribu-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        Alert.alert('Export', 'Data has been logged to console.');
      }
    } else {
      try {
        await Share.share({
          message: data,
          title: 'Caribu Admin Export',
        });
      } catch {
        Alert.alert('Export', 'Data has been logged to console. Check your device logs.');
      }
    }
  }, [exportData]);

  const handleDeleteUser = useCallback(
    (userId: string, userName: string) => {
      Alert.alert(
        'Delete User',
        `Are you sure you want to remove "${userName}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteUser(userId);
            },
          },
        ],
      );
    },
    [deleteUser],
  );

  const handleUpdateOrderStatus = useCallback(
    (orderId: string, status: AdminOrder['status']) => {
      void Haptics.selectionAsync();
      void updateOrderStatus({ orderId, status });
    },
    [updateOrderStatus],
  );

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 color={activeTab === 'overview' ? caribuTheme.white : caribuTheme.muted} size={16} /> },
    { id: 'users', label: 'Users', icon: <Users color={activeTab === 'users' ? caribuTheme.white : caribuTheme.muted} size={16} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag color={activeTab === 'orders' ? caribuTheme.white : caribuTheme.muted} size={16} /> },
    { id: 'promos', label: 'Promos', icon: <Tag color={activeTab === 'promos' ? caribuTheme.white : caribuTheme.muted} size={16} /> },
  ];

  if (!isAdminEmail) {
    return <AccessDenied onBack={() => router.back()} />;
  }

  if (!isAdminAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              testID="admin-back"
            >
              <ArrowLeft color={caribuTheme.ink} size={20} />
            </Pressable>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <View style={{ width: 40 }} />
          </View>
          <AdminLoginGate onAuthenticate={authenticateAdmin} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            testID="admin-back-auth"
          >
            <ArrowLeft color={caribuTheme.ink} size={20} />
          </Pressable>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              logoutAdmin();
            }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            testID="admin-logout"
          >
            <LogOut color={caribuTheme.error} size={18} />
          </Pressable>
        </View>

        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveTab(tab.id);
              }}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              testID={`admin-tab-${tab.id}`}
            >
              {tab.icon}
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={caribuTheme.forest} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'overview' && (
              <View style={styles.section}>
                <View style={statStyles.grid}>
                  <StatCard
                    icon={<Users color={caribuTheme.forest} size={18} />}
                    label="Total Users"
                    value={stats.totalUsers.toString()}
                    color={caribuTheme.forest}
                  />
                  <StatCard
                    icon={<UserCheck color="#3B82F6" size={18} />}
                    label="Active Users"
                    value={stats.activeUsers.toString()}
                    color="#3B82F6"
                  />
                  <StatCard
                    icon={<ShoppingBag color="#8B5CF6" size={18} />}
                    label="Total Orders"
                    value={stats.totalOrders.toString()}
                    color="#8B5CF6"
                  />
                  <StatCard
                    icon={<DollarSign color={caribuTheme.gold} size={18} />}
                    label="Revenue"
                    value={`£${stats.totalRevenue.toFixed(2)}`}
                    color={caribuTheme.gold}
                  />
                  <StatCard
                    icon={<TrendingUp color="#10B981" size={18} />}
                    label="Avg. Order"
                    value={`£${stats.avgOrderValue.toFixed(2)}`}
                    color="#10B981"
                  />
                  <StatCard
                    icon={<Gift color="#EC4899" size={18} />}
                    label="Promo Uses"
                    value={stats.promoRedemptions.toString()}
                    color="#EC4899"
                  />
                </View>

                <Pressable
                  onPress={handleExport}
                  style={({ pressed }) => [styles.exportBtn, pressed && styles.pressed]}
                  testID="admin-export"
                >
                  <Download color={caribuTheme.white} size={18} />
                  <Text style={styles.exportBtnText}>Export All Data</Text>
                </Pressable>
              </View>
            )}

            {activeTab === 'users' && (
              <View style={styles.section}>
                <View style={styles.searchWrap}>
                  <Search color={caribuTheme.muted} size={16} />
                  <TextInput
                    value={userSearch}
                    onChangeText={setUserSearch}
                    placeholder="Search users..."
                    placeholderTextColor={caribuTheme.muted}
                    style={styles.searchInput}
                    testID="admin-user-search"
                  />
                </View>

                {filteredUsers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Users color={caribuTheme.muted} size={32} />
                    <Text style={styles.emptyText}>No users registered yet</Text>
                    <Text style={styles.emptySubtext}>
                      Users will appear here when they create accounts
                    </Text>
                  </View>
                ) : (
                  filteredUsers.map((u) => (
                    <View
                      key={u.id}
                      style={[styles.userCard, u.status === 'deleted' && styles.userCardDeleted]}
                    >
                      <View style={styles.userCardTop}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>
                            {u.name
                              .split(' ')
                              .map((p) => p[0]?.toUpperCase() ?? '')
                              .join('')
                              .slice(0, 2)}
                          </Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{u.name}</Text>
                          <Text style={styles.userEmail}>{u.email}</Text>
                          <View style={styles.userMeta}>
                            <View
                              style={[
                                styles.badge,
                                { backgroundColor: u.provider === 'email' ? '#EEF2FF' : '#F0FDF4' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  { color: u.provider === 'email' ? '#4F46E5' : '#16A34A' },
                                ]}
                              >
                                {u.provider}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.badge,
                                {
                                  backgroundColor:
                                    u.status === 'active' ? '#F0FDF4' : '#FEF2F2',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  {
                                    color: u.status === 'active' ? '#16A34A' : '#DC2626',
                                  },
                                ]}
                              >
                                {u.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {u.status === 'active' && (
                          <Pressable
                            onPress={() => handleDeleteUser(u.id, u.name)}
                            style={({ pressed }) => [
                              styles.deleteBtn,
                              pressed && styles.pressed,
                            ]}
                            testID={`admin-delete-user-${u.id}`}
                          >
                            <Trash2 color={caribuTheme.error} size={16} />
                          </Pressable>
                        )}
                      </View>
                      <View style={styles.userStats}>
                        <View style={styles.userStatItem}>
                          <Text style={styles.userStatValue}>{u.orderCount}</Text>
                          <Text style={styles.userStatLabel}>Orders</Text>
                        </View>
                        <View style={styles.userStatDivider} />
                        <View style={styles.userStatItem}>
                          <Text style={styles.userStatValue}>£{u.totalSpent.toFixed(2)}</Text>
                          <Text style={styles.userStatLabel}>Spent</Text>
                        </View>
                        <View style={styles.userStatDivider} />
                        <View style={styles.userStatItem}>
                          <Text style={styles.userStatValue}>
                            {new Date(u.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </Text>
                          <Text style={styles.userStatLabel}>Joined</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'orders' && (
              <View style={styles.section}>
                <View style={styles.searchWrap}>
                  <Search color={caribuTheme.muted} size={16} />
                  <TextInput
                    value={orderSearch}
                    onChangeText={setOrderSearch}
                    placeholder="Search orders..."
                    placeholderTextColor={caribuTheme.muted}
                    style={styles.searchInput}
                    testID="admin-order-search"
                  />
                </View>

                {filteredOrders.length === 0 ? (
                  <View style={styles.emptyState}>
                    <ShoppingBag color={caribuTheme.muted} size={32} />
                    <Text style={styles.emptyText}>No orders yet</Text>
                    <Text style={styles.emptySubtext}>
                      Orders will appear here as customers place them
                    </Text>
                  </View>
                ) : (
                  filteredOrders.map((o) => (
                    <Pressable
                      key={o.id}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setExpandedOrderId((prev) => (prev === o.id ? null : o.id));
                      }}
                      style={styles.orderCard}
                      testID={`admin-order-${o.id}`}
                    >
                      <View style={styles.orderCardTop}>
                        <View style={styles.orderRefWrap}>
                          <Text style={styles.orderRef}>{o.reference}</Text>
                          <Text style={styles.orderDate}>
                            {new Date(o.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <View style={styles.orderRight}>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: ORDER_STATUS_COLORS[o.status] + '18' },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: ORDER_STATUS_COLORS[o.status] },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                { color: ORDER_STATUS_COLORS[o.status] },
                              ]}
                            >
                              {o.status}
                            </Text>
                          </View>
                          {expandedOrderId === o.id ? (
                            <ChevronUp color={caribuTheme.muted} size={16} />
                          ) : (
                            <ChevronDown color={caribuTheme.muted} size={16} />
                          )}
                        </View>
                      </View>

                      <View style={styles.orderSummary}>
                        <Text style={styles.orderCustomer}>{o.userName}</Text>
                        <Text style={styles.orderTotal}>£{o.total.toFixed(2)}</Text>
                      </View>

                      {expandedOrderId === o.id && (
                        <View style={styles.orderExpanded}>
                          <View style={styles.orderDetailRow}>
                            <Text style={styles.orderDetailLabel}>Email</Text>
                            <Text style={styles.orderDetailValue}>{o.userEmail}</Text>
                          </View>
                          <View style={styles.orderDetailRow}>
                            <Text style={styles.orderDetailLabel}>Items</Text>
                            <Text style={styles.orderDetailValue}>{o.itemCount}</Text>
                          </View>
                          {o.promoCode && (
                            <View style={styles.orderDetailRow}>
                              <Text style={styles.orderDetailLabel}>Promo</Text>
                              <Text style={[styles.orderDetailValue, { color: caribuTheme.forest }]}>
                                {o.promoCode} (-{o.discountApplied}%)
                              </Text>
                            </View>
                          )}
                          <View style={styles.statusActions}>
                            <Text style={styles.statusActionsLabel}>Update status:</Text>
                            <View style={styles.statusBtns}>
                              {(
                                ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as AdminOrder['status'][]
                              ).map((status) => (
                                <Pressable
                                  key={status}
                                  onPress={() => handleUpdateOrderStatus(o.id, status)}
                                  style={[
                                    styles.statusActionBtn,
                                    o.status === status && styles.statusActionBtnActive,
                                    {
                                      borderColor: ORDER_STATUS_COLORS[status],
                                    },
                                  ]}
                                  testID={`admin-order-status-${o.id}-${status}`}
                                >
                                  <Text
                                    style={[
                                      styles.statusActionText,
                                      {
                                        color: o.status === status
                                          ? caribuTheme.white
                                          : ORDER_STATUS_COLORS[status],
                                      },
                                    ]}
                                  >
                                    {status}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {activeTab === 'promos' && (
              <View style={styles.section}>
                <View style={styles.promoOverview}>
                  <Text style={styles.promoTitle}>Promotions Overview</Text>
                  <Text style={styles.promoSubtext}>
                    Track promotion usage across all users
                  </Text>
                </View>

                <View style={styles.promoCards}>
                  <View style={styles.promoCard}>
                    <View style={[styles.promoIcon, { backgroundColor: '#F0FDF4' }]}>
                      <Text style={styles.promoIconText}>20%</Text>
                    </View>
                    <Text style={styles.promoCardTitle}>Welcome Bonus</Text>
                    <Text style={styles.promoCardDesc}>
                      Auto-granted on sign-up. One-time use.
                    </Text>
                    <View style={styles.promoCardStat}>
                      <Text style={styles.promoCardStatNum}>{stats.totalUsers}</Text>
                      <Text style={styles.promoCardStatLabel}>issued</Text>
                    </View>
                  </View>

                  <View style={styles.promoCard}>
                    <View style={[styles.promoIcon, { backgroundColor: '#EEF2FF' }]}>
                      <Text style={[styles.promoIconText, { color: '#4F46E5' }]}>25%</Text>
                    </View>
                    <Text style={styles.promoCardTitle}>Referral Reward</Text>
                    <Text style={styles.promoCardDesc}>
                      Unlocked when a referred user signs up.
                    </Text>
                    <View style={styles.promoCardStat}>
                      <Text style={styles.promoCardStatNum}>{stats.referralCount}</Text>
                      <Text style={styles.promoCardStatLabel}>referrals</Text>
                    </View>
                  </View>

                  <View style={styles.promoCard}>
                    <View style={[styles.promoIcon, { backgroundColor: '#FFF7ED' }]}>
                      <Text style={[styles.promoIconText, { color: '#EA580C' }]}>10%</Text>
                    </View>
                    <Text style={styles.promoCardTitle}>Social Follow</Text>
                    <Text style={styles.promoCardDesc}>
                      Granted when user follows on social media.
                    </Text>
                    <View style={styles.promoCardStat}>
                      <Text style={styles.promoCardStatNum}>{stats.promoRedemptions}</Text>
                      <Text style={styles.promoCardStatLabel}>redeemed</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    color: caribuTheme.ink,
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: caribuTheme.muted,
    fontSize: 14,
    marginBottom: 12,
  },
  inputWrap: {
    width: '100%',
  },
  input: {
    backgroundColor: caribuTheme.surface,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderRadius: 14,
    paddingHorizontal: 20,
    height: 54,
    fontSize: 18,
    fontWeight: '600' as const,
    color: caribuTheme.ink,
    textAlign: 'center',
    letterSpacing: 8,
  },
  inputError: {
    borderColor: caribuTheme.error,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: caribuTheme.error,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  submitBtn: {
    backgroundColor: caribuTheme.charcoal,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.88,
  },
  submitBtnText: {
    color: caribuTheme.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  hint: {
    color: caribuTheme.muted,
    fontSize: 12,
    marginTop: 16,
    fontStyle: 'italic' as const,
  },
});

const statStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%' as unknown as number,
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    borderLeftWidth: 3,
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: caribuTheme.ink,
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  label: {
    color: caribuTheme.muted,
    fontSize: 12,
    fontWeight: '500' as const,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: caribuTheme.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: caribuTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  backBtnPressed: {
    backgroundColor: caribuTheme.card,
  },
  headerTitle: {
    color: caribuTheme.ink,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: caribuTheme.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: caribuTheme.charcoal,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: caribuTheme.muted,
  },
  tabLabelActive: {
    color: caribuTheme.white,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    gap: 14,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: caribuTheme.forest,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  exportBtnText: {
    color: caribuTheme.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: caribuTheme.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: caribuTheme.ink,
    fontSize: 14,
    height: 46,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    color: caribuTheme.ink,
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  emptySubtext: {
    color: caribuTheme.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    gap: 14,
  },
  userCardDeleted: {
    opacity: 0.5,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: caribuTheme.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: caribuTheme.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: caribuTheme.ink,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  userEmail: {
    color: caribuTheme.muted,
    fontSize: 12,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userStats: {
    flexDirection: 'row',
    backgroundColor: caribuTheme.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  userStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  userStatValue: {
    color: caribuTheme.ink,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  userStatLabel: {
    color: caribuTheme.muted,
    fontSize: 10,
    fontWeight: '500' as const,
  },
  userStatDivider: {
    width: 1,
    backgroundColor: caribuTheme.line,
    marginVertical: 2,
  },
  orderCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    gap: 10,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderRefWrap: {
    gap: 2,
  },
  orderRef: {
    color: caribuTheme.ink,
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  orderDate: {
    color: caribuTheme.muted,
    fontSize: 11,
  },
  orderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCustomer: {
    color: caribuTheme.ink,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  orderTotal: {
    color: caribuTheme.forest,
    fontSize: 16,
    fontWeight: '800' as const,
  },
  orderExpanded: {
    borderTopWidth: 1,
    borderTopColor: caribuTheme.line,
    paddingTop: 12,
    gap: 8,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDetailLabel: {
    color: caribuTheme.muted,
    fontSize: 13,
  },
  orderDetailValue: {
    color: caribuTheme.ink,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statusActions: {
    marginTop: 4,
    gap: 8,
  },
  statusActionsLabel: {
    color: caribuTheme.muted,
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  statusBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActionBtnActive: {
    backgroundColor: caribuTheme.charcoal,
    borderColor: caribuTheme.charcoal,
  },
  statusActionText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  promoOverview: {
    gap: 4,
  },
  promoTitle: {
    color: caribuTheme.ink,
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  promoSubtext: {
    color: caribuTheme.muted,
    fontSize: 14,
  },
  promoCards: {
    gap: 12,
  },
  promoCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    gap: 8,
  },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoIconText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: caribuTheme.forest,
  },
  promoCardTitle: {
    color: caribuTheme.ink,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  promoCardDesc: {
    color: caribuTheme.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  promoCardStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  promoCardStatNum: {
    color: caribuTheme.ink,
    fontSize: 22,
    fontWeight: '800' as const,
  },
  promoCardStatLabel: {
    color: caribuTheme.muted,
    fontSize: 13,
  },
});
