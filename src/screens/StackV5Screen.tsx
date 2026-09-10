import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'react-native-screens';

import { useV5StackRoutes, V5Page, type V5DismissOrigin } from '../v5Stack';

/**
 * Stack v5 mounted **inside** react-navigation's native stack -- the negative
 * control. Same JS as `RootV5Screen`, different mount point, and the mount point
 * is what decides whether the gesture can be seeked.
 *
 * `StackContainer` finds its FragmentManager by walking up the view tree
 * (`FragmentManagerHelper.findFragmentManagerForView`), and stops at the first
 * `FragmentProviding` ancestor. Rendered here, that ancestor is the v4
 * `ScreenStackFragment`, so the v5 fragments are added to *that fragment's child*
 * FragmentManager.
 *
 * androidx.fragment 1.8.9 enables a FragmentManager's predictive-back callback
 * only when `backStackEntryCount > 0 && isPrimaryNavigation(mParent)`, and
 * `isPrimaryNavigation` walks upward: the parent fragment has to be the primary
 * navigation fragment of the manager above it, recursively to the activity.
 * screens only ever calls `setPrimaryNavigationFragment` on its own v5 fragments,
 * never on the v4 host, so the chain is broken immediately and the callback stays
 * disabled. Observed on device: zero `enabled state is true` lines across a full
 * gesture, and the swipe exits the app.
 */
export function StackV5Screen(): React.JSX.Element {
  const {routes, push, popFromJs, removeRoute, note, log, attachedCount} =
    useV5StackRoutes();

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
        <Text style={styles.depth}>attached: {attachedCount}</Text>
      </View>

      <Text style={styles.hint}>
        Nested control: fragments live in ScreenStackFragment's child
        FragmentManager, whose back callback stays disabled. Expect the swipe to
        fall through to the system.
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
    maxHeight: 130,
  },
  logLine: {
    color: '#a5b4fc',
    fontFamily: 'monospace',
    fontSize: 11,
  },
});
