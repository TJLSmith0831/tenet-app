import { Timestamp } from '@google-cloud/firestore';

/**
 * Post object stored in Firestore.
 */
export interface Post {
  postId: string; // Firestore document ID
  authorUid: string;
  authorDid: string;
  authorHandle: string;
  content: string;
  createdAt: string | Date; // Firestore timestamp can be converted to string or Date
  echoCount: number;
  replyCount: number;
  avgAgreementScore: number;

  /**
   * Optional. Only populated client-side for the current user viewing the post.
   */
  userAgreementScore?: number;

  /**
   * Optional. Only present when rendering replies.
   */
  parentId?: string | null;

  /**
   * Optional. Visibility of the post. Defaults to 'public'.
   */
  visibility?: 'public' | 'private' | 'followers';

  hashtags?: string[];
  sourceTitle?: string;
  sourceURL?: string;
  replies?: Reply[];
}

export type NewPostInput = Omit<
  Post,
  'postId' | 'createdAt' | 'echoCount' | 'replyCount' | 'avgAgreementScore' | 'userAgreementScore'
>;

export type Reply = {
  id: string;
  userId: string;
  authorHandle: string;
  replyText: string;
  createdAt: Timestamp;
};
