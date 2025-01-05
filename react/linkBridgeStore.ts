import type { Bridge, BridgeStore, OnlyJSON } from '../types';
import { type DefaultEmitter } from '../utils';

export type Store<BridgeObject extends Bridge> = ({
  get,
  set,
}: {
  get: () => BridgeObject;
  set: (newState: Partial<OnlyJSON<BridgeObject>>) => void;
}) => BridgeObject;

export const linkBridgeStore = <T extends BridgeStore<T extends Bridge ? T : any>>(
  emitter: DefaultEmitter,
  initialState: Partial<T> = {}
): Omit<T, 'setState'> => {
  console.log('===== linkBridgeStore =====');
  const getState = () => {
    console.log('===== linkBridgeStore // getState =====');
    return state;
  };

  const setState = (newState: Partial<OnlyJSON<T>>) => {
    console.log('===== linkBridgeStore // setState =====');

    const _newState = {
      ...state,
      ...newState,
    };

    const prevState = state;
    state = _newState;
    emitChange(state, prevState);
  };

  emitter.on('bridgeStateChange', (data) => {
    console.log('===== linkBridgeStore // emitter.on // bridgeStateChange =====');

    setState(data);
  });

  let state: T = { ...initialState } as T;

  const listeners = new Set<(newState: T, prevState: T) => void>();

  const emitChange = (newState: T, prevState: T) => {
    console.log('===== linkBridgeStore // emitChange =====');
    for (const listener of listeners) {
      listener(newState, prevState);
    }
  };

  const subscribe = (listener: (newState: T, prevState: T) => void) => {
    console.log('===== linkBridgeStore // subscribe =====');

    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    getState,
    subscribe,
  } as unknown as Omit<T, 'setState'>;
};
