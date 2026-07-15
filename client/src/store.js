import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import themeReducer from './features/themeSlice';
import uiReducer from './features/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    ui: uiReducer,
  },
});
