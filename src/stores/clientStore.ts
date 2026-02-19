import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client } from '@/types/database';

interface ClientStore {
  clients: Client[];
  selectedClientId: string | null;
  isLoading: boolean;
  error: string | null;
  setClients: (clients: Client[]) => void;
  setSelectedClient: (clientId: string | null) => void;
  fetchClients: () => Promise<void>;
  addClient: (client: Client) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  removeClient: (clientId: string) => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      selectedClientId: null,
      isLoading: false,
      error: null,

      setClients: (clients) => set({ clients }),

      setSelectedClient: (clientId) => set({ selectedClientId: clientId }),

      fetchClients: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/clients');
          if (!response.ok) {
            throw new Error('Failed to fetch clients');
          }
          const clients = await response.json();
          set({ clients, isLoading: false });
          
          const { selectedClientId } = get();
          if (selectedClientId && !clients.find((c: Client) => c.id === selectedClientId)) {
            set({ selectedClientId: null });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          set({ error: message, isLoading: false });
        }
      },

      addClient: (client) => {
        set((state) => ({ clients: [...state.clients, client] }));
      },

      updateClient: (clientId, updates) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId ? { ...c, ...updates } : c
          ),
        }));
      },

      removeClient: (clientId) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== clientId),
          selectedClientId:
            state.selectedClientId === clientId ? null : state.selectedClientId,
        }));
      },
    }),
    {
      name: 'client-store',
      partialize: (state) => ({ selectedClientId: state.selectedClientId }),
    }
  )
);
