// import { useAuthStore } from '@/store/authStore';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { useState } from 'react';
import Container from './Container';
import Logo from './Logo';
import TopHeaderBadge from './TopHeaderBadge';

const ClientHeader = () => {
  // const { user, loading } = useAuthStore();
  // const router = useRouter();
  // const searchParams = useSearchParams();
  // const [isMounted, setIsMounted] = useState(false);
  // const [isVisible, setIsVisible] = useState(true);
  // const [lastScrollY, setLastScrollY] = useState(0);
  // const [isVendor, setIsVendor] = useState(false);

  // Track when component is mounted on client side
  // useEffect(() => {
  //   setIsMounted(true);
  // },[])
  return (
    <>
      <header>
        <TopHeaderBadge/>
        <div>
          <Container className="flex items-center justify-between py-3 lg:py-4">
            <Logo />
            <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
              <SearchBar />
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <CartIcon />
              <FavoriteIcon />
              <NotificationBellIcon />
              {loading ? (
                <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl border border-gray-200 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
              ) : (
                <>{user ? <UserDropDown /> : <div>signin</div>}</>
              )}
            </div>
          </Container>
        </div>
      </header>
    </>
  );
}

export default ClientHeader;
