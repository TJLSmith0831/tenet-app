# Tenet

**Tenet** is a mobile-first social opinion network focused on structured discourse, user accountability, and mindful engagement. Built using React Native and Firebase, Tenet introduces unique interaction primitives like agreement sliders and Echo-based reposting to elevate the quality of digital conversations.

---

## Features

- **Post Creation & Feed**

  - Authenticated users can create public posts.
  - Infinite scrolling feed loads the latest posts in descending order of creation.

- **Community Agreement**

  - Users rate how much they agree with each post using a percentage slider.
  - An average agreement score is displayed via a color-coded progress bar.

- **Echo System**

  - Echo functions as a combination of a like and a repost.
  - Each user can toggle Echo once per post, updating the public echo count.

- **Replies**

  - Each user can submit one reply per post.
  - Replies are listed chronologically in a modal, directly under the post.
  - Profanity filtering and a 300-character limit ensure reply quality.

- **Search**

  - Users can search across post content and author handles.
  - Search bar expands and collapses for a clean UX.

- **Authentication & User Access**

  - Email/password-based authentication.
  - Authenticated users only can post, reply, or interact.

- **Logout & Session Management**
  - Logout option available in a Profile Settings modal.
  - Resets navigation and securely ends the session.

---

## Tech Stack

- **React Native (with TypeScript)**
- **Firebase**
  - Firestore for real-time data storage
  - Firebase Auth for user authentication
  - Firebase Functions (optional) for provisioning
- **Redux Toolkit** for global state management
- **React Native Paper** for UI components
- **Expo** for mobile development and build tooling

---

## Project Structure

```
tenet/
├── assets/                  # Static assets including logo
├── components/              # Shared UI components (e.g., PostCard, TenetSearchBar)
├── redux/                   # Redux slices and store
├── screens/                 # Screen-level components (FeedScreen, MainScreen, etc.)
├── services/
│   └── firebase/            # Firestore and Auth utility functions
├── navigation/              # Stack/tab navigation configuration
├── firebase.ts              # Firebase configuration
└── App.tsx                  # Root application file
```

---

## Firestore Structure

```
/posts/{postId}
  - content: string
  - authorDid: string
  - authorHandle: string
  - authorUid: string
  - createdAt: timestamp
  - echoCount: number
  - avgAgreementScore: number

/posts/{postId}/echoes/{userId}
  - exists: true (presence implies echo)

/posts/{postId}/agreements/{userId}
  - agreementScore: number

/posts/{postId}/replies/{userId}
  - replyText: string
  - createdAt: timestamp
  - authorHandle: string
```

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/tenet.git
cd tenet
```

2. Install dependencies:

```bash
npm install
```

3. Configure Firebase:

- Create a `firebase.ts` file with your Firebase project credentials.
- Enable Firestore and Authentication in the Firebase console.

4. Run the app:

```bash
npm start
```

---

## Development Notes

- Authentication state is managed via Firebase and Redux.
- Posts are loaded in batches of 50 with infinite scroll behavior.
- Firestore security rules enforce:
  - Authenticated-only access to write
  - One reply per user per post
  - Only post owners can delete their content

---

## Roadmap

- Dark mode toggle
- User profile customization
- Saved posts and personal libraries
- Notification system for replies and agreement spikes
- Decentralization architecture using AT Protocol

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## Contact

For questions, contributions, or feedback, reach out via GitHub Issues or contact the maintainer at [tjlsmith0831@gmail.com].
