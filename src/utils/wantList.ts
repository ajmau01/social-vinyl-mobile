import { Share } from 'react-native';
import { DatabaseService } from '@/services/DatabaseService';
import { Release, WantListItem } from '@/types';

interface SessionContext {
    sessionId: string | null;
    sessionName: string | null;
    hostUsername: string | null;
}

export async function toggleWantList(release: Release, ctx: SessionContext): Promise<boolean> {
    const db = DatabaseService.getInstance();
    const inList = await db.isInWantList(release.id);
    if (inList) {
        await db.removeFromWantList(release.id);
        return false; // removed
    } else {
        await db.addToWantList({
            releaseId: release.id,
            releaseTitle: release.title,
            artist: release.artist,
            albumArtUrl: release.thumb_url ?? null,
            hostUsername: ctx.hostUsername,
            sessionName: ctx.sessionName,
            sessionId: ctx.sessionId,
            addedAt: Date.now(),
        });
        return true; // added
    }
}

export async function getWantList(): Promise<WantListItem[]> {
    return DatabaseService.getInstance().getWantList();
}

export async function shareWantList(items: WantListItem[]): Promise<void> {
    if (items.length === 0) return;
    const text = buildShareText(items);
    await Share.share({ message: text });
}

export function buildShareText(items: WantListItem[]): string {
    const lines = ["Records I'm looking for:"];
    const grouped = new Map<string, WantListItem[]>();
    for (const item of items) {
        const key = item.sessionId ?? 'standalone';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(item);
    }
    for (const [, sessionItems] of grouped) {
        const first = sessionItems[0];
        const party = first.hostUsername ? `${first.hostUsername}'s` : 'a';
        const date = new Date(first.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        lines.push(`\n— ${party} party, ${date} —`);
        for (const item of sessionItems) {
            lines.push(`• ${item.artist} — ${item.releaseTitle}`);
        }
    }
    return lines.join('\n');
}
