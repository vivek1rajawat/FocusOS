import { createSlice } from '@reduxjs/toolkit';

const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('focusos_user') || 'null');
  } catch {
    return null;
  }
})();

const initialState = {
  user: storedUser,
  token: localStorage.getItem('focusos_token') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      localStorage.setItem('focusos_token', token);
      localStorage.setItem('focusos_user', JSON.stringify(user));
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('focusos_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('focusos_token');
      localStorage.removeItem('focusos_user');
    },
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
