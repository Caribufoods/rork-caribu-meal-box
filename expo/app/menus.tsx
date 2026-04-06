import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Leaf,
  Lock,
} from 'lucide-react-native';

import { caribuTheme } from '@/constants/caribu-theme';
import { useCaribu } from '@/providers/caribu-provider';
import { sauceOptions } from '@/mocks/caribu-menu';
import { MenuCategory, MenuTag, SauceLevel } from '@/types/caribu';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MenuOption {
  id: string;
  title: string;
  tagline: string;
  available: boolean;
  region: string;
}

const MENU_OPTIONS: MenuOption[] = [
  {
    id: 'island-indulgence',
    title: 'Island Indulgence',
    tagline: 'A curated Caribbean dining experience inspired by authentic street food and home-style island cooking.',
    available: true,
    region: 'Caribbean',
  },
  {
    id: 'west-african-djembe',
    title: 'West African Djembe',
    tagline: 'Bold, aromatic West African flavours rooted in tradition — jollof, suya, and soulful stews.',
    available: false,
    region: 'West Africa',
  },
  {
    id: 'east-african-affair',
    title: 'East African Affair',
    tagline: 'Fragrant spices and coastal influences from Kenya, Ethiopia, and Tanzania.',
    available: false,
    region: 'East Africa',
  },
];

const sectionOrder: MenuCategory[] = ['starters', 'mains', 'sides'];
const sectionLabels: Record<MenuCategory, string> = {
  starters: 'Starters',
  mains: 'Mains',
  sides: 'Sides',
};

const TAG_CONFIG: Record<MenuTag, { label: string; bg: string; fg: string; icon: 'leaf' | 'award' }> = {
  'vegetarian': { label: 'Vegetarian', bg: '#E8F5E9', fg: '#2E7D32', icon: 'leaf' },
  'chefs-pick': { label: "Chef's Pick", bg: '#FFF8E1', fg: '#F57F17', icon: 'award' },
};

const SPICE_COLORS = ['#7CB342', '#FBC02D', '#EF6C00', '#C62828'];

function TagBadge({ tag }: { tag: MenuTag }) {
  const config = TAG_CONFIG[tag];
  return (
    <View style={[tagStyles.badge, { backgroundColor: config.bg }]}>
      {config.icon === 'leaf' ? (
        <Leaf size={10} color={config.fg} />
      ) : (
        <Award size={10} color={config.fg} />
      )}
      <Text style={[tagStyles.badgeText, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
});

function MenuItemRow({
  item,
  onPress,
}: {
  item: { id: string; name: string; description: string; price: number; tags?: MenuTag[] };
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.98, friction: 8, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={styles.menuRow}
        testID={`menu-item-${item.id}`}
      >
        <View style={styles.menuRowContent}>
          <View style={styles.menuRowLeft}>
            <Text style={styles.menuRowName}>{item.name}</Text>
            <Text style={styles.menuRowDesc} numberOfLines={2}>{item.description}</Text>
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </View>
            )}
          </View>
          <Text style={styles.menuRowPrice}>£{item.price.toFixed(2)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function SauceSelector({
  selected,
  onSelect,
}: {
  selected: SauceLevel;
  onSelect: (level: SauceLevel) => void;
}) {
  return (
    <View style={styles.sauceSection}>
      <View style={styles.sauceTitleRow}>
        <Flame size={16} color={caribuTheme.ink} />
        <Text style={styles.sauceSectionTitle}>Sauce / Spice Add-On</Text>
      </View>
      <Text style={styles.sauceSectionSub}>All dishes default to mild. Upgrade your heat below.</Text>
      <View style={styles.sauceGrid}>
        {sauceOptions.map((sauce) => {
          const active = sauce.id === selected;
          return (
            <Pressable
              key={sauce.id}
              onPress={() => onSelect(sauce.id)}
              style={[styles.sauceCard, active && styles.sauceCardActive]}
              testID={`sauce-${sauce.id}`}
            >
              <View style={styles.sauceIntensityRow}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.spiceDot,
                      {
                        backgroundColor: i < sauce.intensity ? SPICE_COLORS[sauce.intensity - 1] : caribuTheme.line,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.sauceName, active && styles.sauceNameActive]}>{sauce.name}</Text>
              <Text style={[styles.sauceDesc, active && styles.sauceDescActive]}>{sauce.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MenuCard({
  menu,
  isExpanded,
  onToggle,
}: {
  menu: MenuOption;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (menu.available) {
      Animated.spring(scaleAnim, { toValue: 0.975, friction: 8, useNativeDriver: true }).start();
    }
  }, [menu.available, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={menu.available ? onToggle : undefined}
        style={[
          styles.menuCard,
          !menu.available && styles.menuCardDisabled,
          isExpanded && styles.menuCardExpanded,
        ]}
        testID={`menu-card-${menu.id}`}
      >
        <View style={styles.menuCardHeader}>
          <View style={styles.menuCardTitleRow}>
            <View style={styles.menuCardTitleWrap}>
              <Text style={[styles.menuCardTitle, !menu.available && styles.menuCardTitleDisabled]}>
                {menu.title}
              </Text>
              <Text style={styles.menuCardRegion}>{menu.region}</Text>
            </View>
            {menu.available ? (
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
                <Text style={styles.availableBadgeText}>Available</Text>
              </View>
            ) : (
              <View style={styles.comingSoonBadge}>
                <Clock size={11} color={caribuTheme.muted} />
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </View>
          <Text style={[styles.menuCardTagline, !menu.available && styles.menuCardTaglineDisabled]}>
            {menu.tagline}
          </Text>
          {menu.available && (
            <View style={styles.menuCardAction}>
              {isExpanded ? (
                <ChevronUp size={16} color={caribuTheme.forest} />
              ) : (
                <ChevronDown size={16} color={caribuTheme.forest} />
              )}
              <Text style={styles.menuCardActionText}>
                {isExpanded ? 'Collapse Menu' : 'View Full Menu'}
              </Text>
            </View>
          )}
          {!menu.available && (
            <View style={styles.lockedRow}>
              <Lock size={13} color={caribuTheme.muted} />
              <Text style={styles.lockedText}>This menu is not yet available</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MenusScreen() {
  const router = useRouter();
  const { menuItems } = useCaribu();
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);
  const [selectedSauce, setSelectedSauce] = useState<SauceLevel>('mild');

  const grouped = useMemo(() => {
    return sectionOrder.map((category) => ({
      category,
      items: menuItems.filter((item) => item.category === category),
    }));
  }, [menuItems]);

  const toggleMenu = useCallback((menuId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMenuId((prev) => (prev === menuId ? null : menuId));
    setDescriptionExpanded(false);
  }, []);

  const handleItemPress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMenuId(null);
  }, []);

  const toggleDescription = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescriptionExpanded((prev) => !prev);
  }, []);

  const isIslandExpanded = expandedMenuId === 'island-indulgence';

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderAccent} />
          <Text style={styles.pageTitle}>Our Menus</Text>
          <Text style={styles.pageSubtitle}>
            Explore our curated collections — each one a culinary journey through bold, soulful flavours.
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {MENU_OPTIONS.map((menu) => (
            <React.Fragment key={menu.id}>
              <MenuCard
                menu={menu}
                isExpanded={expandedMenuId === menu.id}
                onToggle={() => toggleMenu(menu.id)}
              />

              {expandedMenuId === menu.id && menu.available && (
                <View style={styles.expandedMenu}>
                  <View style={styles.expandedMenuInner}>
                    <Pressable onPress={toggleDescription} style={styles.expandToggle} testID="expand-description">
                      <Text style={styles.expandToggleText}>
                        {descriptionExpanded ? 'View Less' : 'About this menu'}
                      </Text>
                      {descriptionExpanded ? (
                        <ChevronUp size={14} color={caribuTheme.forest} />
                      ) : (
                        <ChevronDown size={14} color={caribuTheme.forest} />
                      )}
                    </Pressable>

                    {descriptionExpanded && (
                      <View style={styles.expandedDescription}>
                        <Text style={styles.expandedText}>
                          Island Indulgence brings together bold, soulful dishes rooted in the culinary traditions of Jamaica, Trinidad & Tobago, and Barbados. Each recipe reflects heritage, culture, and time-honoured cooking techniques.
                        </Text>
                        <Text style={styles.expandedText}>
                          Expect rich, layered flavours—smoky, savoury, aromatic, and gently spiced—crafted to deliver comfort and depth in every bite. This collection is curated in collaboration with a celebrated Caribbean chef, offering a modern interpretation of authentic island cuisine.
                        </Text>
                      </View>
                    )}

                    {grouped.map((section, sectionIndex) => (
                      <View key={section.category} style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <View style={styles.sectionLabelRow}>
                            <View style={styles.sectionDot} />
                            <Text style={styles.sectionTitle}>{sectionLabels[section.category]}</Text>
                          </View>
                          <Text style={styles.sectionCount}>{section.items.length} items</Text>
                        </View>

                        <View style={styles.sectionList}>
                          {section.items.map((item, index) => (
                            <React.Fragment key={item.id}>
                              <MenuItemRow item={item} onPress={handleItemPress} />
                              {index < section.items.length - 1 && <View style={styles.divider} />}
                            </React.Fragment>
                          ))}
                        </View>

                        {sectionIndex < grouped.length - 1 && <View style={styles.sectionDivider} />}
                      </View>
                    ))}

                    <SauceSelector selected={selectedSauce} onSelect={setSelectedSauce} />
                  </View>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {isIslandExpanded && (
        <View style={styles.footer}>
          <Pressable
            onPress={() => router.push('/builder')}
            style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
            testID="menus-build-button"
          >
            <Text style={styles.footerButtonText}>Build Your Box</Text>
            <ArrowRight color={caribuTheme.white} size={18} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: caribuTheme.background,
  },
  content: {
    paddingBottom: 100,
  },
  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: caribuTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: caribuTheme.line,
    position: 'relative',
    overflow: 'hidden',
  },
  pageHeaderAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: caribuTheme.forest,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: caribuTheme.muted,
    letterSpacing: 0.1,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 14,
  },
  menuCard: {
    backgroundColor: caribuTheme.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: caribuTheme.line,
    overflow: 'hidden',
  },
  menuCardDisabled: {
    opacity: 0.6,
    backgroundColor: caribuTheme.card,
  },
  menuCardExpanded: {
    borderColor: caribuTheme.forest,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  menuCardHeader: {
    padding: 20,
    gap: 10,
  },
  menuCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  menuCardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  menuCardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.3,
  },
  menuCardTitleDisabled: {
    color: caribuTheme.muted,
  },
  menuCardRegion: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: caribuTheme.muted,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  menuCardTagline: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5A5A52',
    letterSpacing: 0.1,
  },
  menuCardTaglineDisabled: {
    color: caribuTheme.muted,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: caribuTheme.forest,
  },
  availableBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: caribuTheme.forest,
    letterSpacing: 0.2,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: caribuTheme.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: caribuTheme.muted,
    letterSpacing: 0.2,
  },
  menuCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  menuCardActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: caribuTheme.forest,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lockedText: {
    fontSize: 12,
    color: caribuTheme.muted,
    fontWeight: '500' as const,
  },
  expandedMenu: {
    backgroundColor: caribuTheme.surface,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: caribuTheme.forest,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
  },
  expandedMenuInner: {
    paddingBottom: 24,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    alignSelf: 'flex-start',
  },
  expandToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: caribuTheme.forest,
  },
  expandedDescription: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: caribuTheme.line,
    marginBottom: 8,
    gap: 12,
  },
  expandedText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A4A45',
    letterSpacing: 0.1,
  },
  section: {
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: caribuTheme.forest,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 12,
    color: caribuTheme.muted,
    fontWeight: '500' as const,
  },
  sectionList: {
    marginHorizontal: 16,
    backgroundColor: caribuTheme.card,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  menuRowLeft: {
    flex: 1,
    gap: 4,
  },
  menuRowName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.1,
  },
  menuRowDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: caribuTheme.muted,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  menuRowPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: caribuTheme.forest,
    paddingTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: caribuTheme.line,
    marginHorizontal: 14,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: caribuTheme.line,
    marginHorizontal: 20,
    marginTop: 16,
  },
  sauceSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 6,
  },
  sauceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sauceSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.2,
  },
  sauceSectionSub: {
    fontSize: 12,
    color: caribuTheme.muted,
    marginBottom: 10,
  },
  sauceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sauceCard: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: caribuTheme.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: caribuTheme.line,
    gap: 5,
  },
  sauceCardActive: {
    borderColor: caribuTheme.forest,
    backgroundColor: '#F0F7F2',
  },
  sauceIntensityRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  spiceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  sauceName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: caribuTheme.ink,
  },
  sauceNameActive: {
    color: caribuTheme.forest,
  },
  sauceDesc: {
    fontSize: 10,
    color: caribuTheme.muted,
    lineHeight: 14,
  },
  sauceDescActive: {
    color: '#3A7D5C',
  },
  bottomSpacer: {
    height: 20,
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  footerButton: {
    backgroundColor: caribuTheme.forest,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  footerButtonText: {
    color: caribuTheme.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
