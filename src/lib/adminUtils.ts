import React from "react";

export const getAdminEmails = (): string[] => {
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if(!adminEmailsEnv) return [];

  try {
    const cleanEmails = adminEmailsEnv
    .replace(/[\[\]]/g, "")
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0)

    return cleanEmails;
  } catch (error) {
    console.error('Error parsing admin emails', error);
    return [];
  }
}

export const isUserAdmin = (userEmail: string | null | undefined): boolean => {
  if(!userEmail) return false;

  const adminEmails = getAdminEmails();
  return adminEmails.includes(userEmail.toLowerCase());
}

export const isAdmin = (user: {email?: string | null; isAdmin?: boolean} | null | undefined): boolean => {
  if(!user) return false;
  if(user.isAdmin === true) return true;
  if(user.email){
    return isUserAdmin(user.email);
  }
  return false
}

export const useIsAdmin = (userEmail: string | null | undefined, firebaseUid: string | null | undefined): boolean => {
  const [isChecking, setIsChecking] = React.useState<boolean>(true);
  React.useEffect(() => {
    if(userEmail && isUserAdmin(userEmail)) {
      setIsAdminInSanity(true);
      setIsChecking(false);
      return;
    }
    if(userEmail || firebaseUid){
      setIsChecking(true);
      fetch('/api/auth/check-admin', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: userEmail, firebaseUid})
      })
      .then((res) => res.json())
      .then((data) => {
        setIsAdminInSanity(data.isAdmin === true);
        setIsChecking(false)
      })
      .catch((error) => {
        console.error('Error checking admin status', error);
        setIsAdminInSanity(false)
        setIsChecking(false)
      })
    } else {
      setIsAdminInSanity(false)
      setIsChecking(false)
    }
  }, [userEmail, firebaseUid]);
  return isChecking ? false : isAdminInSanity;
}



