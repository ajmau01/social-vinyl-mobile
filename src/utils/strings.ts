/**
 * Removes diacritics from a string (e.g., "Sigur Rós" -> "Sigur Ros").
 * Used for diacritic-insensitive search.
 */
export function removeDiacritics(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Strips common articles from the beginning of an artist's name for improved sorting.
 * Currently only strips "The " as per specification.
 */
export function getArtistSortKey(artist: string): string {
    return artist.replace(/^The\s+/i, '');
}
