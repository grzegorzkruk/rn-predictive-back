import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { StatusBar } from 'react-native';

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

/**
 * The react-navigation surface: react-native's own predictive-back primitives
 * (`PredictiveBackAnimatedView`, `BackHandler.setInterceptEnabled`), the v4 stack
 * that `@react-navigation/native-stack` drives, and the *nested* v5 control.
 *
 * It has to unmount completely for the root v5 experiment to be meaningful. A
 * live v4 `ScreenContainer` keeps fragments on the activity's FragmentManager,
 * and `StackContainer` stops its upward walk at the first `FragmentProviding`
 * ancestor -- so while any v4 stack is mounted above `Stack.Host`, the host
 * cannot reach the root FragmentManager.
 */
export function NavigationDemo({
  onOpenRootV5,
}: {
  onOpenRootV5: () => void;
}): React.JSX.Element {
  return (
    <OpenRootV5Context.Provider value={onOpenRootV5}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1020" />
      <NavigationContainer>
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
    </OpenRootV5Context.Provider>
  );
}
