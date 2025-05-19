import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ScrollState {
  velocity: number;
  showPrompt: boolean;
}

const initialState: ScrollState = {
  velocity: 0,
  showPrompt: false,
};

const scrollSlice = createSlice({
  name: 'scroll',
  initialState,
  reducers: {
    updateVelocity(state, action: PayloadAction<number>) {
      state.velocity = action.payload;
      state.showPrompt = action.payload > 5000; // adjust threshold as needed
    },
    resetPrompt(state) {
      state.showPrompt = false;
    },
  },
});

export const { updateVelocity, resetPrompt } = scrollSlice.actions;
export default scrollSlice.reducer;
