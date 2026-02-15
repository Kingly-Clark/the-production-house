'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface NewsletterSignupProps {
  siteSlug: string;
  buttonText?: string;
  placeholderText?: string;
  fullWidth?: boolean;
}

export default function NewsletterSignup({
  siteSlug,
  buttonText = 'Subscribe',
  placeholderText = 'Enter your email',
  fullWidth = false,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/public/site/${siteSlug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || 'Failed to subscribe');
        return;
      }

      toast.success('Thanks for subscribing! Check your email to confirm.');
      setEmail('');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${fullWidth ? 'w-full flex-col' : ''}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholderText}
        required
        className={`flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700
          bg-white dark:bg-gray-900 text-gray-900 dark:text-white
          placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent`}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-[var(--accent)] text-white font-medium rounded-lg
          hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
      >
        {loading ? 'Subscribing...' : buttonText}
      </button>
    </form>
  );
}
