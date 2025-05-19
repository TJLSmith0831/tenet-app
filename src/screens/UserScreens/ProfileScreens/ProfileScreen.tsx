import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  Dialog,
  Divider,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import PostCard from '../../../components/PostCard';
import { useAppSelector } from '../../../redux/store';
import { AuthState } from '../../../redux/slices/authSlice';
import { Post } from '../../../redux/types';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../../../../firebase';

/**
 * NumberTile Component
 *
 * Displays a numeric stat with a center-aligned label.
 *
 * @param label - Description of the stat
 * @param value - Numeric value of the stat
 */
const NumberTile = ({ label, value }: { label: string; value: number }) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        padding: 16,
        margin: 8,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
      }}
    >
      <Text variant="headlineSmall" style={{ textAlign: 'center' }}>
        {value}
      </Text>
      <Text
        variant="bodySmall"
        style={{
          color: colors.onSurface,
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
};

/**
 * ProfileHistory Component
 *
 * Displays a list of the user's recent posts using the PostCard component.
 * Can be connected to Firestore for real post data in the future.
 *
 * @returns A vertical list of PostCards representing recent activity.
 */
const ProfileHistory = ({ myPosts }: { myPosts: Post[] }) => {
  return (
    <View style={{ marginTop: 24 }}>
      <Text variant="titleSmall" style={{ marginBottom: 12 }}>
        Post History
      </Text>

      {myPosts.map(post => (
        <PostCard key={post.postId} item={post} isUserPost={true} />
      ))}
    </View>
  );
};

/**
 * ProfileScreen Component
 *
 * Displays the user's profile information, including avatar, handle, bio,
 * and core engagement metrics.
 *
 * @returns A screen with editable profile details and key metrics.
 */
const ProfileScreen = ({ user }: { user: AuthState }) => {
  const { colors } = useTheme();
  const posts = useAppSelector(state => state.feed.posts);
  const myPosts = posts.filter(post => post.authorHandle === user.handle);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const navigation = useNavigation();

  const stats = useMemo(() => {
    const totalPosts = myPosts.length;

    const totalAgreement = myPosts.reduce((sum, post) => sum + (post.avgAgreementScore ?? 0), 0);
    const totalEchoes = myPosts.reduce((sum, post) => sum + (post.echoCount ?? 0), 0);

    return {
      averageAgreement: totalPosts > 0 ? Math.round(totalAgreement / totalPosts) : 0,
      totalEchoes,
      // averageScrollVelocity: 3.2, // you can plug in a real value later
    };
  }, [myPosts]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <Appbar.Header style={{ backgroundColor: colors.background }}>
        <Appbar.Content title="Profile" />
        <Appbar.Action icon="cog" onPress={() => setSettingsVisible(true)} />
      </Appbar.Header>
      {/* Profile Header */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        {/* <Avatar.Image size={100} source={{ uri: profile.photoUrl }} style={{ marginBottom: 12 }} /> */}
        <Avatar.Text size={100} label="" style={{ backgroundColor: '#e0e0e0', marginBottom: 12 }} />

        <Text variant="titleMedium">{user.name}</Text>
        <Text variant="titleMedium">{user.handle}</Text>
        {/* <Text
          variant="bodyMedium"
          style={{ textAlign: 'center', marginTop: 4, color: colors.onSurface }}
        >
          {user.bio}
        </Text> */}
      </View>

      {/* NumberTiles Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <NumberTile label="Avg. Agreement" value={stats.averageAgreement} />
        <NumberTile label="Total Echoes" value={stats.totalEchoes} />
        {/* <NumberTile label="Scroll Velocity" value={stats.averageScrollVelocity} /> */}
      </View>
      <ProfileHistory myPosts={myPosts} />
      <Portal>
        <Dialog visible={settingsVisible} onDismiss={() => setSettingsVisible(false)}>
          <Dialog.Title>Settings</Dialog.Title>
          <Dialog.Content>
            <Text>Manage your account settings below.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={async () => {
                await signOut(auth);
                setSettingsVisible(false);
                navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
              }}
            >
              Logout
            </Button>
            <Button onPress={() => setSettingsVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

export default ProfileScreen;
