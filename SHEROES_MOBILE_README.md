# Sheroes mobile integration guide

This repository contains the MaSphere website, not the Android APK source. Use this guide to add the same Sheroes experience to the APK and connect it to the shared Firebase backend.

## 1. Connect the APK to the same backend

- Configure the app with the existing Firebase project (`masphere-4a6ff`) and the Android app registration for that project. Do not copy web API keys into source control, and never ship a Firebase Admin/service-account key in an APK.
- Use Firebase Authentication with the currently signed-in MaSphere account. Sheroes data is keyed by the Firebase Auth UID.
- Deploy the latest root `firestore.rules` before enabling the feature:

  ```sh
  firebase deploy --only firestore:rules --project masphere-4a6ff
  ```

- In production, set up Firebase rather than using the website's `VITE_USE_MOCK` browser-only demo mode.

## 2. Add the Sheroes entry and membership gate

Add **Sheroes** as its own primary-navigation destination, available from the main app after login. Use a scoped pink/rose palette for its screens; do not change the rest of the app theme.

On first entry, explain that Sheroes is a women-only space and ask the user to confirm **“I identify as a woman”**. On confirmation, create:

`sheroesMembers/{uid}`

Document fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `uid` | string | Same as the Firebase Auth UID |
| `name` | string | Current MaSphere display name |
| `joinedAt` | Firestore Timestamp | Server creation time |

The app should check the current user's membership document before loading Sheroes content. Membership is self-attested, not independently verified. Do not put gender or other sensitive identity data in public profile fields. Rules permit a member to read their own membership document and permit only the matching signed-in UID to create it.

## 3. Use these Firestore collections

The website uses the same documents and field names:

### `sheroesPosts/{postId}`

```text
authorId: string
author: string
text: string                 // 0–500 characters; required when there is no image
category: string             // "Daily moment", "Wellbeing", or "Milestone"
imageUrl: string             // Empty when no image is attached
imagePath: string            // Empty when no image is attached
likes: integer
likedBy: string[]            // Firebase UIDs
comments: { author, text }[]
createdAt: Firestore Timestamp
```

Subscribe to `sheroesPosts`, ordered by `createdAt` descending. Add a post with the signed-in UID and profile name; `text` may be empty only when an image is attached. Use Firestore transactions for likes and comments so simultaneous updates are not lost. Comments are limited to 500 characters.

For an optional image, upload one image (maximum 10 MB) to `sheroes-posts/{uid}/{postId}/{fileName}` and set `imageUrl` to its Firebase Storage download URL and `imagePath` to that exact storage path. Keep both fields empty when there is no image. Storage rules limit reads to Sheroes members and writes/deletes to the matching UID.

### `sheroesChallenges/{challengeId}`

```text
title: string                // 1–80 characters
description: string          // 0–300 characters
activity: string              // 1–50 characters; any activity label
target: integer              // 1–1,000,000
startDate: "YYYY-MM-DD"
endDate: "YYYY-MM-DD"
ownerId: string              // Firebase UID
owner: string
participantCount: integer
createdAt: Firestore Timestamp
```

Subscribe to `sheroesChallenges`, ordered by `createdAt` descending. Let challenge creators name any activity (for example, walking steps, yoga sessions, meditation minutes, or reading pages). The target is a challenge-window total for that activity, not an automatically measured daily score.

### `sheroesChallenges/{challengeId}/participants/{uid}`

```text
userId: string               // Same as document ID and Firebase UID
name: string
progress: integer            // 0–1,000,000
joinedAt: Firestore Timestamp
updatedAt: Firestore Timestamp
```

To join, run a Firestore transaction: read the challenge and participant documents, return if already joined, create the caller's participant document with progress `0`, and increment the challenge's `participantCount`. This transaction is required because the rules verify that a new participant and the counter increment happen together. A user may update only their own progress. For the board, order a challenge's participants by `progress` descending and limit the query (the website shows five).

## 4. Build the screens

Inside Sheroes, provide three sections:

1. **Feed** — compose a text and/or image post, browse member posts, like, and comment.
2. **Challenges** — create an open challenge for any activity, browse and join challenges, submit cumulative progress, and show the top participants.
3. **My activity** — show the signed-in user's Sheroes posts and challenges.

Keep error states visible when Firestore denies a read/write or the connection is unavailable. Use server timestamps for new records, validate inputs before writes, and avoid optimistic success messages when a write fails.

Progress is self-reported in the current website. Do not imply that an activity is read from a health service. If the APK later integrates Health Connect or another health platform, request its runtime permissions separately and let the user opt in.

## 5. Verify before releasing the APK

- Test a signed-in account without a `sheroesMembers/{uid}` document: the membership gate should appear and Sheroes collections should not load.
- Create membership, then verify the Feed, Challenges, and My activity screens update.
- Test text-only and image posts, image upload size rejection, likes, comments, challenge creation, joining from two accounts, and progress updates from both accounts.
- Confirm with a non-member account that Sheroes posts, challenges, participant records, and another user's membership document are denied by Firestore rules.
- Test offline/error states, small screens, keyboard navigation, and screen-reader labels.
- Ship the normal signed APK/AAB through the existing mobile release process only after deploying and verifying the Firestore rules.
