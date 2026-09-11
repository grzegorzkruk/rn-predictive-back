import * as React from 'react';
import {useMemo} from 'react';
import {
  Animated,
  Platform,
  PredictiveBackAnimatedView,
  StyleSheet,
  Text,
  useAnimatedValue,
  View,
} from 'react-native';

/**
 * Shared driver for react-native-screens **Stack v5** (`Stack.Host` /
 * `Stack.Screen`) -- the only stack in screens that animates fragment changes
 * with the `androidx.transition` API, and therefore the only one FragmentManager
 * can *seek* during a predictive back swipe.
 *
 * The v5 model is declarative over an imperative native primitive (mirrors
 * react-native-screens/apps/src/shared/containers/stack/*):
 *   - each `Stack.Screen` has a stable `screenKey` and an `activityMode`;
 *   - `'attached'` screens go on the native FragmentManager back stack,
 *     `'detached'` screens come off it -- detaching *is* the pop;
 *   - so JS pops by setting `activityMode: 'detached'`, never by calling pop();
 *   - at least one attached screen must always exist (native asserts otherwise).
 *
 * The predictive part: a committed swipe-back pop is executed by **FragmentManager
 * itself** -- it reverses its own back-stack record while seeking the Transition.
 * screens reports it to JS through `onNativeDismiss`, and the driver drops the
 * route from state so the two trees agree again.
 */

export type V5Route = {
  screenKey: string;
  depth: number;
  activityMode: 'attached' | 'detached';
};

export type V5DismissOrigin = 'js' | 'native';

let nextId = 0;

function makeRoute(depth: number): V5Route {
  return {
    screenKey: `r-${depth}-${nextId++}`,
    depth,
    activityMode: 'attached',
  };
}

const attachedOf = (routes: V5Route[]) =>
  routes.filter((r) => r.activityMode === 'attached');

export function useV5StackRoutes() {
  const [routes, setRoutes] = React.useState<V5Route[]>(() => [makeRoute(1)]);
  const [log, setLog] = React.useState<string[]>([]);

  const note = React.useCallback((text: string) => {
    const line = `${new Date().toISOString().slice(11, 23)}  ${text}`;
    setLog((current) => [line, ...current].slice(0, 8));
  }, []);

  const push = React.useCallback(() => {
    setRoutes((current) => [
      ...current,
      makeRoute(attachedOf(current).length + 1),
    ]);
  }, []);

  /**
   * JS-driven pop: detach the top route. Native turns this into a `popBackStack`
   * plus `setPrimaryNavigationFragment` transaction batch.
   */
  const popFromJs = React.useCallback(() => {
    setRoutes((current) => {
      const attached = attachedOf(current);
      if (attached.length < 2) {
        return current;
      }
      const top = attached[attached.length - 1];
      return current.map((r) =>
        r.screenKey === top.screenKey
          ? { ...r, activityMode: 'detached' as const }
          : r,
      );
    });
  }, []);

  /**
   * Both dismiss callbacks mean "this fragment is gone" -- `onNativeDismiss` for a
   * FragmentManager pop (the swipe), `onDismiss` for one JS asked for. Either way
   * the route has to leave JS state or the two trees desync.
   */
  const removeRoute = React.useCallback((screenKey: string) => {
    setRoutes((current) => {
      const next = current.filter((r) => r.screenKey !== screenKey);
      return next.length === current.length ? current : next;
    });
  }, []);

  return {
    routes,
    push,
    popFromJs,
    removeRoute,
    note,
    log,
    attachedCount: attachedOf(routes).length,
  };
}

export function V5Page({
  route,
  showRnCard = false,
}: {
  route: V5Route;
  showRnCard?: boolean;
}): React.JSX.Element {
  return (
    <View style={[pageStyles.page, { backgroundColor: pageColor(route.depth) }]}>
      <Text style={pageStyles.title}>v5 · depth {route.depth}</Text>
      <Text style={pageStyles.key}>{route.screenKey}</Text>
      <Text style={pageStyles.hint}>
        This page is a StackScreenFragment. Its return transition is an
        androidx.transition Slide, which FragmentManager can seek.
      </Text>
      {showRnCard && route.depth >= 2 ? <RnInterceptCard /> : null}
    </View>
  );
}

/**
 * JS-driven marker that only moves when React Native owns the swipe
 * (`claimPredictiveBack` → PredictiveBackAnimatedView gets progress).
 * When the claim is released, screens has yielded and this card stays still
 * while the whole page seeks.
 */
function RnInterceptCard(): React.JSX.Element {
  const progress = useAnimatedValue(0);
  const onProgress = useMemo(
    () => Animated.event([{nativeEvent: {progress}}], {useNativeDriver: true}),
    [progress],
  );
  const cardStyle = useMemo(
    () => [
      pageStyles.card,
      {
        transform: [
          {scale: progress.interpolate({inputRange: [0, 1], outputRange: [1, 0.86]})},
          {translateX: progress.interpolate({inputRange: [0, 1], outputRange: [0, 56]})},
        ],
        opacity: progress.interpolate({inputRange: [0, 1], outputRange: [1, 0.55]}),
      },
    ],
    [progress],
  );

  return (
    <View style={pageStyles.cardSlot}>
      {Platform.OS === 'android' ? <PredictiveBackAnimatedView onProgress={onProgress} /> : null}
      <Animated.View style={cardStyle}>
        <Text style={pageStyles.cardTitle}>RN card</Text>
        <Text style={pageStyles.cardHint}>
          Moves only while a JS claim is held. Released: this stays put, the page seeks.
        </Text>
      </Animated.View>
    </View>
  );
}

function pageColor(depth: number): string {
  const palette = ['#0b1020', '#132043', '#1b2f5e', '#234076', '#2c528c'];
  return palette[(depth - 1) % palette.length];
}

const pageStyles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  key: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  hint: {
    color: '#cbd5f5',
    fontSize: 13,
    lineHeight: 18,
  },
  cardSlot: {
    marginTop: 16,
  },
  card: {
    borderRadius: 14,
    backgroundColor: '#38bdf8',
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  cardHint: {
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
});
