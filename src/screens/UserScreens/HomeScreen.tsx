import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import FeedScreen from './FeedScreens/FeedScreen';
import BottomNav from '../../components/BottomNav';
import PostScreen from './PostScreens/PostScreen';
import ProfileScreen from './ProfileScreens/ProfileScreen';
import { useAppSelector } from '../../redux/store';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';

const HomeScreen = () => {
  const { colors } = useTheme();
  const user = useAppSelector(state => state.auth.user);
  const [focusedScreen, setFocusedScreen] = useState<'my_feed' | 'create_post' | 'profile'>(
    'my_feed',
  );
  const [latestPostId, setLatestPostId] = useState<string | null>(null);
  const posts = useAppSelector(state => state.feed.posts);

  useEffect(() => {
    const interval = setInterval(async () => {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      const newest = snapshot.docs[0];

      if (newest && newest.id !== posts[0]?.postId) {
        setLatestPostId(newest.id); // This will be passed to FeedScreen
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [posts]);

  if (!user) return;

  const renderFocusedScreen = () => {
    switch (focusedScreen) {
      case 'create_post':
        return <PostScreen setFocusedScreen={setFocusedScreen} />;
      case 'profile':
        return <ProfileScreen user={user} />;
      case 'my_feed':
        return <FeedScreen latestPostId={latestPostId} />;
      default:
        return <FeedScreen latestPostId={latestPostId} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {renderFocusedScreen()}
      <BottomNav focusedScreen={focusedScreen} setFocusedScreen={setFocusedScreen} />
    </View>
  );
};

export default HomeScreen;
