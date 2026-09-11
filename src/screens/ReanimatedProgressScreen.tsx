import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { BackHandler, Platform, PredictiveBackAnimatedView, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useEvent,
  useSharedValue,
} from 'react-native-reanimated';

import type { RootStackParamList } from '../NavigationDemo';

type Props = NativeStackScreenProps<RootStackParamList, 'ReanimatedProgress'>;

type ProgressEvent = {
  progress: number;
};

// useEvent only attaches on a Reanimated host. The public view is already
// wrapped with RN Animated for Animated.event; wrap again so the worklet
// registers on the UI thread.
const ReanimatedPredictiveBack = Reanimated.createAnimatedComponent(PredictiveBackAnimatedView);

/**
 * Same PredictiveBackAnimatedView event as AnimatedProgressScreen, consumed
 * with Reanimated's useEvent instead of Animated.event.
 */
export function ReanimatedProgressScreen(_props: Props): React.JSX.Element {
  const progress = useSharedValue(0);

  const onProgress = useEvent<ProgressEvent>(
    (event) => {
      'worklet';
      progress.value = event.progress;
    },
    ['onProgress'],
  );

  useFocusEffect(
    React.useCallback(() => {
      const claim = BackHandler.claimPredictiveBack();
      return () => claim.remove();
    }, []),
  );

  const boxStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 0.8]) },
      { translateX: interpolate(progress.value, [0, 1], [0, 32]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [1, 0.6]),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Swipe from the left edge. Only the box animates: it is driven by
        PredictiveBackAnimatedView through Reanimated useEvent. The stack
        screen itself does not move.
      </Text>
      {Platform.OS === 'android' ? <ReanimatedPredictiveBack onProgress={onProgress} /> : null}
      <Reanimated.View style={[styles.box, boxStyle]} />
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
    backgroundColor: '#a855f7',
  },
});
