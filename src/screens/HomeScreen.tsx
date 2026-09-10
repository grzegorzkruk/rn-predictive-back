import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.lede}>
        Android asks who owns the back gesture before the swipe starts. These
        screens let you flip that decision and watch what animates.
      </Text>

      <Item
        title="Plain stack screen"
        hint="Push / pop with react-navigation + screens. Release the swipe early to cancel."
        onPress={() => navigation.navigate('Plain', { depth: 1 })}
      />
      <Item
        title="Animated progress"
        hint="PredictiveBackAnimatedView + Animated.event on the native driver."
        onPress={() => navigation.navigate('AnimatedProgress')}
      />
      <Item
        title="Intercept ownership"
        hint="BackHandler.setInterceptEnabled on and off, plus hardwareBackPress."
        onPress={() => navigation.navigate('InterceptToggle')}
      />
    </View>
  );
}

function Item({
  title,
  hint,
  onPress,
}: {
  title: string;
  hint: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  lede: {
    color: '#cbd5f5',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  item: {
    backgroundColor: '#161d33',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
