import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OpenRootV5Context, type RootStackParamList } from '../NavigationDemo';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props): React.JSX.Element {
  const openRootV5 = React.useContext(OpenRootV5Context);

  return (
    <ScrollView>
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
          title="Reanimated progress"
          hint="Same host view, consumed with Reanimated useEvent on the UI thread."
          onPress={() => navigation.navigate('ReanimatedProgress')}
        />
        <Item
          title="Intercept ownership"
          hint="BackHandler.setInterceptEnabled on and off, plus hardwareBackPress."
          onPress={() => navigation.navigate('InterceptToggle')}
        />
        <Item
          title="Native PredictiveBackHandler"
          hint="Plugin path. Kotlin handler registered on ReactActivity — RN consumes and forwards progress. Fights a root v5 stack while registered."
          onPress={() => navigation.navigate('NativeHandler')}
        />
        <Item
          title="Stack v5 (nested)"
          hint="Control. Stack.Host inside the v4 stack: its fragments land in ScreenStackFragment's child FragmentManager, whose back callback never enables."
          onPress={() => navigation.navigate('StackV5')}
        />
        <Item
          title="Stack v5 (root)"
          hint="Test. Root Stack.Host. Push past depth 1, then use JS intercept to hand the swipe to RN (the card moves) or back to screens (the page seeks)."
            onPress={openRootV5}
          />
      </View>
    </ScrollView>
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
