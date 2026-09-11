import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type { RootStackParamList } from '../NavigationDemo';

type Props = NativeStackScreenProps<RootStackParamList, 'InterceptToggle'>;

type LogLine = {
  id: number;
  text: string;
};

let nextId = 0;

/**
 * Shows the ownership rule:
 *
 *   react-native consumes the swipe  <=>  JS intercept is on (or a native
 *   PredictiveBackHandler is registered)
 *
 * With intercept off, nothing in JS can pop on this screen and the system
 * animation runs instead. With intercept on, commit becomes hardwareBackPress.
 */
export function InterceptToggleScreen({ navigation }: Props): React.JSX.Element {
  const [intercept, setIntercept] = useState(true);
  const [lines, setLines] = useState<LogLine[]>([]);

  const log = useCallback((text: string) => {
    const line = { id: nextId++, text: `${new Date().toISOString().slice(11, 23)}  ${text}` };
    setLines((current) => [line, ...current].slice(0, 6));
  }, []);

  // Toggle only while this screen is focused, so other screens keep working.
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    BackHandler.setInterceptEnabled(intercept);
    log(`setInterceptEnabled(${intercept})`);
  }, [intercept, log]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        log('hardwareBackPress -> popping');
        navigation.goBack();
        return true;
      });
      return () => {
        subscription.remove();
      };
    }, [navigation, log]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>JS intercept</Text>
        <Switch value={intercept} onValueChange={setIntercept} />
      </View>

      <Text style={styles.hint}>
        {intercept
          ? 'React Native consumes the swipe. On commit, hardwareBackPress fires and this screen pops.'
          : 'React Native does not consume the swipe. JS cannot pop here. The system (or FragmentManager) owns the gesture.'}
      </Text>

      <Pressable style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Trigger goBack from JS</Text>
      </Pressable>

      <Text style={styles.logTitle}>Recent events</Text>
      {lines.length === 0 ? (
        <Text style={styles.hint}>Nothing yet. Swipe from the left edge.</Text>
      ) : (
        lines.map((line) => (
          <Text key={line.id} style={styles.logLine}>
            {line.text}
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  logTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  logLine: {
    color: '#a5b4fc',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});
