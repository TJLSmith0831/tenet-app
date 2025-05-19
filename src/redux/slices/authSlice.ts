import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * AuthState holds the logged-in user's identity info from Firestore.
 */
export interface AuthState {
  uid: string;
  name: string;
  username: string;
  handle: string;
  did: string;
  provisionStatus: string;
  createdAt: string; // ISO string
  // Add more fields here if you extend your Cloud Function
}

interface AuthSliceState {
  user: AuthState | null;
}

const initialState: AuthSliceState = {
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Sets the current user after successful login.
     */
    setUser(state, action: PayloadAction<AuthState>) {
      state.user = action.payload;
    },

    /**
     * Clears user state on logout or auth reset.
     */
    clearUser(state) {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
