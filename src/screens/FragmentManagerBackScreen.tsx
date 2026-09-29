import * as React from 'react';
import {useEffect} from 'react';
import {BackHandler, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {Stack} from 'react-native-screens';

import {activityHasProgressCallbacks} from '../native/ActivityBackInfo';
import {useV5StackRoutes, V5Page, type V5DismissOrigin} from '../v5Stack';

/**
 * Root Stack.Host, with React Native's back callback left disabled.
 *
 * That is the condition under which FragmentManager's own OnBackPressedCallback
 * is the one Android dispatches to. On activity 1.8+ that callback implements
 * handleOnBackStarted, handleOnBackProgressed and handleOnBackCancelled, and
 * uses them to seek the Slide on StackScreenFragment. A commit is reported as
 * onNativeDismiss. JavaScript never sees progress and never sees
 * hardwareBackPress for the pop.
 */
export function FragmentManagerBackScreen({
  onExit,
}: {
  onExit: () => void;
}): React.JSX.Element {
  const {routes, push, popFromJs, removeRoute, note, log, attachedCount} =
    useV5StackRoutes();
  const hasProgressCallbacks = activityHasProgressCallbacks();

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    BackHandler.setInterceptEnabled(false);
    return () => {
      BackHandler.setInterceptEnabled(false);
    };
  }, []);

  const onDismiss = React.useCallback(
    (screenKey: string, origin: V5DismissOrigin) => {
      note(`${origin === 'native' ? 'onNativeDismiss' : 'onDismiss'} ${screenKey}`);
      removeRoute(screenKey);
    },
    [note, removeRoute],
  );

  return (
    <View style={styles.root}>
      <View style={styles.controls}>
        <Button label="Push" onPress={push} />
        <Button label="Pop from JS" onPress={popFromJs} />
        <Button label="Back to demo" onPress={onExit} />
        <Text style={styles.depth}>attached: {attachedCount}</Text>
      </View>

      <Text style={styles.status}>
        {hasProgressCallbacks
          ? 'activity 1.8 callbacks: present. FragmentManager can seek.'
          : 'activity 1.8 callbacks: missing. FragmentManager can only commit.'}
      </Text>
      <Text style={styles.hint}>
        RN intercept stays off. Push past depth 1, then swipe from the left
        edge. The page should follow the finger (handleOnBackProgressed seeking
        the Slide). Release early to cancel. Finish the swipe and this log
        shows onNativeDismiss, not hardwareBackPress.
      </Text>

      <View style={styles.stackArea}>
        <Stack.Host>
          {routes.map(route => (
            <Stack.Screen
              key={route.screenKey}
              screenKey={route.screenKey}
              activityMode={route.activityMode}
              onDismiss={screenKey => onDismiss(screenKey, 'js')}
              onNativeDismiss={screenKey => onDismiss(screenKey, 'native')}>
              <V5Page route={route} />
            </Stack.Screen>
          ))}
        </Stack.Host>
      </View>

      <View style={styles.logBox}>
        {log.length === 0 ? (
          <Text style={styles.hint}>No dismiss events yet.</Text>
        ) : (
          log.map((line, i) => (
            <Text key={`${line}-${i}`} style={styles.logLine}>
              {line}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}

function Button({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  button: {
    backgroundColor: '#233056',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  depth: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 'auto',
  },
  status: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  hint: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  stackArea: {
    flex: 1,
    overflow: 'hidden',
  },
  logBox: {
    padding: 12,
    gap: 2,
    maxHeight: 120,
  },
  logLine: {
    color: '#a5b4fc',
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
