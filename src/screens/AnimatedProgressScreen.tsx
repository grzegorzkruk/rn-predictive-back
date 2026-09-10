import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { useMemo } from 'react';
import {
  Animated,
  BackHandler,
  Platform,
  PredictiveBackAnimatedView,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';

import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'AnimatedProgress'>;

/**
 * The single supported way to read predictive-back progress from JavaScript:
 * a host view that emits a Fabric direct event, consumed by Animated.event on
 * the native driver. Reanimated can consume the same event with useEvent.
 */
export function AnimatedProgressScreen(_props: Props): React.JSX.Element {
  const progress = useAnimatedValue(0);

  const onProgress = useMemo(
    () => Animated.event([{ nativeEvent: { progress } }], { useNativeDriver: true }),
    [progress],
  );

  // This screen can pop, so RN has to consume the gesture while it is focused.
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }
      BackHandler.setInterceptEnabled(true);
      return () => BackHandler.setInterceptEnabled(false);
    }, []),
  );

  const boxStyle = useMemo(
    () => [
      styles.box,
      {
        transform: [
          {
            scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }),
          },
          {
            translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 32] }),
          },
        ],
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }),
      },
    ],
    [progress],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Swipe from the left edge. Only the box animates: it is driven by
        PredictiveBackAnimatedView through the native Animated driver. The stack
        screen itself does not move.
      </Text>
      {Platform.OS === 'android' ? <PredictiveBackAnimatedView onProgress={onProgress} /> : null}
      <Animated.View style={boxStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  hint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  box: {
    width: 140,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
  },
});
