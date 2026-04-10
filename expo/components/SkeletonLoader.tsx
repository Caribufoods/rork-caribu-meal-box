import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { caribuTheme } from '@/constants/caribu-theme';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

export default function SkeletonLoader({ width, height, borderRadius = 8, style }: SkeletonLoaderProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        skeletonStyles.base,
        {
          width: width as number,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonLoader width={120} height={120} borderRadius={12} />
      <View style={skeletonStyles.cardBody}>
        <SkeletonLoader width="70%" height={16} borderRadius={6} />
        <SkeletonLoader width="90%" height={12} borderRadius={4} />
        <SkeletonLoader width="40%" height={12} borderRadius={4} />
        <View style={skeletonStyles.cardFooter}>
          <SkeletonLoader width={50} height={14} borderRadius={4} />
          <SkeletonLoader width={50} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonMenuList() {
  return (
    <View style={skeletonStyles.list}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  base: {
    backgroundColor: caribuTheme.line,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: caribuTheme.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: caribuTheme.line,
    padding: 0,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 8,
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  list: {
    gap: 12,
  },
});
