'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { SocialAccount, SocialPlatform } from '@/types/database';

const PLATFORMS: SocialPlatform[] = ['facebook', 'linkedin', 'x', 'instagram', 'tiktok'];

const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

export default function SocialPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<SocialPlatform | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [siteId]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/social?siteId=${siteId}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: SocialPlatform) => {
    try {
      setConnecting(platform);

      const res = await fetch('/api/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          platform,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.auth_url;
      } else {
        alert('Failed to initiate connection');
      }
    } catch (err) {
      alert('Error connecting account');
    } finally {
      setConnecting(null);
    }
  };

  const handleToggleActive = async (account: SocialAccount) => {
    try {
      const res = await fetch(`/api/social/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !account.is_active }),
      });

      if (res.ok) {
        await fetchAccounts();
      }
    } catch (err) {
      alert('Error updating account');
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Disconnect this account?')) return;

    try {
      const res = await fetch(`/api/social/${accountId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchAccounts();
      }
    } catch (err) {
      alert('Error disconnecting account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Social Media</h1>
        <p className="text-slate-400 mt-2">
          Connect and manage social media accounts for content sharing
        </p>
      </div>

      {error && (
        <Card className="bg-red-950 border-red-800 p-4 text-red-200">
          <p>Error: {error}</p>
        </Card>
      )}

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
          <div className="grid gap-4">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="bg-slate-900 border-slate-800 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">
                      {PLATFORM_NAMES[account.platform]}
                    </h3>
                    <p className="text-slate-400">
                      {account.account_name || 'Connected'}
                    </p>
                    {account.last_posted_at && (
                      <p className="text-slate-500 text-sm">
                        Last posted:{' '}
                        {new Date(account.last_posted_at).toLocaleDateString()}
                      </p>
                    )}
                    {account.last_error && (
                      <p className="text-red-400 text-sm">
                        Error: {account.last_error}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 items-end">
                    <Badge
                      className={
                        account.is_active
                          ? 'bg-green-900 text-green-200'
                          : 'bg-slate-700 text-slate-200'
                      }
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </Badge>

                    <Switch
                      checked={account.is_active}
                      onCheckedChange={() => handleToggleActive(account)}
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(account.id)}
                      className="text-red-400 hover:bg-red-900/20"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available platforms */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">
          {accounts.length > 0 ? 'Add More Accounts' : 'Connect Accounts'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((platform) => {
            const connected = accounts.some(
              (a) => a.platform === platform
            );

            return (
              <Card
                key={platform}
                className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4"
              >
                <h3 className="text-lg font-semibold text-white">
                  {PLATFORM_NAMES[platform]}
                </h3>

                {connected ? (
                  <Badge className="bg-green-900 text-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Button
                    onClick={() => handleConnect(platform)}
                    disabled={connecting === platform}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {connecting === platform ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
