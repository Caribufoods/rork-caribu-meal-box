import React, { useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Home,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  Tag,
  MessageCircle,
  LogIn,
  LogOut,
  ChevronRight,
  Bell,
  Moon,
  UtensilsCrossed,
  Trash2,
  Shield,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { caribuTheme } from '@/constants/caribu-theme';
import { useAuth } from '@/providers/auth-provider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

const logoImage = 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/8vpd7aucvwric7vv5ajx7';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
}

const DrawerItem = React.memo(function DrawerItem({ icon, label, onPress, showChevron = true }: DrawerItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.drawerItem, pressed && styles.drawerItemPressed]}
      testID={`drawer-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <View style={styles.drawerItemLeft}>
        {icon}
        <Text style={styles.drawerItemLabel}>{label}</Text>
      </View>
      {showChevron && <ChevronRight color={caribuTheme.muted} size={16} />}
    </Pressable>
  );
});

export default function DrawerMenu({ visible, onClose, onNavigate }: DrawerMenuProps) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const { user, isLoggedIn, signOut, deleteAccount } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 26,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
      setShowSettings(false);
    }
  }, [visible, slideAnim, overlayOpacity]);

  const handleNav = useCallback((route: string) => {
    void Haptics.selectionAsync();
    onClose();
    setTimeout(() => onNavigate(route), 300);
  }, [onClose, onNavigate]);

  const handleOverlayPress = useCallback(() => {
    void Haptics.selectionAsync();
    onClose();
  }, [onClose]);

  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const handleSignOut = useCallback(async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onClose();
    await signOut();
  }, [onClose, signOut]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? All your data will be permanently removed. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            onClose();
            await deleteAccount();
          },
        },
      ],
    );
  }, [onClose, deleteAccount]);

  const initials = React.useMemo(() => {
    if (!user?.name) return '??';
    const parts = user.name.split(' ');
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 2);
  }, [user?.name]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} testID="drawer-menu">
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayPress} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.headerRow}>
            <Image source={{ uri: logoImage }} style={styles.drawerLogo} contentFit="contain" />
            <Pressable
              onPress={handleOverlayPress}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
              testID="drawer-close"
            >
              <X color={caribuTheme.muted} size={20} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            <View style={styles.userSection}>
              {isLoggedIn && user ? (
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => handleNav('/sign-in')}
                  style={({ pressed }) => [styles.signInBtn, pressed && styles.signInBtnPressed]}
                  testID="drawer-sign-in"
                >
                  <LogIn color={caribuTheme.white} size={18} />
                  <Text style={styles.signInText}>Sign In / Create Account</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>Navigation</Text>
              <DrawerItem
                icon={<Home color={caribuTheme.forest} size={20} />}
                label="Home"
                onPress={() => handleNav('/')}
              />
              <DrawerItem
                icon={<UtensilsCrossed color={caribuTheme.forest} size={20} />}
                label="Menus"
                onPress={() => handleNav('/menus')}
              />
              <DrawerItem
                icon={<ShoppingBag color={caribuTheme.forest} size={20} />}
                label="My Orders"
                onPress={() => handleNav('/cart')}
              />
              <DrawerItem
                icon={<Heart color={caribuTheme.forest} size={20} />}
                label="Favorites"
                onPress={() => handleNav('/menu')}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.navSection}>
              <Text style={styles.sectionTitle}>Account & Settings</Text>
              <DrawerItem
                icon={<MapPin color={caribuTheme.forest} size={20} />}
                label="Addresses"
                onPress={() => handleNav('/details')}
              />
              <DrawerItem
                icon={<CreditCard color={caribuTheme.forest} size={20} />}
                label="Payment Methods"
                onPress={() => handleNav('/details')}
              />
              <DrawerItem
                icon={<Settings color={caribuTheme.forest} size={20} />}
                label="Settings"
                onPress={() => {
                  void Haptics.selectionAsync();
                  setShowSettings((prev) => !prev);
                }}
                showChevron={!showSettings}
              />
              {showSettings && (
                <View style={styles.settingsPanel}>
                  <View style={styles.settingsRow}>
                    <View style={styles.settingsRowLeft}>
                      <Bell color={caribuTheme.muted} size={17} />
                      <Text style={styles.settingsLabel}>Notifications</Text>
                    </View>
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ false: caribuTheme.line, true: caribuTheme.forest }}
                      thumbColor={caribuTheme.white}
                    />
                  </View>
                  <View style={styles.settingsRow}>
                    <View style={styles.settingsRowLeft}>
                      <Moon color={caribuTheme.muted} size={17} />
                      <Text style={styles.settingsLabel}>Dark Mode</Text>
                    </View>
                    <Switch
                      value={darkModeEnabled}
                      onValueChange={setDarkModeEnabled}
                      trackColor={{ false: caribuTheme.line, true: caribuTheme.forest }}
                      thumbColor={caribuTheme.white}
                    />
                  </View>
                </View>
              )}
              <DrawerItem
                icon={<Tag color={caribuTheme.forest} size={20} />}
                label="Promotions & Offers"
                onPress={() => handleNav('/promotions')}
              />
              <DrawerItem
                icon={<MessageCircle color={caribuTheme.forest} size={20} />}
                label="Contact Us"
                onPress={() => openLink('mailto:hello@caribu.com')}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.navSection}>
              <DrawerItem
                icon={<Shield color={caribuTheme.forest} size={20} />}
                label="Admin Dashboard"
                onPress={() => handleNav('/admin')}
              />
            </View>

            {isLoggedIn && (
              <>
                <View style={styles.divider} />
                <Pressable
                  onPress={handleSignOut}
                  style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
                  testID="drawer-sign-out"
                >
                  <LogOut color={caribuTheme.error} size={18} />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteAccount}
                  style={({ pressed }) => [styles.deleteAccountBtn, pressed && styles.signOutBtnPressed]}
                  testID="drawer-delete-account"
                >
                  <Trash2 color={caribuTheme.error} size={18} />
                  <Text style={styles.deleteAccountText}>Delete Account</Text>
                </Pressable>
              </>
            )}

            <View style={styles.bottomSpacer} />
          </ScrollView>

          <View style={styles.socialSection}>
            <View style={styles.socialDivider} />
            <View style={styles.socialRow}>
              <Pressable
                onPress={() => openLink('https://instagram.com/caribu')}
                style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed]}
                testID="drawer-instagram"
              >
                <Text style={styles.socialIcon}>IG</Text>
              </Pressable>
              <Pressable
                onPress={() => openLink('https://tiktok.com/@caribu')}
                style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed]}
                testID="drawer-tiktok"
              >
                <Text style={styles.socialIcon}>TT</Text>
              </Pressable>
            </View>
            <Text style={styles.versionText}>Caribu v1.0</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: caribuTheme.surface,
    ...(Platform.OS === 'web'
      ? { boxShadow: '8px 0px 32px rgba(0,0,0,0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 8, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 32,
          elevation: 24,
        }),
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 16,
  },
  drawerLogo: {
    width: 100,
    height: 30,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: caribuTheme.line,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  userSection: {
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: caribuTheme.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: caribuTheme.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: caribuTheme.ink,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  userEmail: {
    color: caribuTheme.muted,
    fontSize: 13,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: caribuTheme.charcoal,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  signInBtnPressed: {
    opacity: 0.88,
  },
  signInText: {
    color: caribuTheme.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: caribuTheme.line,
    marginHorizontal: 22,
    marginVertical: 14,
  },
  navSection: {
    paddingHorizontal: 10,
  },
  sectionTitle: {
    color: caribuTheme.muted,
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.4,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  drawerItemPressed: {
    backgroundColor: caribuTheme.card,
  },
  drawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  drawerItemLabel: {
    color: caribuTheme.ink,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  settingsPanel: {
    marginLeft: 46,
    marginRight: 12,
    backgroundColor: caribuTheme.card,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsLabel: {
    color: caribuTheme.ink,
    fontSize: 14,
    fontWeight: '400' as const,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  signOutBtnPressed: {
    opacity: 0.7,
  },
  signOutText: {
    color: caribuTheme.error,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  deleteAccountText: {
    color: caribuTheme.error,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  bottomSpacer: {
    height: 20,
  },
  socialSection: {
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  socialDivider: {
    height: 1,
    backgroundColor: caribuTheme.line,
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  socialBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: caribuTheme.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: caribuTheme.line,
  },
  socialBtnPressed: {
    backgroundColor: caribuTheme.line,
  },
  socialIcon: {
    color: caribuTheme.ink,
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  versionText: {
    color: caribuTheme.muted,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
