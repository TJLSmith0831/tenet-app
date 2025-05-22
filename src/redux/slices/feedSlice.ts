import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { fetchPostWithReplies, submitPost } from '../../services/firebase/postUtils';
import { NewPostInput, Post } from '../types';
import { RootState } from '../store';

interface FeedState {
  posts: Post[];
  loadedPostsNumber: number;
  status: 'idle' | 'posting' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: FeedState = {
  posts: [],
  loadedPostsNumber: 0,
  status: 'idle',
  error: null,
};

/**
 * Async thunk to submit a post to Firestore.
 * On success, it triggers a refresh of the feed.
 */
export const postToFeed = createAsyncThunk<string, NewPostInput>(
  'feed/postToFeed',
  async (post, thunkAPI) => {
    const postId = await submitPost(post as Post);
    if (!postId) {
      return thunkAPI.rejectWithValue('Post failed moderation or submission.');
    }

    // Automatically refresh posts on success
    thunkAPI.dispatch(refetchPosts());
    return postId;
  },
);

/**
 * Fetches the 50 most recent posts from Firestore.
 */
export const refetchPosts = createAsyncThunk<Post[]>(
  'feed/refetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const posts = await Promise.all(snapshot.docs.map(fetchPostWithReplies));
      return posts;
    } catch (error) {
      return rejectWithValue('Failed to fetch posts');
    }
  },
);

/**
 * Loads the next batch of posts for infinite scroll, starting after the last loaded post.
 * Only runs if at least 50 posts are already loaded.
 *
 * @returns {Promise<Post[]>} A list of additional posts or an empty array if none are loaded
 */
export const loadMorePosts = createAsyncThunk<Post[]>(
  'feed/loadMorePosts',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const currentPosts = state.feed.posts;
    const lastPost = currentPosts[currentPosts.length - 1];

    if (!lastPost || !lastPost.createdAt || currentPosts.length < 50) return [];

    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastPost.createdAt),
        limit(50),
      );
      const snapshot = await getDocs(q);
      const posts = await Promise.all(snapshot.docs.map(fetchPostWithReplies));
      return posts;
    } catch (error) {
      return rejectWithValue('Failed to load more posts');
    }
  },
);

/**
 * Searches the most recent public posts by content or author handle.
 * Filters posts client-side using a case-insensitive match.
 *
 * @param {string} searchText - The keyword to search for
 * @returns {Promise<Post[]>} A filtered list of matching posts
 */
export const searchPosts = createAsyncThunk<Post[], string>(
  'feed/searchPosts',
  async (searchText: string, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, 'posts'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        limit(100),
      );
      const snapshot = await getDocs(q);
      const lower = searchText.toLowerCase();

      const filtered = snapshot.docs.filter(doc => {
        const data = doc.data();
        return (
          data.content?.toLowerCase().includes(lower) ||
          data.authorHandle?.toLowerCase().includes(lower)
        );
      });

      const posts = await Promise.all(filtered.map(fetchPostWithReplies));
      return posts;
    } catch (error) {
      return rejectWithValue('Failed to search posts');
    }
  },
);

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    // Placeholder for future actions like appendPosts, resetFeed, etc.
  },
  extraReducers: builder => {
    builder
      // Post flow
      .addCase(postToFeed.pending, state => {
        state.status = 'posting';
        state.error = null;
      })
      .addCase(postToFeed.fulfilled, state => {
        state.status = 'succeeded';
      })
      .addCase(postToFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })

      // Refetch flow
      .addCase(refetchPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
      })
      .addCase(refetchPosts.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(loadMorePosts.fulfilled, (state, action) => {
        state.posts = [...state.posts, ...action.payload];
        state.loadedPostsNumber += action.payload.length;
      })
      .addCase(loadMorePosts.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(searchPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
      })
      .addCase(searchPosts.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default feedSlice.reducer;
