import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, TextInput as RNTextInput, TouchableOpacity, Keyboard } from 'react-native';
import { FAB, useTheme, Text, Button } from 'react-native-paper';
import PostCard from '../../../components/PostCard';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { loadMorePosts, refetchPosts, searchPosts } from '../../../redux/slices/feedSlice';
import TenetSearchBar from '../../../components/TenetSearchBar';
import { Image } from 'react-native';
import { TenetLogo } from '../../../assets/logos';
const SCROLL_SPEED_LIMIT = 5000;
const REFRESH_TRIGGER_OFFSET = -50;

/**
 * FeedScreen Component
 *
 * The primary screen for displaying the user's personalized feed. This component handles:
 * - Post listing
 * - Scroll monitoring for intent-based refresh
 * - Pull-to-refresh and infinite scroll functionality
 * - An expandable search interface using TenetSearchBar
 *
 * Functional Overview:
 * ----------------------------------------------------------------------
 * Refresh Behavior:
 * - A floating action button (FAB) becomes active when the user scrolls upward past a threshold,
 *   indicating intent to refresh.
 * - Users may also trigger a pull-to-refresh gesture.
 * - Both methods dispatch the `refetchPosts()` async thunk, which:
 *   - Resets the post feed to the latest 50 posts
 *   - Resets `loadedPostsNumber` in the Redux store to 50
 *
 * Infinite Scroll:
 * - When the user scrolls near the bottom of the list (`onEndReachedThreshold = 0.4`),
 *   the `loadMorePosts()` thunk is dispatched.
 * - This fetches the next batch of posts starting after the last visible post,
 *   based on Firestore `createdAt` pagination.
 * - New posts are appended to the feed.
 * - `loadedPostsNumber` is incremented accordingly.
 * - A loading indicator is shown at the bottom of the screen while posts are loading.
 *
 * Search Functionality:
 * - The top of the screen includes the TenetSearchBar component.
 * - This toggles between a collapsed (icon) and expanded (text input) state,
 *   controlled via local state (`searchVisible` and `searchText`).
 * - This lays the groundwork for future real-time filtering or querying capabilities.
 *
 * Scroll Monitoring:
 * - The scroll velocity and direction are measured on each scroll event.
 * - Excessive scroll speed is logged for diagnostic or UX purposes.
 * - If the user scrolls upward past a configured offset, `canRefresh` is set to true,
 *   enabling the refresh FAB.
 *
 * Redux Integration:
 * - Posts are sourced from the Redux `feed.posts` state via `useAppSelector`.
 * - Thunks `refetchPosts` and `loadMorePosts` are dispatched via `useAppDispatch`.
 *
 * Visual Elements:
 * - A persistent search bar that expands/contracts.
 * - A `FlatList` of `PostCard` components for rendering posts.
 * - A FAB used for manual feed refresh.
 * - A bottom loading indicator when additional posts are being fetched.
 *
 * This component prioritizes a clean UX while balancing performance and scalability
 * for continuous content loading and user-driven interaction.
 */
const FeedScreen = ({ latestPostId }: { latestPostId: string | null }) => {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const posts = useAppSelector(state => state.feed.posts);
  const user = useAppSelector(state => state.auth.user);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  const [showRefresh, setShowRefresh] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const scrollOffset = useRef(0);
  const lastTime = useRef(Date.now());

  useEffect(() => {
    if (latestPostId && latestPostId !== posts[0]?.postId) {
      setShowRefresh(true);
    }
  }, [latestPostId]);

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const dy = currentOffset - scrollOffset.current;

    if (dy < REFRESH_TRIGGER_OFFSET) {
      setCanRefresh(true);
    } else {
      setCanRefresh(false);
    }

    scrollOffset.current = currentOffset;
    lastTime.current = Date.now();
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      const trimmed = searchText.trim();
      if (trimmed) {
        setSearchMode(true);
        dispatch(searchPosts(trimmed));
      } else {
        setSearchMode(false);
        dispatch(refetchPosts());
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchText]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: 48,
          paddingHorizontal: 12,
          backgroundColor: colors.background,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <TenetSearchBar
            visible={searchVisible}
            value={searchText}
            onChangeText={setSearchText}
            onPress={() => setSearchVisible(!searchVisible)}
            onCollapse={() => {
              setSearchText('');
              setSearchVisible(false);
              setSearchMode(false);
            }}
          />
        </View>
        <TenetLogo />
      </View>

      {searchMode && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Button
            icon="arrow-left"
            mode="outlined"
            onPress={() => {
              setSearchText('');
              setSearchVisible(false);
              setSearchMode(false);
              dispatch(refetchPosts());
              Keyboard.dismiss();
            }}
          >
            Back to My Feed
          </Button>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={item => item.postId}
        renderItem={({ item }) => (
          <PostCard item={item} isUserPost={user?.handle === item.authorHandle} />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onRefresh={async () => {
          setRefreshing(true);
          await dispatch(refetchPosts());
          setRefreshing(false);
        }}
        refreshing={refreshing}
        onEndReached={async () => {
          if (!loadingMore && posts.length >= 50) {
            setLoadingMore(true);
            await dispatch(loadMorePosts());
            setLoadingMore(false);
          }
        }}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          searchText.trim().length > 0 ? (
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 16 }}>
                No results found!
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.onSurface }}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      <FAB
        icon="refresh"
        label="Refresh"
        onPress={() => {
          dispatch(refetchPosts());
          setCanRefresh(false);
          setShowRefresh(false);
        }}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 24,
          backgroundColor:
            !loadingMore && (canRefresh || showRefresh) && !refreshing ? colors.primary : '#ccc',
        }}
        color="white"
        disabled={!(canRefresh || showRefresh) || refreshing || loadingMore}
      />
    </View>
  );
};

export default FeedScreen;
