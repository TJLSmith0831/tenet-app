import {
  submitPost,
  updateAgreementScore,
  toggleEcho,
  deletePost,
  submitReply,
  fetchPostWithReplies,
} from '../postUtils';
import * as firebase from '../../../../firebase';
import {
  addDoc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  increment,
  doc,
  collection,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

// Mocks
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  increment: jest.fn(),
  serverTimestamp: jest.fn(() => 'MOCK_TIMESTAMP'),
  query: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('../../../../firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'user123',
      email: 'user@example.com',
    },
  },
}));

describe('Firestore Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock doc() and increment() return shapes
    (doc as jest.Mock).mockImplementation((...args) => ({ path: args.join('/') }));
    (increment as jest.Mock).mockImplementation(val => `increment(${val})`);
  });

  test('submitPost submits a new post and returns ID', async () => {
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'mockPostId' });

    const result = await submitPost({
      content: '  Hello world  ',
      authorUid: 'user123',
      authorDid: 'did:abc',
      authorHandle: 'user',
      sourceTitle: ' Title ',
      sourceURL: ' http://url.com ',
      postId: '',
      createdAt: '',
      echoCount: 0,
      replyCount: 0,
      avgAgreementScore: 0,
    });

    expect(addDoc).toHaveBeenCalled();
    expect(result).toBe('mockPostId');
  });

  test('updateAgreementScore stores user score and updates avg', async () => {
    const mockDocs = [{ data: () => ({ score: 80 }) }, { data: () => ({ score: 100 }) }];
    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: mockDocs });

    const avg = await updateAgreementScore('post123', 'user123', 90);
    expect(setDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledWith(expect.objectContaining({ path: expect.any(String) }), {
      avgAgreementScore: 90,
    });
    expect(avg).toBe(90);
  });

  test('toggleEcho un-echoes if already exists', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true });

    const result = await toggleEcho('post123', 'user123');

    expect(deleteDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { echoCount: 'increment(-1)' });
    expect(result).toBe(false);
  });

  test('toggleEcho echoes if not already exists', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

    const result = await toggleEcho('post123', 'user123');

    expect(setDoc).toHaveBeenCalled();
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { echoCount: 'increment(1)' });
    expect(result).toBe(true);
  });

  test('deletePost deletes post and subcollections', async () => {
    (getDocs as jest.Mock)
      .mockResolvedValueOnce({ docs: [{ ref: 'doc1' }] }) // agreements
      .mockResolvedValueOnce({ docs: [{ ref: 'doc2' }] }) // echoes
      .mockResolvedValueOnce({ docs: [] }); // replies

    await deletePost('post123');

    expect(deleteDoc).toHaveBeenCalledTimes(3); // 2 sub-docs + post
  });

  test('submitReply submits a reply for authenticated user', async () => {
    await submitReply('post123', 'Thanks for sharing');

    expect(setDoc).toHaveBeenCalledWith(expect.objectContaining({ path: expect.any(String) }), {
      userId: 'user123',
      replyText: 'Thanks for sharing',
      createdAt: 'MOCK_TIMESTAMP',
      authorHandle: 'user',
    });
  });

  test('submitReply throws if not authenticated', async () => {
    const originalUser = firebase.auth.currentUser;
    (firebase.auth as any).currentUser = null;

    await expect(submitReply('post123', 'Hello')).rejects.toThrow('User not authenticated');

    // Restore original user
    (firebase.auth as any).currentUser = originalUser;
  });

  test('fetchPostWithReplies returns post with replies', async () => {
    const mockReplies = [
      {
        id: 'reply1',
        data: () => ({ replyText: 'test1', userId: '1' }),
      },
      {
        id: 'reply2',
        data: () => ({ replyText: 'test2', userId: '2' }),
      },
    ];

    const docSnap = {
      id: 'post123',
      data: () => ({
        content: 'Test Post',
        authorUid: 'user123',
        authorDid: 'did:abc',
        authorHandle: 'user',
        createdAt: 'timestamp',
        echoCount: 1,
        replyCount: 2,
        avgAgreementScore: 100,
        visibility: 'public',
        parentId: null,
        sourceTitle: '',
        sourceURL: '',
      }),
    };

    (getDocs as jest.Mock).mockResolvedValueOnce({ docs: mockReplies });

    const result = await fetchPostWithReplies(docSnap);

    expect(result.content).toBe('Test Post');
    expect(result.replies).toHaveLength(2);
  });
});
