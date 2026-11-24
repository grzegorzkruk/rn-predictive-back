import {
  createNavigationContainerRef,
  NavigationContainer,
  type NavigationState,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { useEffect } from 'react';
import { BackHandler, Platform, StatusBar } from 'react-native';

import { AnimatedProgressScreen } from './screens/AnimatedProgressScreen';
import { HomeScreen } from './screens/HomeScreen';
import { InterceptToggleScreen } from './screens/InterceptToggleScreen';
import { NativeHandlerScreen } from './screens/NativeHandlerScreen';
import { PlainStackScreen } from './screens/PlainStackScreen';
import { ReanimatedProgressScreen } from './screens/ReanimatedProgressScreen';
import { StackV5Screen } from './screens/StackV5Screen';

export type RootStackParamList = {
  Home: undefined;
  Plain: { depth: number };
  AnimatedProgress: undefined;
  ReanimatedProgress: undefined;
  InterceptToggle: undefined;
  NativeHandler: undefined;
  StackV5: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Tells the demo tree that the root v5 host wants to take over. See `App`.
 */
export const OpenRootV5Context = React.createContext<() => void>(() => {});

const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * The listener that holds the v4 tree's back request. Its handler returns
 * false, so NavigationContainer's own listener still pops. Only its
 * `intercept` option matters.
 */
let ownershipSubscription: ReturnType<typeof BackHandler.addEventListener> | null =
  null;

/**
 * Routes that hold their own `intercept` request. The demo tree does not
 * request back for them, so their request alone decides.
 */
const ROUTES_WITH_OWN_INTERCEPT: ReadonlySet<string> = new Set(['InterceptToggle']);

/**
 * One owner for the v4 tree: request back on every route except Home. On API 36
 * no request means the swipe goes to the system, which on Home is the app-exit
 * we want. Everywhere else RN must consume so NavigationContainer's
 * BackHandler can pop. Screens only add their own requests on top of this one.
 *
 * Must not use useNavigationState here: that hook requires a navigator, and
 * NavigationContainer's direct children are outside one.
 */
function syncAndroidBackOwnership(state?: NavigationState): void {
  if (Platform.OS !== 'android') {
    return;
  }
  const routeName =
    state?.routes[state.index]?.name ?? navigationRef.getCurrentRoute()?.name;
  ownershipSubscription?.setInterceptEnabled(
    routeName != null &&
      routeName !== 'Home' &&
      !ROUTES_WITH_OWN_INTERCEPT.has(routeName),
  );
}

/**
 * The react-navigation surface: react-native's own predictive-back primitives
 * (`PredictiveBackProgressView`, the BackHandler `intercept` option), the v4 stack
 * that `@react-navigation/native-stack` drives, and the *nested* v5 control.
 *
 * It has to unmount completely for the root v5 experiment to be meaningful. A
 * live v4 `ScreenContainer` keeps fragments on the activity's FragmentManager,
 * and `StackContainer` stops its upward walk at the first `FragmentProviding`
 * ancestor -- so while any v4 stack is mounted above `Stack.Host`, the host
 * cannot reach the root FragmentManager.
 */
/**
 * Opens the root FragmentManager example. Same reason as [OpenRootV5Context]:
 * the v4 stack has to be unmounted or it captures the v5 fragments.
 */
export const OpenFragmentManagerContext = React.createContext<() => void>(
  () => {},
);

export function NavigationDemo({
  onOpenRootV5,
  onOpenFragmentManager,
}: {
  onOpenRootV5: () => void;
  onOpenFragmentManager: () => void;
}): React.JSX.Element {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => false,
      { intercept: false },
    );
    ownershipSubscription = subscription;
    // onReady may have fired before this effect. Read the current route now.
    syncAndroidBackOwnership();
    return () => {
      subscription.remove();
      if (ownershipSubscription === subscription) {
        ownershipSubscription = null;
      }
    };
  }, []);

  return (
    <OpenRootV5Context.Provider value={onOpenRootV5}>
      <OpenFragmentManagerContext.Provider value={onOpenFragmentManager}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1020" />
      <NavigationContainer
        ref={navigationRef}
        onReady={() => syncAndroidBackOwnership()}
        onStateChange={syncAndroidBackOwnership}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#0b1020' },
            headerTintColor: '#fff',
            contentStyle: { backgroundColor: '#0b1020' },
            // Android: ask the system to animate the back gesture when nothing
            // in React Native consumes it.
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Predictive back' }} />
          <Stack.Screen
            name="Plain"
            component={PlainStackScreen}
            options={{ title: 'Plain stack screen' }}
          />
          <Stack.Screen
            name="AnimatedProgress"
            component={AnimatedProgressScreen}
            options={{ title: 'Animated progress' }}
          />
          <Stack.Screen
            name="ReanimatedProgress"
            component={ReanimatedProgressScreen}
            options={{ title: 'Reanimated progress' }}
          />
          <Stack.Screen
            name="InterceptToggle"
            component={InterceptToggleScreen}
            options={{ title: 'Intercept ownership' }}
          />
          <Stack.Screen
            name="NativeHandler"
            component={NativeHandlerScreen}
            options={{ title: 'Native handler' }}
          />
          <Stack.Screen
            name="StackV5"
            component={StackV5Screen}
            options={{ title: 'Stack v5 (nested)', headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </OpenFragmentManagerContext.Provider>
    </OpenRootV5Context.Provider>
  );
}
