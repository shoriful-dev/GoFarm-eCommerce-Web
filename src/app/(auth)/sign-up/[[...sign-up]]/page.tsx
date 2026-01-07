'use client';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import signInImage from '@/images/auth/sign-up.png';
import Container from '@/components/Container';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

const SignUpPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('redirectTo');
  const { signUp, signInWithGoogle, signInWithGithub } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if(password !== confirmPassword){
      setError('Password do not match')
    }
    if(password.length < 6){
      setError('Password must be at least 6 characters long')
      return;
    }
    if(!agreeToTerms){
      setError('You must agree to the Terms and Conditions')
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name)
      router.push(`/sign-in${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`);
    } catch (error) {
      setError('Failed to create account. please try again')
      console.log('Error', error)
    } finally {
      setLoading(false)
    }
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gofarm-white">
      <Container className="grid md:grid-cols-2 items-center p-4 max-w-6xl w-full gap-4">
        <div className="md:max-w-md w-full p-4">
          <form onSubmit={handleEmailSignup}>
            <div className="mb-12 space-y-5">
              <Link href={'/'} className="inline-block">
                <Image src={'/logo.svg'} alt="Logo" width={120} height={40} />
              </Link>
              <h1 className="text-gofarm-black text-3xl font-bold">
                Create Account
              </h1>
              <p className="text-base text-gofarm-gray">
                Already have an account
                <Link
                  href={`/sign-in${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`}
                  className="text-gofarm-green font-medium hover:underline ml-1 whitespace-nowrap"
                >
                  Sign in here
                </Link>
              </p>
            </div>
            {/* error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm font-medium">
                <p>{error}</p>
              </div>
            )}
            {/* Full name */}
            <div className="">
              <label className="text-gofarm-black text-sm font-medium block mb-2">
                Full Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="name"
                  required
                  value={name}
                  className="w-full text-gofarm-black text-sm border-b border-gofarm-gray/30 focus:border-gofarm-green pl-2 pr-8 py-3 outline-none transition-colors"
                  placeholder="Enter your full name"
                  onChange={e => setName(e.target.value)}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#6b7280"
                  className="w-4.5 h-4.5 absolute right-2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
            {/* Email */}
            <div className="mt-8">
              <label className="text-gofarm-black text-[13px] font-medium block mb-2">
                Email
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  className="w-full text-gofarm-black text-sm border-b border-gofarm-gray/30 focus:border-gofarm-green pl-2 pr-8 py-3 outline-none transition-colors"
                  placeholder="Enter email"
                  onChange={e => setEmail(e.target.value)}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#6b7280"
                  className="w-4.5 h-4.5 absolute right-2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>
            {/* Password */}
            <div className="mt-8">
              <label className="text-gofarm-black text-sm font-medium block mb-2">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={password}
                  className="w-full text-gofarm-black text-sm border-b border-gofarm-gray/30 focus:border-gofarm-green pl-2 pr-8 py-3 outline-none transition-colors"
                  placeholder="At least 6 characters"
                  onChange={e => setPassword(e.target.value)}
                />
                {showPassword ? (
                  <EyeOff
                    size={18}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    size={18}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            </div>
            {/* Confirm Password */}
            <div className="mt-8">
              <label className="text-gofarm-black text-sm font-medium block mb-2">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmpassword"
                  required
                  value={confirmPassword}
                  className="w-full text-gofarm-black text-sm border-b border-gofarm-gray/30 focus:border-gofarm-green pl-2 pr-8 py-3 outline-none transition-colors"
                  placeholder="Confirm your password"
                  onChange={e => setConirmPassword(e.target.value)}
                />
                {showConfirmPassword ? (
                  <EyeOff
                    size={18}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                    onClick={() => setShowConfirmPassword(false)}
                  />
                ) : (
                  <Eye
                    size={18}
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                    onClick={() => setShowConfirmPassword(true)}
                  />
                )}
              </div>
            </div>
            {/* agree term & Condition */}
            <div className="flex items-center mt-8">
              <input
                type="checkbox"
                id="agree-terms"
                name="agree-terms"
                checked={agreeToTerms}
                onChange={e => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 shrink-0 text-gofarm-green focus:ring-gofarm-green border-gofarm-gray/30 rounded-sm accent-gofarm-green hover:cursor-pointer"
              />
              <label className="ml-3 block text-sm text-gofarm-black">
                I agree to the{' '}
                <Link
                  href={'/terms'}
                  className="text-gofarm-green font-medium hover:underline"
                >
                  Terms and Conditions
                </Link>
              </label>
            </div>
            {/* buttons */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full shadow-xl py-2.5 px-4 text-sm font-medium tracking-wide rounded-md text-white bg-gofarm-green hover:bg-gofarm-light-green focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
            <div className="my-6 flex items-center gap-4">
              <hr className="w-full border-gofarm-gray/30" />
              <p className="text-sm text-gofarm-black text-center">or</p>
              <hr className="w-full border-gofarm-gray/30" />
            </div>
            <div className="">
              {/* Google */}
              <button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-7 h-7 inline"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.61l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.14-3.09-.4-4.55H24v9.02h12.94c-.56 2.97-2.23 5.48-4.75 7.18l7.73 5.99c4.52-4.18 7.06-10.34 7.06-17.64z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-5.99c-2.15 1.45-4.9 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
              </button>
              {/* GitHub */}
              <button>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7 inline"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.85 2.83 1.32 3.52 1.01.11-.78.42-1.32.76-1.62-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
        <div className="">
          <Image
            alt="signInImage"
            src={signInImage}
            width={500}
            height={500}
            className="w-full aspect-square object-contain"
          />
        </div>
      </Container>
    </div>
  );
};

export default SignUpPage;
