import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ChevronDown, ChevronUp, Flame, Leaf, Award } from 'lucide-react-native';

import { caribuTheme } from '@/constants/caribu-theme';
import { useCaribu } from '@/providers/caribu-provider';
import { sauceOptions } from '@/mocks/caribu-menu';
import { MenuCategory, MenuTag, SauceLevel } from '@/types/caribu';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

function MenuRow({
  item,
}: {
  item: { id: string; name: string; description: string; price: number; tags?: MenuTag[] };
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

export default function MenuScreen() {
  const router = useRouter();
  const { menuItems } = useCaribu();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [selectedSauce, setSelectedSauce] = useState<SauceLevel>('mild');

  const grouped = useMemo(() => {
    return sectionOrder.map((category) => ({
      category,
      items: menuItems.filter((item) => item.category === category),
    }));
  }, [menuItems]);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroAccent} />
          <Text style={styles.heroTitle}>Island Indulgence</Text>
          <Text style={styles.heroSubtitle}>
            A curated Caribbean dining experience inspired by authentic street food and home-style island cooking.
          </Text>

          <Pressable onPress={toggleExpanded} style={styles.expandToggle} testID="expand-description">
            <Text style={styles.expandToggleText}>{expanded ? 'View Less' : 'View More'}</Text>
            {expanded ? (
              <ChevronUp size={14} color={caribuTheme.forest} />
            ) : (
              <ChevronDown size={14} color={caribuTheme.forest} />
            )}
          </Pressable>

          {expanded && (
            <View style={styles.expandedContent}>
              <Text style={styles.expandedText}>
                Island Indulgence brings together bold, soulful dishes rooted in the culinary traditions of Jamaica, Trinidad & Tobago, and Barbados. Each recipe reflects heritage, culture, and time-honoured cooking techniques.
              </Text>
              <Text style={styles.expandedText}>
                Expect rich, layered flavours—smoky, savoury, aromatic, and gently spiced—crafted to deliver comfort and depth in every bite. This collection is curated in collaboration with a celebrated Caribbean chef, offering a modern interpretation of authentic island cuisine.
              </Text>
            </View>
          )}
        </View>

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
                  <MenuRow item={item} />
                  {index < section.items.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>

            {sectionIndex < grouped.length - 1 && <View style={styles.sectionDivider} />}
          </View>
        ))}

        <SauceSelector selected={selectedSauce} onSelect={setSelectedSauce} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push('/builder')}
          style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          testID="menu-build-button"
        >
          <Text style={styles.footerButtonText}>Build Your Box</Text>
          <ArrowRight color={caribuTheme.white} size={18} />
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
    paddingBottom: 100,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: caribuTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: caribuTheme.line,
    position: 'relative',
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: caribuTheme.forest,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: caribuTheme.muted,
    letterSpacing: 0.1,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  expandToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: caribuTheme.forest,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: caribuTheme.line,
    gap: 12,
  },
  expandedText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A4A45',
    letterSpacing: 0.1,
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
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
    fontSize: 20,
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
    marginHorizontal: 20,
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: caribuTheme.line,
    overflow: 'hidden',
  },
  menuRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  menuRowLeft: {
    flex: 1,
    gap: 4,
  },
  menuRowName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.1,
  },
  menuRowDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: caribuTheme.muted,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  menuRowPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: caribuTheme.forest,
    paddingTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: caribuTheme.line,
    marginHorizontal: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: caribuTheme.line,
    marginHorizontal: 24,
    marginTop: 24,
  },
  sauceSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 6,
  },
  sauceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sauceSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.2,
  },
  sauceSectionSub: {
    fontSize: 13,
    color: caribuTheme.muted,
    marginBottom: 12,
  },
  sauceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sauceCard: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: caribuTheme.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: caribuTheme.line,
    gap: 6,
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sauceName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: caribuTheme.ink,
  },
  sauceNameActive: {
    color: caribuTheme.forest,
  },
  sauceDesc: {
    fontSize: 11,
    color: caribuTheme.muted,
    lineHeight: 15,
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
