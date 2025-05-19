import React, { useState, useEffect } from 'react';
import { Alert, View } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';

// @ts-ignore
import profanity from 'leo-profanity';

import { NewPostInput } from '../../../redux/types';
import { postToFeed } from '../../../redux/slices/feedSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { BottomNavScreen } from '../../../components/BottomNav';

const normalizeUrl = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const unsafeDomains = ['porn', 'xvideos', 'redtube', 'onlyfans', 'nsfw', 'lush'];
/**
 * Checks if a given URL points to a known NSFW domain.
 *
 * @param normalizedURL - The URL string to validate
 * @returns true if safe, false if blocked
 */
const isSafeURL = (normalizedURL: string): boolean => {
  try {
    const parsed = new URL(normalizedURL);
    const hostname = parsed.hostname.toLowerCase();

    return !unsafeDomains.some(blocked => {
      return (
        hostname === blocked || hostname === `www.${blocked}` || hostname.endsWith(`.${blocked}`)
      );
    });
  } catch {
    return false; // invalid URL
  }
};

type PostScreenProps = {
  setFocusedScreen: (screen: BottomNavScreen) => void;
};

/**
 * PostScreen Component
 *
 * A screen where the user can write and submit a new post.
 * Includes content and optional source metadata.
 */
const PostScreen = ({ setFocusedScreen }: PostScreenProps) => {
  const { colors } = useTheme();
  const [content, setContent] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceURL, setSourceURL] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user)!;

  useEffect(() => {
    const trimmed = content.trim();

    if (trimmed.length > 300) {
      setInvalidReason('Too long');
      setIsValid(false);
      return;
    }

    if (profanity.check(trimmed)) {
      setInvalidReason('Profanity detected');
      setIsValid(false);
      return;
    }

    const normalizedSourceURL = normalizeUrl(sourceURL.trim());

    if ((sourceTitle && !sourceURL) || (!sourceTitle && sourceURL)) {
      setInvalidReason('Both source title and URL are required');
      setIsValid(false);
      return;
    }

    if (sourceTitle && profanity.check(sourceTitle)) {
      setInvalidReason('Profanity in title');
      setIsValid(false);
      return;
    }

    if (sourceURL && !isSafeURL(normalizedSourceURL)) {
      setInvalidReason('Unsafe link');
      setIsValid(false);
      return;
    }

    // Valid
    setInvalidReason(null);
    setIsValid(trimmed.length > 10);
  }, [content, sourceTitle, sourceURL]);

  const handlePost = async () => {
    setLoading(true);
    const trimmed = content.trim();

    const post: NewPostInput = {
      content: trimmed,
      authorUid: user.uid,
      authorDid: user.did,
      authorHandle: user.handle,
      sourceTitle: sourceTitle.trim() || undefined,
      sourceURL: normalizeUrl(sourceURL).trim() || undefined, // add http
      parentId: null,
      visibility: 'public',
    };

    try {
      const postId = await dispatch(postToFeed(post));
      if (postId) {
        setContent('');
        setSourceTitle('');
        setSourceURL('');

        // Navigate to FeedScreen
        setFocusedScreen('my_feed');
      } else {
        Alert.alert('Post Failed', 'Your post could not be submitted. Please try again.');
      }
    } catch (error: any) {
      console.error('Post submission error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }

    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, marginTop: '10%' }}>
      <Text variant="titleMedium" style={{ marginBottom: 12 }}>
        Share your thoughts
      </Text>

      <TextInput
        mode="outlined"
        multiline
        numberOfLines={10}
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        style={{ height: 180, marginBottom: 12 }}
        autoCapitalize="none"
      />
      <Text variant="bodySmall" style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
        {invalidReason ? `${invalidReason} — ` : ''}
        {content.length}/300
      </Text>

      {/* Inline source fields */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TextInput
          mode="outlined"
          placeholder="Source title (optional)"
          value={sourceTitle}
          onChangeText={setSourceTitle}
          style={{ flex: 1, fontSize: 14 }}
          autoCapitalize="none"
        />
        <TextInput
          mode="outlined"
          placeholder="Source URL (optional)"
          value={sourceURL}
          onChangeText={setSourceURL}
          keyboardType="url"
          style={{ flex: 1, fontSize: 14 }}
          autoCapitalize="none"
        />
      </View>

      <Button
        mode="contained"
        onPress={handlePost}
        disabled={!isValid || loading}
        loading={loading}
      >
        Post
      </Button>
    </View>
  );
};

export default PostScreen;
