import { useMemo } from 'react';
import { Release } from '@/types';
import { removeDiacritics, getArtistSortKey } from '@/utils/strings';

export type GroupBy = 'none' | 'artist' | 'genre' | 'decade';
export type SortBy = 'artist' | 'title' | 'year' | 'dateAdded';

export interface CollectionSection {
    title: string;
    data: Release[];
}

export interface UseGroupedReleasesOptions {
    releases: Release[];
    groupBy: GroupBy;
    sortBy: SortBy;
    searchQuery: string;
}

export interface UseGroupedReleasesResult {
    filteredReleases: Release[];
    groupedReleases: CollectionSection[];
    isEmpty: boolean;
}

/**
 * useGroupedReleases Hook
 * 
 * Transforms a flat list of releases into a grouped and filtered list for SectionList.
 * Supports multiple grouping and sorting modes, and diacritic-insensitive search.
 */
export const useGroupedReleases = ({
    releases,
    groupBy,
    sortBy,
    searchQuery
}: UseGroupedReleasesOptions): UseGroupedReleasesResult => {
    return useMemo(() => {
        // 1. Filter releases by searchQuery
        const normalizedQuery = removeDiacritics(searchQuery.toLowerCase().trim());
        const filtered = releases.filter(release => {
            if (!normalizedQuery) return true;

            const normalizedArtist = removeDiacritics(release.artist.toLowerCase());
            const normalizedTitle = removeDiacritics(release.title.toLowerCase());

            return normalizedArtist.includes(normalizedQuery) || normalizedTitle.includes(normalizedQuery);
        });

        // 2. Sort filtered releases
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'artist': {
                    const keyA = getArtistSortKey(a.artist).toLowerCase();
                    const keyB = getArtistSortKey(b.artist).toLowerCase();
                    return keyA.localeCompare(keyB);
                }
                case 'title':
                    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
                case 'year': {
                    const yearA = a.year ? parseInt(a.year) : 0;
                    const yearB = b.year ? parseInt(b.year) : 0;
                    return yearB - yearA; // Latest first
                }
                case 'dateAdded': {
                    const dateA = a.added_at;
                    const dateB = b.added_at;
                    return dateB - dateA; // Newest first
                }
                default:
                    return 0;
            }
        });

        // 3. Group releases
        const groups: { [key: string]: Release[] } = {};

        if (groupBy === 'none') {
            const groupedReleases = sorted.length > 0 ? [{ title: 'All Releases', data: sorted }] : [];
            return {
                filteredReleases: sorted,
                groupedReleases,
                isEmpty: sorted.length === 0
            };
        }

        sorted.forEach(release => {
            let key = 'Unknown';

            if (groupBy === 'artist') {
                const sortKey = getArtistSortKey(release.artist);
                const firstChar = sortKey.charAt(0).toUpperCase();
                key = /^[A-Z]/.test(firstChar) ? firstChar : '#';
            } else if (groupBy === 'genre') {
                if (release.genres && release.genres.length > 0) {
                    // Use the first genre as per clarification
                    const genres = release.genres.split(',').map(g => g.trim());
                    key = genres[0] || 'Unknown';
                }
            } else if (groupBy === 'decade') {
                if (release.year) {
                    const yearNum = parseInt(release.year);
                    if (!isNaN(yearNum)) {
                        const decade = Math.floor(yearNum / 10) * 10;
                        key = `${decade}s`;
                    } else {
                        key = 'Unknown';
                    }
                } else {
                    key = 'Unknown';
                }
            }

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(release);
        });

        // 4. Sort keys and transform to SectionList format
        const groupedReleases = Object.keys(groups)
            .sort((a, b) => {
                if (groupBy === 'decade') {
                    if (a === 'Unknown') return 1;
                    if (b === 'Unknown') return -1;
                    // Sort decades descending
                    return parseInt(b) - parseInt(a);
                }

                if (a === '#' || a === 'Unknown') return 1;
                if (b === '#' || b === 'Unknown') return -1;
                return a.localeCompare(b);
            })
            .map(key => ({
                title: key,
                data: groupBy === 'decade' && key !== 'Unknown'
                    ? groups[key].sort((a, b) => {
                        // Sort by year within decade (earliest first)
                        const yearA = a.year ? parseInt(a.year) : 9999;
                        const yearB = b.year ? parseInt(b.year) : 9999;
                        return yearA - yearB;
                    })
                    : groups[key]
            }));

        return {
            filteredReleases: sorted,
            groupedReleases,
            isEmpty: sorted.length === 0
        };
    }, [releases, groupBy, sortBy, searchQuery]);
};
