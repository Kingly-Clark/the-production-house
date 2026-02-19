'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Plus, Settings } from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import { cn } from '@/lib/utils';

interface ClientSelectorProps {
  className?: string;
  showManageLink?: boolean;
}

export function ClientSelector({ className, showManageLink = true }: ClientSelectorProps) {
  const router = useRouter();
  const {
    clients,
    selectedClientId,
    isLoading,
    setSelectedClient,
    fetchClients,
  } = useClientStore();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleValueChange = (value: string) => {
    if (value === '__new__') {
      router.push('/dashboard/clients/new');
      return;
    }
    if (value === '__manage__') {
      router.push('/dashboard/clients');
      return;
    }
    setSelectedClient(value === '__all__' ? null : value);
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const displayValue = selectedClient?.name || 'All Clients';

  return (
    <Select
      value={selectedClientId || '__all__'}
      onValueChange={handleValueChange}
      disabled={isLoading}
    >
      <SelectTrigger
        className={cn(
          'w-full bg-slate-800 border-slate-700 text-white hover:bg-slate-700',
          className
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <SelectValue>{displayValue}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700">
        <SelectItem
          value="__all__"
          className="text-white hover:bg-slate-700 focus:bg-slate-700"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>All Clients</span>
          </div>
        </SelectItem>

        {clients.length > 0 && <SelectSeparator className="bg-slate-700" />}

        {clients.map((client) => (
          <SelectItem
            key={client.id}
            value={client.id}
            className="text-white hover:bg-slate-700 focus:bg-slate-700"
          >
            <div className="flex items-center gap-2">
              {client.logo_url ? (
                <img
                  src={client.logo_url}
                  alt=""
                  className="w-4 h-4 rounded object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {client.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate">{client.name}</span>
            </div>
          </SelectItem>
        ))}

        {showManageLink && (
          <>
            <SelectSeparator className="bg-slate-700" />
            <SelectItem
              value="__new__"
              className="text-blue-400 hover:bg-slate-700 focus:bg-slate-700"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Add New Client</span>
              </div>
            </SelectItem>
            <SelectItem
              value="__manage__"
              className="text-slate-400 hover:bg-slate-700 focus:bg-slate-700"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Manage Clients</span>
              </div>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
