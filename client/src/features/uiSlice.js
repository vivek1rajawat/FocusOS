import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  mobileSidebarOpen: false,
  searchOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload;
    },
    setSearchOpen: (state, action) => {
      state.searchOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setMobileSidebarOpen, setSearchOpen } = uiSlice.actions;
export default uiSlice.reducer;
