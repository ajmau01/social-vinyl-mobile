import { useMemo } from 'react';
import { Release } from '@/types';
import { removeDiacritics, getArtistSortKey } from '@/utils/strings';

export type ViewMode = 'none' | 'artist' | 'genre' | 'decade' | 'new' | 'spin' | 'saved';
export type SortBy = 'artist' | 'title' | 'year' | 'dateAdded';

export interface CollectionSection {
    title: string;
    data: Release[];
}

export interface UseGroupedReleasesOptions {
    releases: Release[];
    groupBy: ViewMode;
    sortBy: SortBy;
    searchQuery: string;
}

export interface UseGroupedReleasesResult {
    filteredReleases: Release[];
    groupedReleases: CollectionSection[];
    isEmpty: boolean;
}

function getTimePeriodKey(addedAt: number): string {
    const now = Date.now();
    const addedMs = addedAt * 1000;
    const diff = now - addedMs;
    const dayMs = 24 * 60 * 60 * 1000;

    if (diff < dayMs) return 'Today';
    if (diff < 7 * dayMs) return 'This Week';
    if (diff < 30 * dayMs) return 'This Month';

    const addedDate = new Date(addedMs);
    const addedYear = addedDate.getFullYear();
    const currentYear = new Date().getFullYear();

    if (addedYear === currentYear) return 'Earlier This Year';
    return addedYear.toString();
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
        const trimmedQuery = searchQuery.toLowerCase().trim();
        const normalizedQuery = removeDiacritics(trimmedQuery);

        const filtered = releases.filter(release => {
            if (!trimmedQuery) return true;

            const artist = release.artist.toLowerCase();
            const title = release.title.toLowerCase();
            const normalizedArtist = removeDiacritics(artist);
            const normalizedTitle = removeDiacritics(title);

            // Match either:
            // 1. Original query against original data (exact diacritic match)
            // 2. Normalized query against normalized data (diacritic-insensitive)
            return (
                artist.includes(trimmedQuery) ||
                title.includes(trimmedQuery) ||
                normalizedArtist.includes(normalizedQuery) ||
                normalizedTitle.includes(normalizedQuery)
            );
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
            const keys: string[] = [];

            if (groupBy === 'artist') {
                const sortKey = getArtistSortKey(release.artist);
                const firstChar = sortKey.charAt(0).toUpperCase();
                keys.push(/^[A-Z]/.test(firstChar) ? firstChar : '#');
            } else if (groupBy === 'genre') {
                if (release.genres && release.genres.length > 0) {
                    // Use the first genre as per clarification
                    const genres = release.genres.split(',').map(g => g.trim());
                    keys.push(genres[0] || 'Unknown');
                } else {
                    keys.push('Unknown');
                }
            } else if (groupBy === 'decade') {
                if (release.year) {
                    const yearNum = parseInt(release.year);
                    if (!isNaN(yearNum)) {
                        const decade = Math.floor(yearNum / 10) * 10;
                        keys.push(`${decade}s`);
                    } else {
                        keys.push('Unknown');
                    }
                } else {
                    keys.push('Unknown');
                }
            } else if (groupBy === 'new') {
                // "N&N" Logic: Notable (Host-curated) + New (Last 6 Months)
                if (release.isNotable) {
                    keys.push('Notable');
                }

                const now = Date.now();
                const addedMs = release.added_at * 1000;
                const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;

                // Only show in chronological sections if added in the last 6 months
                if (now - addedMs <= sixMonthsMs) {
                    keys.push(`New: ${getTimePeriodKey(release.added_at)}`);
                }
            } else if (groupBy === 'saved') {
                if (release.isSaved) {
                    keys.push('Saved Albums');
                }
            } else if (groupBy === 'spin') {
                const count = release.spinCount || 0;
                if (count >= 10) keys.push('Heavy Rotation');
                else if (count >= 3) keys.push('Regular Play');
                else if (count >= 1) keys.push('Occasional Play');
                else keys.push('Never Played');
            }

            keys.forEach(key => {
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(release);
            });
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

                if (groupBy === 'new') {
                    const order = ['Notable', 'New: Today', 'New: This Week', 'New: This Month', 'New: Earlier This Year'];
                    const indexA = order.indexOf(a);
                    const indexB = order.indexOf(b);

                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;

                    // Specific years should be sorted descending (newest year first)
                    // Remove "New: " prefix to parse year
                    const yearA = parseInt(a.replace('New: ', ''));
                    const yearB = parseInt(b.replace('New: ', ''));
                    if (!isNaN(yearA) && !isNaN(yearB)) return yearB - yearA;

                    return 0;
                }

                if (groupBy === 'spin') {
                    const order = ['Heavy Rotation', 'Regular Play', 'Occasional Play', 'Never Played'];
                    return order.indexOf(a) - order.indexOf(b);
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
