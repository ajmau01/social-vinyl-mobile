import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Release, BinItem } from '@/types';

interface ListeningBinState {
    items: BinItem[];

    // Actions
    addItem: (release: Release) => void;
    removeItem: (releaseId: number) => void;
    clearBin: () => void;
    isInBin: (releaseId: number) => boolean;
}

export const useListeningBinStore = create<ListeningBinState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (release) => {
                const { items } = get();
                if (items.some(item => item.id === release.id)) return;

                const newItem: BinItem = {
                    ...release,
                    addedTimestamp: Date.now(),
                };

                set({ items: [...items, newItem] });
            },

            removeItem: (releaseId) => {
                set((state) => ({
                    items: state.items.filter(item => item.id !== releaseId),
                }));
            },

            clearBin: () => set({ items: [] }),

            isInBin: (releaseId) => {
                return get().items.some(item => item.id === releaseId);
            },
        }),
        {
            name: 'listening-bin-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
