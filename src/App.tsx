import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { StatusBar } from 'react-native';

import { AnimatedProgressScreen } from './screens/AnimatedProgressScreen';
import { HomeScreen } from './screens/HomeScreen';
import { InterceptToggleScreen } from './screens/InterceptToggleScreen';
import { PlainStackScreen } from './screens/PlainStackScreen';

export type RootStackParamList = {
  Home: undefined;
  Plain: { depth: number };
  AnimatedProgress: undefined;
  InterceptToggle: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <>
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
            name="InterceptToggle"
            component={InterceptToggleScreen}
            options={{ title: 'Intercept ownership' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default App;
