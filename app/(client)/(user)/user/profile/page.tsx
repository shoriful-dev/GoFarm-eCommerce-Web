import { getAuthUserId, getCurrentUser } from "@/lib/firebase-admin-auth";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { USER_BY_FIREBASE_ID_QUERY } from "@/sanity/queries/userQueries";
import ProfileClient from "@/components/profile/ProfileClient";

interface SanityUser {
  _id: string;
  firebaseUid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  profileImage?: {
    asset: {
      _id: string;
      url: string;
    };
  };
  addresses?: Array<{
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    default: boolean;
    type: "home" | "office" | "other";
    createdAt: string;
    phone?: string;
  }>;
  preferences?: Record<string, unknown>;
  loyaltyPoints?: number;
  rewardPoints?: number;
  totalSpent?: number;
  lastLogin?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default async function ProfilePage() {
  const userId = await getAuthUserId();

  if (!userId) {
    redirect("/sign-in");
  }

  const firebaseUser = await getCurrentUser();

  if (!firebaseUser) {
    redirect("/sign-in");
  }

  // Fetch user data from Sanity
  let sanityUser: SanityUser | null = null;
  try {
    const { data } = await sanityFetch({
      query: USER_BY_FIREBASE_ID_QUERY,
      params: { firebaseUid: userId },
    });
    sanityUser = data as SanityUser | null;
  } catch (error) {
    console.error("Error fetching user from Sanity:", error);
  }

  // Fetch addresses separately by email
  let userAddresses: SanityUser["addresses"] = [];
  const userEmail = firebaseUser.email;
  if (userEmail) {
    try {
      const addressQuery = `*[_type == "address" && email == $email] | order(default desc, createdAt desc) {
        _id,
        name,
        address,
        city,
        state,
        zip,
        country,
        default,
        type,
        createdAt,
        phone
      }`;
      userAddresses = await client.fetch(addressQuery, { email: userEmail });
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }

  // Combine user data with addresses
  if (sanityUser) {
    sanityUser.addresses = userAddresses;
  }

  // Combine Firebase and Sanity data
  const userData = {
    firebase: {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber,
      metadata: {
        creationTime: firebaseUser.metadata.creationTime,
        lastSignInTime: firebaseUser.metadata.lastSignInTime,
      },
      providerData:
        firebaseUser.providerData?.map((provider) => ({
          providerId: provider.providerId,
          uid: provider.uid,
          displayName: provider.displayName || null,
          email: provider.email || null,
          phoneNumber: provider.phoneNumber || null,
          photoURL: provider.photoURL || null,
        })) || [],
    },
    sanity: sanityUser,
  };

  return <ProfileClient userData={userData} />;
}
