import {DeviceEventEmitter, NativeModules, Platform} from 'react-native';

/**
 * JS face of the demo native module that registers a handler with
 * `PredictiveBackProgress.addHandler` from rn-predictive-back-progress. It
 * exists so this app can turn the handler on and off from a screen.
 */
type NativeModuleShape = {
  setRegistered: (registered: boolean) => void;
  setConsumeCommit: (consume: boolean) => void;
};

export type DemoHandlerEvent = {
  type:
    | 'registered'
    | 'consumeCommit'
    | 'started'
    | 'progress'
    | 'cancelled'
    | 'committed';
  progress: number;
  swipeEdge: number;
  touchX: number;
  touchY: number;
  progressCount: number;
  registered: boolean;
  consumeCommit: boolean;
};

const native: NativeModuleShape | undefined =
  Platform.OS === 'android'
    ? (NativeModules.DemoPredictiveBackHandler as NativeModuleShape | undefined)
    : undefined;

export function isDemoHandlerAvailable(): boolean {
  return native != null;
}

export function setDemoHandlerRegistered(registered: boolean): void {
  native?.setRegistered(registered);
}

export function setDemoHandlerConsumeCommit(consume: boolean): void {
  native?.setConsumeCommit(consume);
}

export function addDemoHandlerListener(
  listener: (event: DemoHandlerEvent) => void,
): {remove: () => void} {
  const subscription = DeviceEventEmitter.addListener(
    'DemoPredictiveBackHandler',
    listener,
  );
  return {remove: () => subscription.remove()};
}
