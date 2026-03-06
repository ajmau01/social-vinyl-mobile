// Copyright (c) 2026 Andrew Mauer. All Rights Reserved.
// Proprietary and confidential. Unauthorized use prohibited.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Release, BinItem } from '@/types';

interface ListeningBinState {
    items: BinItem[];

    // Original Actions
    addItem: (release: Release, userId: string) => void;
    removeItem: (releaseId: number, userId: string) => void;
    clearBin: (userId?: string) => void;
    isInBin: (releaseId: number, userId: string) => boolean;

    // Issue #126: Optimistic Updates & Sync
    addAlbumOptimistic: (release: Release, userId: string, tempId: string) => void;
    removeAlbumOptimistic: (releaseId: number, userId: string) => void;
    confirmAdd: (tempId: string, realId: number, timestamp: number, instanceId?: number) => void;
    revertAdd: (tempId: string) => void;
    confirmRemove: (releaseId: number) => void;
    revertRemove: (release: Release, userId: string, timestamp: number) => void;
    setBin: (items: BinItem[]) => void;
}

export const useListeningBinStore = create<ListeningBinState>()(
    (set, get) => ({
        items: [],

        addItem: (release, userId) => {
            const { items } = get();
            // SCOPING: Check if item already exists FOR THIS USER.
            // Check both id and releaseId since after confirmAdd item.id becomes instanceId.
            if (items.some(item => (item.id === release.id || item.releaseId === release.id) && item.userId === userId)) return;

            const newItem: BinItem = {
                ...release,
                userId, // SCOPING: Associate with current user
                addedTimestamp: Date.now(),
                status: 'synced'
            };

            set({ items: [...items, newItem] });
        },

        removeItem: (releaseId, userId) => {
            set((state) => ({
                items: state.items.filter(item =>
                    !((item.id === releaseId || item.releaseId === releaseId) && item.userId === userId)
                ),
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
            return get().items.some(item =>
                (item.id === releaseId || item.releaseId === releaseId) &&
                (item.userId === userId || item.requestedBy === userId)
            );
        },

        // Issue #126: Implementation
        setBin: (items) => set({ items }),

        addAlbumOptimistic: (release, userId, tempId) => {
            const { items } = get();
            // Avoid duplicates even in optimistic state
            if (items.some(item => item.id === release.id && item.userId === userId)) return;

            const newItem: BinItem = {
                ...release,
                userId,
                addedTimestamp: Date.now(),
                status: 'pending',
                tempId
            };
            set({ items: [...items, newItem] });
        },

        removeAlbumOptimistic: (releaseId, userId) => {
            set((state) => ({
                items: state.items.filter(item =>
                    !((item.id === releaseId || item.releaseId === releaseId) && item.userId === userId)
                )
            }));
        },

        confirmAdd: (tempId, realId, timestamp, instanceId) => {
            set((state) => ({
                items: state.items.map(item =>
                    item.tempId === tempId
                        ? {
                            ...item,
                            status: 'synced',
                            id: instanceId || realId,
                            releaseId: realId,
                            instanceId: instanceId,
                            addedTimestamp: timestamp,
                            clientUUID: tempId, // tempId IS the clientUUID sent to backend
                            tempId: undefined
                        }
                        : item
                )
            }));
        },

        revertAdd: (tempId) => {
            set((state) => ({
                items: state.items.filter(item => item.tempId !== tempId)
            }));
        },

        confirmRemove: (releaseId) => {
            // Already removed, nothing to do unless we tracked it differently
        },

        revertRemove: (release, userId, timestamp) => {
            const restoredItem: BinItem = {
                ...release,
                userId,
                addedTimestamp: timestamp,
                status: 'synced'
            };
            set((state) => ({
                items: [...state.items, restoredItem]
            }));
        }
    })
);
