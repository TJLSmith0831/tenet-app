import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import feedReducer from './slices/feedSlice';
import scrollReducer from './slices/scrollSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistReducer } from 'redux-persist';
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
};

export const store = configureStore({
  reducer: {
    // @ts-ignore
    auth: persistReducer(authPersistConfig, authReducer),
    feed: feedReducer,
    scroll: scrollReducer,
  },
  devTools: __DEV__,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // Optional: disables warning when using non-serializable values (e.g. Firebase user)
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
/**
 * Typed dispatch hook for Redux Toolkit with Thunks.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed selector hook for accessing Redux state with full type safety.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
