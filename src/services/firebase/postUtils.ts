import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  getDoc,
  deleteDoc,
  increment,
} from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { Post } from '../../redux/types';

/**
 * Submits a new post to the Firestore `posts` collection.
 * Ensures trimmed content and initializes base post metadata.
 *
 * @param post - A Post object containing author and content data.
 * @returns The new document ID if successful, otherwise null.
 */
export const submitPost = async (post: Post): Promise<string | null> => {
  const {
    content,
    authorUid,
    authorDid,
    authorHandle,
    sourceTitle,
    sourceURL,
    visibility = 'public',
    parentId = null,
  } = post;

  const trimmed = content.trim();

  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      content: trimmed,
      authorUid,
      authorDid,
      authorHandle,
      createdAt: serverTimestamp(),
      echoCount: 0,
      replyCount: 0,
      avgAgreementScore: 0,
      visibility,
      parentId,
      ...(sourceTitle ? { sourceTitle: sourceTitle.trim() } : {}),
      ...(sourceURL ? { sourceURL: sourceURL.trim() } : {}),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error submitting post:', error);
    return null;
  }
};

/**
 * Updates the user's agreement score on a post and recalculates the average.
 *
 * @param postId - ID of the post
 * @param userId - Authenticated user's ID
 * @param score - User's score (0–100)
 */
export const updateAgreementScore = async (
  postId: string,
  userId: string,
  score: number,
): Promise<number> => {
  const agreementRef = doc(db, 'posts', postId, 'agreements', userId);
  const agreementsCol = collection(db, 'posts', postId, 'agreements');
  const postRef = doc(db, 'posts', postId);

  // 1. Save this user's score
  await setDoc(agreementRef, { score }, { merge: true });

  // 2. Fetch all scores to recalculate average
  const snapshot = await getDocs(agreementsCol);
  const scores: number[] = snapshot.docs.map(doc => doc.data().score || 0);

  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // 3. Update post document
  await updateDoc(postRef, { avgAgreementScore: avg });
  return avg;
};

/**
 * Toggles echo status for the current user on a given post.
 * Increments or decrements the post's echoCount.
 *
 * @returns {Promise<boolean>} true if echoed, false if un-echoed
 */
export const toggleEcho = async (postId: string, userId: string): Promise<boolean> => {
  const echoRef = doc(db, 'posts', postId, 'echoes', userId);
  const postRef = doc(db, 'posts', postId);
  const echoSnap = await getDoc(echoRef);

  if (echoSnap.exists()) {
    await deleteDoc(echoRef);
    await updateDoc(postRef, { echoCount: increment(-1) });
    return false;
  } else {
    await setDoc(echoRef, { echoed: true });
    await updateDoc(postRef, { echoCount: increment(1) });
    return true;
  }
};

/**
 * Deletes a post and optionally its subcollections (agreements, echoes, replies).
 *
 * @param postId - The ID of the post to delete
 */
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const subcollections = ['agreements', 'echoes', 'replies'];

    for (const sub of subcollections) {
      const subRef = collection(db, 'posts', postId, sub);
      const snapshot = await getDocs(subRef);
      const deletions = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletions);
    }

    await deleteDoc(doc(db, 'posts', postId));
  } catch (err) {
    console.error('Error deleting post:', err);
    throw err;
  }
};

/**
 * Submits a reply to a post.
 *
 * :param postId: ID of the parent post
 * :param replyText: Text content of the reply
 * :returns: Promise<void>
 */
export const submitReply = async (postId: string, replyText: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const replyRef = doc(db, 'posts', postId, 'replies', user.uid);

  await setDoc(replyRef, {
    userId: user.uid,
    replyText,
    createdAt: serverTimestamp(),
    authorHandle: user.email?.split('@')[0],
  });
};
