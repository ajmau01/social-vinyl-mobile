import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Release, BinItem } from '@/types';

interface ListeningBinState {
    items: BinItem[];

    // Actions
    addItem: (release: Release, userId: string) => void;
    removeItem: (releaseId: number, userId: string) => void;
    clearBin: (userId?: string) => void; // If userId provided, only clear that user's bin
    isInBin: (releaseId: number, userId: string) => boolean;
}

export const useListeningBinStore = create<ListeningBinState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (release, userId) => {
                const { items } = get();
                // SCOPING: Check if item already exists FOR THIS USER
                if (items.some(item => item.id === release.id && item.userId === userId)) return;

                const newItem: BinItem = {
                    ...release,
                    userId, // SCOPING: Associate with current user
                    addedTimestamp: Date.now(),
                };

                set({ items: [...items, newItem] });
            },

            removeItem: (releaseId, userId) => {
                set((state) => ({
                    items: state.items.filter(item => !(item.id === releaseId && item.userId === userId)),
                }));
            },

            clearBin: (userId) => {
                if (userId) {
                    set((state) => ({
                        items: state.items.filter(item => item.userId !== userId),
                    }));
                } else {
                    set({ items: [] });
                }
            },

            isInBin: (releaseId, userId) => {
                return get().items.some(item => item.id === releaseId && item.userId === userId);
            },
        }),
        {
            name: 'listening-bin-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
