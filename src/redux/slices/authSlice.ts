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
  bio?: string;
  avatarUri?: string;
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

    /**
     * Update a user's profile on the frontend and in Firebase
     * @param state The AuthState containing the user object
     * @param action A payload containing information that will  update the user's profile
     */
    updateProfile: (
      state,
      action: PayloadAction<{
        name: string;
        handle: string;
        bio?: string;
        avatarUri?: string;
      }>,
    ) => {
      if (!state.user) throw new Error('You cannot update an undefined user');
      state.user.name = action.payload.name;
      state.user.handle = action.payload.handle;
      state.user.bio = action.payload.bio;
      state.user.avatarUri = action.payload.avatarUri;
    },
  },
});

export const { setUser, clearUser, updateProfile } = authSlice.actions;
export default authSlice.reducer;
