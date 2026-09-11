import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {BackHandler, Pressable, StyleSheet, Switch, Text, View} from 'react-native';

import type {RootStackParamList} from '../NavigationDemo';
import {
  addDemoHandlerListener,
  isDemoHandlerAvailable,
  setDemoHandlerConsumeCommit,
  setDemoHandlerRegistered,
  type DemoHandlerEvent,
} from '../native/DemoPredictiveBackHandler';

type Props = NativeStackScreenProps<RootStackParamList, 'NativeHandler'>;

type LogLine = {
  id: number;
  text: string;
};

let nextId = 0;

/**
 * Exercises `ReactActivity.addPredictiveBackHandler` — the native *plugin*
 * API. Contrast with Stack v5 (root), which *yields* so FragmentManager owns
 * the swipe, and with Animated progress, which observes through
 * PredictiveBackAnimatedView without being a handler.
 *
 * Registering the handler is what makes RN consume the gesture. The screen
 * leaves `setInterceptEnabled` alone so you can see that the plugin by itself
 * is enough. Unregister on blur so this does not leak into the v5 experiments.
 */
export function NativeHandlerScreen({navigation}: Props): React.JSX.Element {
  const [registered, setRegistered] = useState(true);
  const [consumeCommit, setConsumeCommit] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressCount, setProgressCount] = useState(0);
  const [jsBackPresses, setJsBackPresses] = useState(0);
  const [lines, setLines] = useState<LogLine[]>([]);

  const log = useCallback((text: string) => {
    const line = {
      id: nextId++,
      text: `${new Date().toISOString().slice(11, 23)}  ${text}`,
    };
    setLines((current) => [line, ...current].slice(0, 8));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isDemoHandlerAvailable()) {
        return undefined;
      }

      const events = addDemoHandlerListener((event: DemoHandlerEvent) => {
        if (event.type === 'progress' || event.type === 'started') {
          setProgress(event.progress);
          setProgressCount(event.progressCount);
        }
        if (event.type === 'cancelled') {
          setProgress(0);
        }
        if (event.type === 'committed') {
          setProgress(event.consumeCommit ? 1 : 0);
          log(
            event.consumeCommit
              ? `committed (native consumed, JS hardwareBackPress will not fire) progressEvents=${event.progressCount}`
              : `committed (native did not consume) progressEvents=${event.progressCount}`,
          );
          return;
        }
        if (event.type === 'started' || event.type === 'cancelled') {
          log(`${event.type} edge=${event.swipeEdge} p=${event.progress.toFixed(2)}`);
        }
      });

      const back = BackHandler.addEventListener('hardwareBackPress', () => {
        setJsBackPresses((n) => n + 1);
        log('hardwareBackPress -> popping');
        navigation.goBack();
        return true;
      });

      return () => {
        events.remove();
        back.remove();
        setDemoHandlerRegistered(false);
      };
    }, [navigation, log]),
  );

  React.useEffect(() => {
    if (!isDemoHandlerAvailable()) {
      return;
    }
    setDemoHandlerRegistered(registered);
    setDemoHandlerConsumeCommit(consumeCommit);
  }, [registered, consumeCommit]);

  if (!isDemoHandlerAvailable()) {
    return (
      <View style={styles.container}>
        <Text style={styles.hint}>
          Native module DemoPredictiveBackHandler is not linked on this build.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Plugin path: a Kotlin PredictiveBackHandler registered on ReactActivity.
        While it is registered, RN consumes the swipe and forwards every phase
        here. That fights a root v5 stack — FragmentManager will not seek.
        Progress in the bar is a throttled JS copy of the native callbacks;
        PredictiveBackAnimatedView is the API meant for animation.
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Handler registered</Text>
        <Switch
          value={registered}
          onValueChange={(value) => {
            setRegistered(value);
            setDemoHandlerRegistered(value);
            log(`setRegistered(${value})`);
          }}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Consume commit</Text>
        <Switch
          value={consumeCommit}
          onValueChange={(value) => {
            setConsumeCommit(value);
            setDemoHandlerConsumeCommit(value);
            log(`setConsumeCommit(${value})`);
          }}
        />
      </View>

      <Text style={styles.hint}>
        {registered
          ? consumeCommit
            ? 'Commit stays in native. hardwareBackPress will not fire; use the button to leave.'
            : 'Commit falls through to hardwareBackPress and this screen pops.'
          : 'Handler is off. RN is not consuming because of this plugin. Swipe goes to whoever else is enabled (usually RN’s commit-only callback).'}
      </Text>

      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, {width: `${Math.round(progress * 100)}%`}]} />
      </View>
      <Text style={styles.meterLabel}>
        last progress {progress.toFixed(2)} · native events {progressCount} · JS
        hardwareBackPress {jsBackPresses}
      </Text>

      <Pressable style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Leave from JS</Text>
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
  meterTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#233056',
    overflow: 'hidden',
  },
  meterFill: {
    height: 10,
    backgroundColor: '#38bdf8',
  },
  meterLabel: {
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: 12,
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
