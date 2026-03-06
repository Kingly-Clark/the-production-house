'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-white text-center py-8">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherStatus, setVoucherStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [voucherMessage, setVoucherMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const voucherTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live voucher validation with debounce
  useEffect(() => {
    if (!voucherCode.trim()) {
      setVoucherStatus('idle');
      setVoucherMessage('');
      return;
    }
    setVoucherStatus('checking');
    if (voucherTimer.current) clearTimeout(voucherTimer.current);
    voucherTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/vouchers/validate?code=${encodeURIComponent(voucherCode)}`);
      const data = await res.json();
      if (data.valid) {
        setVoucherStatus('valid');
        setVoucherMessage(data.description || `${data.max_sites} sites free`);
      } else {
        setVoucherStatus('invalid');
        setVoucherMessage(data.error || 'Invalid code');
      }
    }, 500);
    return () => { if (voucherTimer.current) clearTimeout(voucherTimer.current); };
  }, [voucherCode]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    const supabase = createClient();
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...(voucherStatus === 'valid' && voucherCode ? { voucher_code: voucherCode.toUpperCase().trim() } : {}),
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback?redirect=/login?verified=true`,
        },
      });

      if (signUpError) {
        toast.error(signUpError.message || 'Failed to sign up');
        return;
      }

      setConfirmationSent(true);
      toast.success('Account created! Check your email to confirm.');
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback?redirect=/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message || 'Failed to sign up with Google');
        return;
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (confirmationSent) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400 text-sm">
            We&apos;ve sent a confirmation link to {email}
          </p>
        </div>

        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
          <p className="text-slate-300 text-sm">
            Click the link in your email to confirm your account. Once confirmed you&apos;ll be taken to the login page to sign in.
          </p>
        </div>

        <div className="text-slate-400 text-sm space-y-2">
          <p>Didn&apos;t receive the email?</p>
          <button
            onClick={() => {
              setConfirmationSent(false);
              setPassword('');
              setFullName('');
            }}
            className="text-blue-400 hover:text-blue-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
        <p className="text-slate-400 text-sm">
          Start building your content empire with ContentMill
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-slate-300">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-300">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            required
          />
          <p className="text-slate-500 text-xs">
            At least 6 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voucherCode" className="text-slate-300">
            Voucher code <span className="text-slate-500 font-normal">(optional)</span>
          </Label>
          <div className="relative">
            <Input
              id="voucherCode"
              type="text"
              placeholder="e.g. FOUNDER"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 uppercase pr-10"
            />
            {voucherStatus === 'valid' && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
            )}
            {voucherStatus === 'invalid' && (
              <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
            )}
          </div>
          {voucherStatus === 'valid' && (
            <p className="text-green-400 text-xs flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {voucherMessage}
            </p>
          )}
          {voucherStatus === 'invalid' && (
            <p className="text-red-400 text-xs">{voucherMessage}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <Separator className="bg-slate-700/50" />

      <Button
        onClick={handleGoogleSignup}
        disabled={isLoading}
        variant="outline"
        className="w-full border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 text-white"
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign up with Google
      </Button>

      <div className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300">
          Sign in
        </Link>
      </div>
    </div>
  );
}
