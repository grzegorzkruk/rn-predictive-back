import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Plain'>;

/**
 * Baseline: react-navigation native stack on top of react-native-screens.
 *
 * With react-native's back callback enabled (the default), screens does not get
 * a system-seeked pop yet. With it disabled (see MainActivity.kt), FragmentManager
 * seeks the pop and this screen shrinks over the previous one during the swipe.
 */
export function PlainStackScreen({ navigation, route }: Props): React.JSX.Element {
  const depth = route.params.depth;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Depth {depth}</Text>
      <Text style={styles.hint}>
        Swipe from the left edge and hold. Release early to cancel, or continue
        to pop this screen.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('Plain', { depth: depth + 1 })}>
        <Text style={styles.buttonText}>Push depth {depth + 1}</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Pop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#233056',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
