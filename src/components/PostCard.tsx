// components/PostCard.tsx
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Linking,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Divider,
  IconButton,
  Portal,
  ProgressBar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { TENET_URL } from '../_const';
import {
  updateAgreementScore,
  toggleEcho,
  deletePost,
  submitReply,
} from '../services/firebase/postUtils';
import { auth, db } from '../../firebase';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { useAppDispatch } from '../redux/store';
import { refetchPosts } from '../redux/slices/feedSlice';

// @ts-ignore
import profanity from 'leo-profanity';
profanity.loadDictionary();

/**
 * Converts a Firestore timestamp into a short relative format.
 *
 * - "Today at HH:MM"
 * - "Yesterday at HH:MM"
 * - "MM/DD/YY at HH:MM" for older posts
 *
 * @param timestamp - Firestore Timestamp or ISO string
 * @returns A formatted string representing the post date
 */
const formatPostTimestamp = (timestamp: any): string => {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;

  const shortDate = date.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
  return `${shortDate} at ${time}`;
};

/**
 * Returns a color based on agreement score sentiment.
 *
 * @param score - Agreement percentage from 0 to 100
 * @returns A hex color string:
 *  - Green for 75+
 *  - Yellow for 40–74
 *  - Red for below 40
 */
const getAgreementColor = (score: number): string => {
  if (score >= 75) return '#28a745'; // green
  if (score >= 40) return '#ffc107'; // yellow
  return '#dc3545'; // red
};

/**
 * PostCard Component
 *
 * Renders an individual post inside the feed, including:
 * - Author name and timestamp
 * - Post content and optional source link
 * - Community agreement percentage with color-coded progress bar
 * - Agreement slider for logged-in users to rate alignment
 * - Echo (like+repost) button with animated feedback
 * - Reply system with modal-based reply mode:
 *    - Users can view all replies ordered by creation time
 *    - Each user may only submit one reply per post
 *    - Replies are shown with author handles and content
 *    - Users cannot reply to replies (no nesting)
 * - Delete button for post owner
 *
 * Props:
 * @param item - The Post object being rendered
 * @param isUserPost - Whether this post was created by the logged-in user
 */
const PostCard = ({ item, isUserPost }: { item: any; isUserPost: boolean }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const [userAgreement, setUserAgreement] = useState(item.userAgreementScore ?? 50);
  const [communityAgreement, setCommunityAgreement] = useState(item.avgAgreementScore ?? 0);
  const [hasEchoed, setHasEchoed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [echoCount, setEchoCount] = useState(item.echoCount ?? 0);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const triggerEchoAnimation = () => {
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.4,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start();
  };

  useEffect(() => {
    const checkEchoStatus = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const echoDocRef = doc(db, 'posts', item.postId, 'echoes', userId);
      const snap = await getDoc(echoDocRef);
      setHasEchoed(snap.exists());
    };

    checkEchoStatus();
  }, []);

  const [replyMode, setReplyMode] = useState(false);
  const [replies, setReplies] = useState<any[]>(item.replies ?? []);
  const [replyText, setReplyText] = useState('');
  const [alreadyReplied, setAlreadyReplied] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!item.replies) return;
    setReplies(item.replies);
    const userId = auth.currentUser?.uid;
    setAlreadyReplied(item.replies.some((r: any) => r.userId === userId));
  }, [item.replies]);

  const handleAgreementChange = async (value: number) => {
    setUserAgreement(value);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const newAvg = await updateAgreementScore(item.postId, userId, value);
      setCommunityAgreement(newAvg);
    } catch (e) {
      console.warn('Failed to update agreement:', e);
    }
  };

  let cardTitle = item.authorHandle.replace(`.${TENET_URL}`, '');
  if (isUserPost) {
    cardTitle = 'You';
  }

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.surface }}>
      <Card.Title title={cardTitle} subtitle={formatPostTimestamp(item.createdAt)} />
      <Card.Content>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>{item.content}</Text>
        {item.sourceTitle && item.sourceURL && (
          <Text
            style={{
              marginTop: 4,
              marginBottom: 4,
              color: colors.primary,
              textDecorationLine: 'underline',
              fontSize: 14,
            }}
            onPress={() => {
              // Validate then open link
              try {
                const url = new URL(item.sourceURL);
                if (url.protocol.startsWith('http')) {
                  Linking.openURL(item.sourceURL);
                }
              } catch (e) {
                console.warn('Invalid URL:', item.sourceURL);
              }
            }}
          >
            {item.sourceTitle}
          </Text>
        )}

        <Divider style={{ marginTop: 2 }} />
        <Text
          style={{ fontSize: 13, marginBottom: 4, marginTop: 2 }}
        >{`Community Agreement: ${Math.min(communityAgreement, 100)}%`}</Text>
        <ProgressBar
          progress={Math.min(communityAgreement, 100) / 100}
          color={getAgreementColor(communityAgreement)}
          style={{ height: 10, borderRadius: 5, backgroundColor: '#ccc', marginBottom: 12 }}
        />

        {!isUserPost && (
          <>
            <Text style={{ fontSize: 13, marginBottom: 4 }}>How much do you agree?</Text>
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={userAgreement}
              onValueChange={setUserAgreement}
              onSlidingComplete={handleAgreementChange}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor="#ccc"
              thumbTintColor={colors.primary}
              style={{ height: 40 }}
            />
          </>
        )}

        <Divider />
      </Card.Content>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderRadius: 12,
          marginHorizontal: 12,
          marginBottom: 8,
        }}
      >
        {!isUserPost && (
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              transform: [{ scale: scaleAnim }],
            }}
          >
            <IconButton
              icon={hasEchoed ? 'volume-high' : 'volume-off'}
              iconColor={hasEchoed ? colors.primary : colors.onSurface}
              size={20}
              onPress={async () => {
                const userId = auth.currentUser?.uid;
                if (!userId) return;

                triggerEchoAnimation();
                const echoed = await toggleEcho(item.postId, userId);
                setHasEchoed(echoed);
                setEchoCount((prev: number) => prev + (echoed ? 1 : -1));
              }}
            />
            <Text>{echoCount}</Text>
          </Animated.View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="comment-outline" size={20} onPress={() => setReplyMode(true)} />
          <Text>{replies.length}</Text>
        </View>

        {isUserPost && <IconButton icon="delete" onPress={() => setShowDeleteConfirm(true)} />}
      </View>
      <Portal>
        <Dialog visible={showDeleteConfirm} onDismiss={() => setShowDeleteConfirm(false)}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this post? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              textColor={colors.error}
              onPress={async () => {
                try {
                  await deletePost(item.postId);
                  setShowDeleteConfirm(false);
                  dispatch(refetchPosts());
                } catch (err) {
                  console.warn('Failed to delete post:', err);
                  setShowDeleteConfirm(false);
                }
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        {replyMode && (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1 }}>
              <Dialog
                visible={replyMode}
                onDismiss={() => setReplyMode(false)}
                style={{
                  flex: 1,
                  marginTop: 0,
                  marginBottom: 0,
                  justifyContent: 'flex-start',
                  height: '100%',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 24,
                    paddingBottom: 12,
                    width: '100%',
                  }}
                >
                  <Text variant="titleLarge" style={{ flex: 1 }}>
                    Replies
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={() => setReplyMode(false)}
                    accessibilityLabel="Close"
                    style={{ margin: 0 }}
                  />
                </View>

                {/* Parent Post Preview */}
                <Card
                  style={{
                    marginBottom: 12,
                    backgroundColor: colors.surfaceVariant,
                    width: '90%',
                    alignSelf: 'center',
                  }}
                >
                  <Card.Title
                    title={isUserPost ? 'You' : item.authorHandle.replace(`.${TENET_URL}`, '')}
                    subtitle={formatPostTimestamp(item.createdAt)}
                  />
                  <Card.Content>
                    <Text>{item.content}</Text>
                  </Card.Content>
                </Card>

                {/* Replies Section */}
                <Dialog.ScrollArea style={{ flexGrow: 1, height: '100%' }}>
                  <Dialog.Content>
                    {replies.length === 0 ? (
                      <Text style={{ marginBottom: 12 }}>No replies so far.</Text>
                    ) : (
                      replies.map(reply => (
                        <View key={reply.id} style={{ marginBottom: 8, marginTop: 10 }}>
                          <Text style={{ fontWeight: 'bold' }}>{reply.authorHandle}</Text>
                          <Text>{reply.replyText}</Text>
                          <Divider style={{ marginTop: 6 }} />
                        </View>
                      ))
                    )}
                  </Dialog.Content>
                </Dialog.ScrollArea>

                {/* Input */}
                {!isUserPost && (
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={40}
                  >
                    {!alreadyReplied && (
                      <Dialog.Content>
                        <TextInput
                          label="Your reply"
                          value={replyText}
                          onChangeText={text => {
                            setReplyText(text.slice(0, 300));
                            if (text.length > 300) setError('Reply cannot exceed 300 characters.');
                            else setError('');
                          }}
                          multiline
                          mode="outlined"
                          error={!!error}
                        />
                        <Text style={{ textAlign: 'right', fontSize: 12 }}>
                          {replyText.length}/300
                        </Text>
                        {error && <Text style={{ color: colors.error }}>{error}</Text>}
                      </Dialog.Content>
                    )}

                    <Dialog.Actions style={{ justifyContent: 'flex-end' }}>
                      {!alreadyReplied ? (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                          <Button onPress={() => setReplyMode(false)}>Cancel</Button>
                          <Button
                            onPress={async () => {
                              const trimmed = replyText.trim();
                              if (!trimmed) return setError('Reply cannot be empty.');
                              if (profanity.check(trimmed))
                                return setError('Please remove profanity.');
                              await submitReply(item.postId, trimmed);
                              setReplyText('');
                              setReplyMode(false);
                              dispatch(refetchPosts());
                            }}
                            disabled={replyText.trim().length === 0 || !!error}
                          >
                            Submit
                          </Button>
                        </View>
                      ) : (
                        <Dialog.Content>
                          <Text>You Already Replied!</Text>
                        </Dialog.Content>
                      )}
                    </Dialog.Actions>
                  </KeyboardAvoidingView>
                )}
              </Dialog>
            </View>
          </TouchableWithoutFeedback>
        )}
      </Portal>
    </Card>
  );
};

export default PostCard;
