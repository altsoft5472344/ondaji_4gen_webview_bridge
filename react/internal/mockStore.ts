import type { PrimitiveObject } from "../../types";

export const mockStore = (initialState: PrimitiveObject = {}) => {
  const state = initialState;

  const getState = () => state;

  const subscribe = () => () => {};

  return {
    getState,
    subscribe,
  };
};
