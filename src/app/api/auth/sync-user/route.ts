import { syncUserToSanity } from '@/lib/sync-user-to-sanity';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';

if(!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const {idToken} = await request.json();
    if(!idToken){
      return NextResponse.json(
        {error: 'ID Token is required'},
        {status: 400}
      )
    }
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const firebaseUser = await getAuth().getUser(decodedToken.uid);
    const userForSync = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName || null,
      photoURL: firebaseUser.photoURL || null,
    };
    const sanityUserId = await syncUserToSanity(userForSync as any);
    return NextResponse.json({
      success: true,
      sanityUserId,
      firebaseUid: firebaseUser.uid
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Faild to sign-in';
    console.error('error syncing user', error);
    return NextResponse.json(
      {error: message || 'Faild to sign-in'},
      {status: 500}
    )
  }
}
