'use client';

import { useAuthStore } from '@/store/authStore';
import { Button } from './ui/button';
import Link from 'next/link';

const UserTest = () => {
  const { user, logout } = useAuthStore();

  const handleSignout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
  };
  return (
    <div>
      <p>User Test Component</p>
      <p className="text-base font-semibold">{user?.displayName}</p>
      {user ? (
        <Button onClick={handleSignout}>Logout</Button>
      ) : (
        <Button>
          <Link href="/sign-in">Sign-in</Link>
        </Button>
      )}
    </div>
  );
};

export default UserTest;
