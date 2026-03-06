'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Plus, ToggleLeft, ToggleRight, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VoucherCode {
  id: string;
  code: string;
  description: string | null;
  plan_status: string;
  max_sites: number;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface Redemption {
  id: string;
  voucher_code_id: string;
  organization_id: string;
  user_id: string;
  redeemed_at: string;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherCode[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMaxSites, setNewMaxSites] = useState('5');
  const [newMaxUses, setNewMaxUses] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/vouchers');
      const data = await res.json();
      setVouchers(data.vouchers || []);
      setRedemptions(data.redemptions || []);
    } catch {
      toast.error('Failed to load vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.toUpperCase().trim(),
          description: newDescription.trim() || null,
          max_sites: parseInt(newMaxSites) || 5,
          max_uses: newMaxUses ? parseInt(newMaxUses) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create voucher');
      }
      toast.success(`Voucher ${newCode.toUpperCase()} created`);
      setNewCode(''); setNewDescription(''); setNewMaxSites('5'); setNewMaxUses('');
      setShowCreateForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create voucher');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await fetch('/api/admin/vouchers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !current }),
      });
      setVouchers((v) => v.map((x) => x.id === id ? { ...x, is_active: !current } : x));
      toast.success(current ? 'Voucher deactivated' : 'Voucher activated');
    } catch {
      toast.error('Failed to update voucher');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied ${code}`);
  };

  const redemptionsFor = (id: string) => redemptions.filter((r) => r.voucher_code_id === id).length;

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Voucher Codes</h1>
          <p className="mt-2 text-slate-400">Manage free access codes for beta users and founders</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2"
        >
          <Plus className="w-4 h-4" />
          New Voucher
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create Voucher Code</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Code <span className="text-slate-500 text-xs">(uppercase)</span></Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="FOUNDER"
                className="bg-slate-800 border-slate-700 text-white uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Beta tester access"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Max Sites</Label>
              <Input
                type="number"
                min="1"
                value={newMaxSites}
                onChange={(e) => setNewMaxSites(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Max Uses <span className="text-slate-500 text-xs">(blank = unlimited)</span></Label>
              <Input
                type="number"
                min="1"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={creating} className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                {creating ? 'Creating...' : 'Create Voucher'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}
                className="border-slate-600 text-slate-300">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Vouchers Table */}
      {isLoading ? (
        <div className="text-slate-400">Loading...</div>
      ) : vouchers.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-12 text-center">
          <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No voucher codes yet. Create one above.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="px-6 py-4 font-medium">Code</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Sites</th>
                <th className="px-6 py-4 font-medium">Uses</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-amber-400 text-base">{v.code}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{v.description || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 capitalize">
                      {v.plan_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{v.max_sites}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {redemptionsFor(v.id)}{v.max_uses ? ` / ${v.max_uses}` : ' / ∞'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      v.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyCode(v.code)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Copy code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(v.id, v.is_active)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title={v.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {v.is_active
                          ? <ToggleRight className="w-4 h-4 text-green-400" />
                          : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
