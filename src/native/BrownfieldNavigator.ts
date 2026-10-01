import {NativeModules} from 'react-native';

/** Starts the native activity that embeds a ReactFragment. */
export function openNativeHost(): void {
  const native = NativeModules.BrownfieldNavigator as
    | {openNativeHost?: () => void}
    | undefined;
  native?.openNativeHost?.();
}
