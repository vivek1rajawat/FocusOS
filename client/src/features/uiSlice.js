import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  searchOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSearchOpen: (state, action) => {
      state.searchOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSearchOpen } = uiSlice.actions;
export default uiSlice.reducer;
