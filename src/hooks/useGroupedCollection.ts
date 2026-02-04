import { useMemo } from 'react';
import { Release } from '@/types';

export interface CollectionSection {
    title: string;
    data: Release[];
}

/**
 * useGroupedCollection Hook
 * 
 * Transforms a flat list of releases into a grouped list for SectionList.
 * Groups by the first letter of the artist's name.
 */
export const useGroupedCollection = (releases: Release[]): CollectionSection[] => {
    return useMemo(() => {
        const groups: { [key: string]: Release[] } = {};

        releases.forEach(release => {
            const firstLetter = release.artist.charAt(0).toUpperCase();
            const key = /^[A-Z]/.test(firstLetter) ? firstLetter : '#';

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(release);
        });

        // Sort keys and transform to SectionList format
        return Object.keys(groups)
            .sort((a, b) => {
                if (a === '#') return 1;
                if (b === '#') return -1;
                return a.localeCompare(b);
            })
            .map(key => ({
                title: key,
                data: groups[key].sort((a, b) => a.artist.localeCompare(b.artist))
            }));
    }, [releases]);
};
