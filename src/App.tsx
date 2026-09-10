import * as React from 'react';

import { NavigationDemo } from './NavigationDemo';
import { RootV5Screen } from './screens/RootV5Screen';

/**
 * Two mutually exclusive trees, switched from inside the app.
 *
 *   navigation -- react-navigation + screens v4, plus the nested v5 control
 *   rootV5     -- screens v5 `Stack.Host` as the only screen container in the tree
 *
 * The switch is not cosmetic. `StackContainer` picks its FragmentManager by
 * walking up the view tree to the first `FragmentProviding` ancestor, so a v4
 * stack mounted anywhere above `Stack.Host` captures the v5 fragments into its
 * own child FragmentManager -- where androidx' predictive-back callback can never
 * enable, because it requires the *parent* fragment to be primary navigation
 * (which screens never sets on a v4 host fragment). Swapping the trees is what
 * lets one app show both outcomes.
 */
export default function App(): React.JSX.Element {
  const [mode, setMode] = React.useState<'navigation' | 'rootV5'>('navigation');

  if (mode === 'rootV5') {
    return <RootV5Screen onExit={() => setMode('navigation')} />;
  }

  return <NavigationDemo onOpenRootV5={() => setMode('rootV5')} />;
}
