import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
 *   react-native consumes the swipe  <=>  a BackHandler listener has
 *   `intercept: true` (or native code enables its own back callback)
 *
 * The switch sets `intercept` on this screen's listener. The demo tree does not
 * add its own request on this route (see NavigationDemo), so this listener
 * alone decides. With intercept off, nothing in JS can pop on this screen and
 * the system animation runs instead. With intercept on, commit becomes
 * hardwareBackPress.
 */
export function InterceptToggleScreen({ navigation }: Props): React.JSX.Element {
  const [intercept, setIntercept] = useState(true);
  const [lines, setLines] = useState<LogLine[]>([]);

  const log = useCallback((text: string) => {
    const line = { id: nextId++, text: `${new Date().toISOString().slice(11, 23)}  ${text}` };
    setLines((current) => [line, ...current].slice(0, 6));
  }, []);

  const subscriptionRef = useRef<ReturnType<typeof BackHandler.addEventListener> | null>(
    null,
  );
  const interceptRef = useRef(intercept);

  // The listener exists only while this screen is focused, so its request
  // does not leak into other screens.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return undefined;
      }
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          log('hardwareBackPress -> popping');
          navigation.goBack();
          return true;
        },
        { intercept: interceptRef.current },
      );
      subscriptionRef.current = subscription;
      return () => {
        subscription.remove();
        subscriptionRef.current = null;
      };
    }, [navigation, log]),
  );

  // Change the request on the same listener. Removing and re-adding it would
  // briefly drop interception.
  useEffect(() => {
    interceptRef.current = intercept;
    if (Platform.OS !== 'android') {
      return;
    }
    subscriptionRef.current?.setInterceptEnabled(intercept);
    log(`intercept: ${intercept}`);
  }, [intercept, log]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>intercept option</Text>
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
