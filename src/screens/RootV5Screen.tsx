import * as React from 'react';
import {useEffect, useState} from 'react';
import {BackHandler, Platform, Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {Stack} from 'react-native-screens';

import {useV5StackRoutes, V5Page, type V5DismissOrigin} from '../v5Stack';

/**
 * react-native-screens **Stack v5** mounted at the *root* of the React tree.
 *
 * The mount point is the whole experiment. `StackContainer` resolves its
 * FragmentManager by walking up the view tree and stopping at the first
 * `FragmentProviding` ancestor, falling back to the activity's root
 * FragmentManager when the walk reaches the `ReactRootView`. Rendered here, with
 * no v4 stack above it, that fallback is what happens -- and the root
 * FragmentManager has `mParent == null`, for which androidx'
 * `isPrimaryNavigation(null)` is true by definition. So its predictive-back
 * callback enables on `backStackEntryCount > 0` alone, which is the minimum
 * condition for FragmentManager to receive the gesture and seek the
 * `androidx.transition` pop.
 *
 * The nested sibling in `StackV5Screen` is the control: identical JavaScript, and
 * there the callback never enables.
 */
export function RootV5Screen({
  onExit,
}: {
  onExit: () => void;
}): React.JSX.Element {
  const {routes, push, popFromJs, removeRoute, note, log, attachedCount} =
    useV5StackRoutes();
  const [intercept, setIntercept] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    BackHandler.setInterceptEnabled(intercept);
    return () => BackHandler.setInterceptEnabled(false);
  }, [intercept]);

  // When RN owns the swipe, FragmentManager never pops. Commit is
  // hardwareBackPress — we have to detach the top route ourselves.
  useEffect(() => {
    if (Platform.OS !== 'android' || !intercept) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (attachedCount < 2) {
        return false;
      }
      note('hardwareBackPress -> popFromJs');
      popFromJs();
      return true;
    });
    return () => sub.remove();
  }, [intercept, attachedCount, popFromJs, note]);

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

      <View style={styles.interceptRow}>
        <Text style={styles.interceptLabel}>JS intercept (give swipe to RN)</Text>
        <Switch value={intercept} onValueChange={setIntercept} />
      </View>

      <Text style={styles.hint}>
        {intercept
          ? 'RN owns the swipe. The cyan card on depth 2+ follows the finger; the page itself will not seek. Commit is hardwareBackPress → popFromJs.'
          : 'Screens has yielded. Swipe from the left edge: the page seeks, the cyan card stays still. onNativeDismiss on commit only.'}
      </Text>

      <View style={styles.stackArea}>
        <Stack.Host>
          {routes.map((route) => (
            <Stack.Screen
              key={route.screenKey}
              screenKey={route.screenKey}
              activityMode={route.activityMode}
              onDismiss={(screenKey) => onDismiss(screenKey, 'js')}
              onNativeDismiss={(screenKey) => onDismiss(screenKey, 'native')}>
              <V5Page route={route} showRnCard />
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
  interceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  interceptLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    paddingRight: 12,
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
