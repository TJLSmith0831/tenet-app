import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

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

/**
 * Updates the user's profile with all changes
 *
 * @param userId - Authenticated user's ID
 * @param updates - Payload of changes made to the user's profile
 */
export const updateUser = async (
  userId: string,
  updates: {
    name?: string;
    handle?: string;
    bio?: string;
    avatarUri?: string;
  },
): Promise<void> => {
  if (Object.keys(updates).length === 0) {
    throw new Error('No fields provided to update.');
  }
  const userRef = doc(db, 'users', userId);
  if (!userRef) {
    throw new Error('User reference does not exist!');
  }

  // Save this user's profile with changes in the name, handle
  try {
    await updateDoc(userRef, { ...updates });
  } catch (error) {
    console.error('Failed to update user in Firestore:', error);
    throw error;
  }
};

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async ({
    userId,
    updates,
  }: {
    userId: string;
    updates: {
      name?: string;
      handle?: string;
      bio?: string;
      avatarUri?: string;
    };
  }) => {
    await updateUser(userId, updates);
    return updates;
  },
);

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
  extraReducers: builder => {
    builder.addCase(updateUserProfile.fulfilled, (state, action) => {
      if (!state.user) return;
      const { name, handle, bio, avatarUri } = action.payload;
      if (name) state.user.name = name;
      if (handle) state.user.handle = handle;
      if (bio) state.user.bio = bio;
      if (avatarUri) state.user.avatarUri = avatarUri;
    });
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
