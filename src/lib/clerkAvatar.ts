import { useClerk, useSession, useUser } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';

import { setSupabaseAuthContext } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

const hasClerkKey = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Extracts the best available profile image URL from Clerk's user, external OAuth
 * accounts (Google/Apple), active session, or sign-in attempt state.
 */
export function extractClerkImageUrl(params: {
  user?: any;
  session?: any;
  client?: any;
}): string | undefined {
  const { user, session, client } = params;

  // 1. Google / OAuth external account avatar
  const externalAvatar = user?.externalAccounts?.find((acc: any) => Boolean(acc?.imageUrl))?.imageUrl;
  if (externalAvatar) return externalAvatar;

  // 2. Clerk primary user.imageUrl
  if (user?.imageUrl) return user.imageUrl;

  // 3. Active session user / publicUserData imageUrl
  if (session?.user?.imageUrl) return session.user.imageUrl;
  if (session?.publicUserData?.imageUrl) return session.publicUserData.imageUrl;

  // 4. Client sessions list
  const firstSession = client?.sessions?.[0];
  if (firstSession?.user?.imageUrl) return firstSession.user.imageUrl;
  if (firstSession?.publicUserData?.imageUrl) return firstSession.publicUserData.imageUrl;

  // 5. Recent SignIn attempt userData (populated right after signIn.create({ identifier }))
  if (client?.signIn?.userData?.imageUrl) return client.signIn.userData.imageUrl;

  return undefined;
}

/**
 * Hook that automatically fetches and syncs the signed-in user's profile icon
 * (and name/email if missing) from Clerk into the patient profile store.
 */
export function useClerkAvatarSync(): string | undefined {
  const storedAvatarUrl = useAppStore((s) => s.patientProfile.avatarUrl);
  const patientEmail = useAppStore((s) => s.patientProfile.email);
  const pendingEmail = useAppStore((s) => s.pendingEmail);
  const clerkSessionId = useAppStore((s) => s.clerkSessionId);
  const updatePatientProfile = useAppStore((s) => s.updatePatientProfile);
  const reloadedRef = useRef(false);

  // Safe hook usage when ClerkProvider is mounted
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const userState = hasClerkKey ? useUser() : { isLoaded: false, user: null };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const sessionState = hasClerkKey ? useSession() : { isLoaded: false, session: null };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerk = hasClerkKey ? useClerk() : null;

  const user = userState.user;
  const session = sessionState.session;
  const client = (clerk as any)?.client;

  // Bridge Clerk user ID and session token into Supabase client for Row-Level Security
  useEffect(() => {
    const resolvedUserId =
      user?.id ||
      session?.user?.id ||
      client?.sessions?.[0]?.user?.id ||
      null;
    setSupabaseAuthContext({
      userId: resolvedUserId,
      getToken: session && typeof session.getToken === 'function' ? () => session.getToken() : null,
    });
  }, [user, session, client]);

  // Auto-restore active Clerk session if clerkSessionId or lastActiveSessionId is available
  useEffect(() => {
    if (!hasClerkKey || !clerk) return;
    const targetSessionId =
      clerkSessionId || client?.lastActiveSessionId || client?.sessions?.[0]?.id;
    if (!session && targetSessionId && typeof clerk.setActive === 'function') {
      clerk.setActive({ session: targetSessionId }).catch(() => {});
    }
  }, [clerk, client, session, clerkSessionId]);

  // Auto-reload Clerk user once on mount so fresh OAuth / Clerk imageUrl is pulled from server
  useEffect(() => {
    if (!hasClerkKey || reloadedRef.current) return;
    if (user && typeof user.reload === 'function') {
      reloadedRef.current = true;
      user.reload().catch(() => {});
    }
  }, [user]);

  const clerkAvatarUrl = extractClerkImageUrl({ user, session, client });

  // Sync fetched Clerk avatar (and name/email if present on Clerk user) into Zustand store
  useEffect(() => {
    if (!clerkAvatarUrl) return;
    const patch: Record<string, string> = {};
    if (clerkAvatarUrl !== storedAvatarUrl) {
      patch.avatarUrl = clerkAvatarUrl;
    }
    const clerkFirstName = user?.firstName || client?.signIn?.userData?.firstName;
    const clerkLastName = user?.lastName || client?.signIn?.userData?.lastName;
    const clerkEmail = user?.primaryEmailAddress?.emailAddress;

    const currentProfile = useAppStore.getState().patientProfile;
    if (clerkFirstName && (!currentProfile.firstName || currentProfile.firstName === 'Jessica')) {
      patch.firstName = clerkFirstName;
      patch.preferredName = clerkFirstName;
    }
    if (clerkLastName && (!currentProfile.lastName || currentProfile.lastName === 'Tebatso')) {
      patch.lastName = clerkLastName;
    }
    if (clerkEmail && !currentProfile.email) {
      patch.email = clerkEmail;
    }

    if (Object.keys(patch).length > 0) {
      updatePatientProfile(patch);
    }
  }, [clerkAvatarUrl, storedAvatarUrl, user, client, updatePatientProfile]);

  // If no Clerk session is active yet, but we have a known email address,
  // also try looking up the user's Clerk userData via signIn.create in the background
  const fetchedEmailRef = useRef<string | null>(null);
  useEffect(() => {
    if (!hasClerkKey || clerkAvatarUrl || storedAvatarUrl) return;
    const emailToLookup = (patientEmail || pendingEmail || '').trim().toLowerCase();
    if (!emailToLookup || emailToLookup.includes('example.co.za') || fetchedEmailRef.current === emailToLookup) {
      return;
    }
    const signInObj = client?.signIn;
    if (signInObj && typeof signInObj.create === 'function') {
      fetchedEmailRef.current = emailToLookup;
      signInObj
        .create({ identifier: emailToLookup })
        .then((attempt: any) => {
          const url = attempt?.userData?.imageUrl;
          if (url) {
            updatePatientProfile({ avatarUrl: url });
          }
        })
        .catch(() => {});
    }
  }, [clerkAvatarUrl, storedAvatarUrl, patientEmail, pendingEmail, client, updatePatientProfile]);

  return clerkAvatarUrl || storedAvatarUrl;
}
