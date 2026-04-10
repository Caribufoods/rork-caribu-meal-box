import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { X, Flame, Leaf, Award, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { caribuTheme } from '@/constants/caribu-theme';
import type { MenuItem, MenuTag } from '@/types/caribu';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

const TAG_CONFIG: Record<MenuTag, { label: string; bg: string; fg: string }> = {
  vegetarian: { label: 'Vegetarian', bg: '#E8F5E9', fg: '#2E7D32' },
  'chefs-pick': { label: "Chef's Pick", bg: '#FFF8E1', fg: '#F57F17' },
};

const ALLERGEN_INFO: Record<string, string[]> = {
  'starter-doubles': ['Gluten', 'Mustard'],
  'starter-jamaican-patty': ['Gluten', 'Egg'],
  'starter-bajan-fish-cakes': ['Fish', 'Gluten', 'Egg'],
  'main-jerk-chicken': ['Soy'],
  'main-curry-goat': ['Mustard'],
  'main-oxtail': ['Soy', 'Celery'],
  'main-flying-fish': ['Fish', 'Gluten'],
  'main-channa-aloo': ['Mustard'],
  'side-rice-peas': ['None'],
  'side-roti': ['Gluten'],
  'side-callaloo': ['None'],
};

interface ItemDetailSheetProps {
  item: MenuItem | null;
  visible: boolean;
  onClose: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export default function ItemDetailSheet({ item, visible, onClose, onSelect, isSelected }: ItemDetailSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 12,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, overlayOpacity]);

  const handleClose = useCallback(() => {
    void Haptics.selectionAsync();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [translateY, overlayOpacity, onClose]);

  const handleSelect = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect?.();
    handleClose();
  }, [onSelect, handleClose]);

  if (!visible || !item) return null;

  const allergens = ALLERGEN_INFO[item.id] ?? ['Not specified'];

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={sheetStyles.container}>
        <Animated.View style={[sheetStyles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[sheetStyles.sheet, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={sheetStyles.handle} />

          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [sheetStyles.closeBtn, pressed && sheetStyles.closeBtnPressed]}
            testID="sheet-close"
          >
            <X color={caribuTheme.white} size={18} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Image source={{ uri: item.image }} style={sheetStyles.heroImage} contentFit="cover" transition={300} />

            <View style={sheetStyles.body}>
              <View style={sheetStyles.nameRow}>
                <Text style={sheetStyles.itemName}>{item.name}</Text>
                <Text style={sheetStyles.itemPrice}>£{item.price.toFixed(2)}</Text>
              </View>

              <Text style={sheetStyles.itemDesc}>{item.description}</Text>

              {item.tags && item.tags.length > 0 && (
                <View style={sheetStyles.tagRow}>
                  {item.tags.map((tag) => {
                    const config = TAG_CONFIG[tag];
                    return (
                      <View key={tag} style={[sheetStyles.tagBadge, { backgroundColor: config.bg }]}>
                        {tag === 'vegetarian' ? (
                          <Leaf size={11} color={config.fg} />
                        ) : (
                          <Award size={11} color={config.fg} />
                        )}
                        <Text style={[sheetStyles.tagText, { color: config.fg }]}>{config.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={sheetStyles.statsRow}>
                <View style={sheetStyles.statItem}>
                  <Flame size={14} color={caribuTheme.forest} />
                  <Text style={sheetStyles.statValue}>{item.calories}</Text>
                  <Text style={sheetStyles.statLabel}>kcal</Text>
                </View>
                <View style={sheetStyles.statDivider} />
                <View style={sheetStyles.statItem}>
                  <Text style={sheetStyles.statValue}>{item.category}</Text>
                  <Text style={sheetStyles.statLabel}>course</Text>
                </View>
              </View>

              <View style={sheetStyles.allergenSection}>
                <View style={sheetStyles.allergenHeader}>
                  <Info size={14} color={caribuTheme.muted} />
                  <Text style={sheetStyles.allergenTitle}>Allergen Information</Text>
                </View>
                <View style={sheetStyles.allergenTags}>
                  {allergens.map((a) => (
                    <View key={a} style={sheetStyles.allergenChip}>
                      <Text style={sheetStyles.allergenChipText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {onSelect && (
                <Pressable
                  onPress={handleSelect}
                  style={({ pressed }) => [
                    sheetStyles.selectBtn,
                    isSelected && sheetStyles.selectBtnSelected,
                    pressed && sheetStyles.pressed,
                  ]}
                  testID="sheet-select-item"
                >
                  <Text style={sheetStyles.selectBtnText}>
                    {isSelected ? 'Selected' : 'Select This Item'}
                  </Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: caribuTheme.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    zIndex: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  body: {
    padding: 22,
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800' as const,
    color: caribuTheme.ink,
    letterSpacing: -0.6,
  },
  itemPrice: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: caribuTheme.forest,
  },
  itemDesc: {
    fontSize: 15,
    lineHeight: 23,
    color: caribuTheme.muted,
    letterSpacing: 0.1,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: caribuTheme.card,
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: caribuTheme.ink,
    textTransform: 'capitalize' as const,
  },
  statLabel: {
    fontSize: 13,
    color: caribuTheme.muted,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: caribuTheme.line,
  },
  allergenSection: {
    gap: 10,
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allergenTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: caribuTheme.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  allergenTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenChip: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  allergenChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#E65100',
  },
  selectBtn: {
    backgroundColor: caribuTheme.forest,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  selectBtnSelected: {
    backgroundColor: caribuTheme.charcoal,
  },
  selectBtnText: {
    color: caribuTheme.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
