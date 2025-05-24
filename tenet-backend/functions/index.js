const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();

exports.helloWorld = onRequest((request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from Firebase!');
});

exports.provisionUser = onCall(async request => {
  const { data, auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.');
  }

  const { username, name } = data;
  const uid = auth.uid;

  // Check for existing username
  const usersQuery = await admin
    .firestore()
    .collection('users')
    .where('username', '==', username)
    .get();

  if (!usersQuery.empty) {
    throw new HttpsError('already-exists', 'Username is already taken.');
  }

  // Compose handle
  const handle = `${username}.tenetapp.space`;

  // (MVP) Simulate ATP provisioning (TODO: automate or manual as needed)
  const did = `did:plc:${handle}:${Date.now()}`; // Replace with real DID provisioning later

  // Store in Firestore
  const userRef = admin.firestore().collection('users').doc(uid);
  await userRef.set(
    {
      username,
      name,
      handle,
      did,
      provisionStatus: 'provisioned',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Return status/info to client
  return { handle, did, status: 'provisioned' };
});

exports.loginUser = onCall(async request => {
  const { auth } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in.');
  }

  const uid = auth.uid;

  // 2. Fetch the user document from Firestore
  const userDoc = await admin.firestore().collection('users').doc(uid).get();

  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User record not found.');
  }
  const userData = userDoc.data();

  // 3. Return Firestore fields (plus UID)
  return {
    uid,
    username: userData.username,
    name: userData.name,
    handle: userData.handle,
    bio: userData.bio,
    avatarUri: userData.avatarUri,
    did: userData.did,
    provisionStatus: userData.provisionStatus,
    createdAt: userData.createdAt.toDate().toISOString(),
    // any other Firestore fields you need…
  };
});
