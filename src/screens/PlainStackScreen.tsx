import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import * as React from 'react';
import {useCallback} from 'react';
import {BackHandler, Pressable, StyleSheet, Text, View} from 'react-native';

import type {RootStackParamList} from '../NavigationDemo';

type Props = NativeStackScreenProps<RootStackParamList, 'Plain'>;

/**
 * Baseline: react-navigation native stack on top of screens v4.
 *
 * react-navigation sets nativeBackButtonDismissalEnabled={false}, so Android
 * will not pop this fragment. NavigationContainer already has a BackHandler
 * (useBackButton). This screen adds its own so a commit always pops *this*
 * route even if that listener is stale. RN consume is owned by
 * AndroidBackOwnership in NavigationDemo — not here — so we do not fight it.
 */
export function PlainStackScreen({navigation, route}: Props): React.JSX.Element {
  const depth = route.params.depth;

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.goBack();
        return true;
      });
      return () => sub.remove();
    }, [navigation]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Depth {depth}</Text>
      <Text style={styles.hint}>
        Swipe from the left edge and hold. Release early to cancel, or continue
        to pop this screen. The page itself will not seek (v4 Animation API);
        commit is JS BackHandler → goBack.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => navigation.push('Plain', {depth: depth + 1})}>
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
