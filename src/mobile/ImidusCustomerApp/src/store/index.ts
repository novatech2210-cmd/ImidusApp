import {configureStore} from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import loyaltyReducer from './loyaltySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    loyalty: loyaltyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
