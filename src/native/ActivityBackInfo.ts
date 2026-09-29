import {NativeModules, Platform} from 'react-native';

/**
 * True when the linked androidx.activity has
 * OnBackPressedCallback.handleOnBackProgressed. FragmentManager overrides that
 * method (added in activity 1.8) to seek a transition during the back gesture.
 */
export function activityHasProgressCallbacks(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }
  const info = NativeModules.ActivityBackInfo as
    | {hasProgressCallbacks?: boolean}
    | undefined;
  return info?.hasProgressCallbacks === true;
}
