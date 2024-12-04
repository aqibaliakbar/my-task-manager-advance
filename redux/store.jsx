import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice";
import { api } from "./features/services/api";
import { setupListeners } from "@reduxjs/toolkit/query";
import teamReducer from "./features/teamSlice";

export const createStore = (preloadedState = undefined) => {
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      user: userReducer,
      team: teamReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(api.middleware),
  });

  setupListeners(store.dispatch);

  return store;
};

export const store = createStore();
