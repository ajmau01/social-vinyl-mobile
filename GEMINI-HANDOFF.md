# Gemini Handoff — Issues #136, #138, #139

> **Assigned**: 2026-02-27
> **Branch**: `refactor/136-138-139-join-session-cleanup`
> **PR Title**: `refactor: event-driven join session + sessionId type normalization (#136, #138, #139)`
> **Closes**: #136, #138, #139

---

## Context

Three tightly-coupled tech-debt issues inside the WebSocket join session flow. One PR, one branch.

- **#136** — `joinSession()` uses a fragile polling + `dynamic require()` hack
- **#138** — `joinSession()` polls on a 100ms interval instead of using event-driven subscription
- **#139** — `sessionId` arrives from backend as a JSON number, but is typed `string | number | null` throughout the client. Must be normalized to `string` at the message boundary.

**Do not change call sites** (listed at the bottom for awareness only).

---

## Step 0 — Create Branch

```bash
cd /Users/andrewmauer/projects/social-vinyl-mobile
git checkout main
git pull
git checkout -b refactor/136-138-139-join-session-cleanup
```

---

## Step 1 — Fix sessionId Type (`useSessionStore.ts`)

**File**: `src/store/useSessionStore.ts`

### 1a. Update `SessionState` interface

**Before** (line 13):
```typescript
    sessionId: string | number | null;
```

**After**:
```typescript
    sessionId: string | null;
```

### 1b. Update `setSessionId` action signature in interface

**Before** (line 26):
```typescript
    setSessionId: (id: string | number | null) => void;
```

**After**:
```typescript
    setSessionId: (id: string | null) => void;
```

### 1c. Update `setSessionId` implementation body

**Before** (lines 101–108):
```typescript
            setSessionId: async (id) => {
                set({ sessionId: id });
                // If we have both id and secret, save them securely
                const { sessionSecret } = useSessionStore.getState();
                if (id && sessionSecret) {
                    await secureStorage.saveSessionCredentials(id.toString(), sessionSecret);
                }
            },
```

**After** — `id` is now `string | null`, so drop the `.toString()` call:
```typescript
            setSessionId: async (id) => {
                set({ sessionId: id });
                // If we have both id and secret, save them securely
                const { sessionSecret } = useSessionStore.getState();
                if (id && sessionSecret) {
                    await secureStorage.saveSessionCredentials(id, sessionSecret);
                }
            },
```

### 1d. Update `setSessionSecret` implementation body

**Before** (lines 120–126):
```typescript
            setSessionSecret: async (secret) => {
                set({ sessionSecret: secret });
                const { sessionId } = useSessionStore.getState();
                if (sessionId && secret) {
                    await secureStorage.saveSessionCredentials(sessionId.toString(), secret);
                }
            },
```

**After** — `sessionId` is now `string | null`, so drop the `.toString()` call:
```typescript
            setSessionSecret: async (secret) => {
                set({ sessionSecret: secret });
                const { sessionId } = useSessionStore.getState();
                if (sessionId && secret) {
                    await secureStorage.saveSessionCredentials(sessionId, secret);
                }
            },
```

---

## Step 2 — Normalize sessionId at Message Boundary (`useWebSocket.ts`)

**File**: `src/hooks/useWebSocket.ts`

### 2a. Update `UseWebSocketResult` interface

**Before** (line 20):
```typescript
    sessionId: string | number | null;
```

**After**:
```typescript
    sessionId: string | null;
```

### 2b. Normalize sessionId in `SESSION_JOINED` handler

**Before** (line 88):
```typescript
                    if (sessionId) setSessionId(sessionId);
```

**After** — coerce at the message boundary so all downstream code gets a string:
```typescript
                    if (sessionId) setSessionId(String(sessionId));
```

### 2c. Remove now-redundant `.toString()` in `connect` callback

**Before** (lines 303–310):
```typescript
        const state = useSessionStore.getState();
        webSocketService.connect(
            username,
            authToken || undefined,
            state.sessionId ? state.sessionId.toString() : undefined,
            state.sessionSecret || undefined
        );
```

**After** — `sessionId` is now `string | null`, so `.toString()` is redundant:
```typescript
        const state = useSessionStore.getState();
        webSocketService.connect(
            username,
            authToken || undefined,
            state.sessionId ?? undefined,
            state.sessionSecret || undefined
        );
```

---

## Step 3 — Replace Polling with Event-Driven Wait (`WebSocketService.ts`)

**File**: `src/services/WebSocketService.ts`

### 3a. Add static import at top of file

There is already a dynamic `require('@/store/useSessionStore')` in the `PROTOCOL_ACK` handler (line ~411). Replace all uses of dynamic require with a static import.

**Add** to the existing imports block (after the last import, around line 17):
```typescript
import { useSessionStore } from '@/store/useSessionStore';
```

> **Circular import check**: `useSessionStore` does not import from `WebSocketService`, so this is safe.

### 3b. Replace dynamic require in `PROTOCOL_ACK` handler

**Before** (line ~411):
```typescript
                    const { setEnabledFeatures } = require('@/store/useSessionStore').useSessionStore.getState();
                    setEnabledFeatures(ackValidation.data.enabledFeatures);
```

**After**:
```typescript
                    const { setEnabledFeatures } = useSessionStore.getState();
                    setEnabledFeatures(ackValidation.data.enabledFeatures);
```

### 3c. Add `waitForConnection()` private method

Add this method to the `WebSocketService` class, just before `handleOpen` (around line 334). Insert it after the `joinSession` method closing brace:

```typescript
    /**
     * Issues #136 + #138: Event-driven connection wait.
     * Subscribes to the store and resolves as soon as connectionState
     * transitions to 'connected', or rejects after timeoutMs.
     * Replaces the previous 100ms polling loop.
     */
    private waitForConnection(timeoutMs: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (useSessionStore.getState().connectionState === 'connected') {
                resolve();
                return;
            }

            const timeout = setTimeout(() => {
                unsubscribe();
                reject(new Error('Connection timed out'));
            }, timeoutMs);

            const unsubscribe = useSessionStore.subscribe((state) => {
                if (state.connectionState === 'connected') {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve();
                }
            });
        });
    }
```

### 3d. Replace polling block in `joinSession()`

**Before** — the entire `await new Promise<void>(...)` block (lines 297–322):
```typescript
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    clearInterval(interval);
                    reject(new Error('Connection timed out'));
                }, 10000);

                const interval = setInterval(() => {
                    // Check actual socket state AND protocol handshake readiness
                    if (this.socket?.readyState === WebSocket.OPEN) {
                        const { useSessionStore } = require('@/store/useSessionStore');
                        const state = useSessionStore.getState().connectionState;

                        // We are 'connected' only after successful protocol handshake or auth
                        if (state === 'connected') {
                            clearInterval(interval);
                            clearTimeout(timeout);
                            resolve();
                        }
                    } else if (this.socket?.readyState === WebSocket.CLOSED && !isAlreadyConnected) {
                        // Only fail if we were actually trying to connect
                        clearInterval(interval);
                        clearTimeout(timeout);
                        reject(new Error('WebSocket closed during connection'));
                    }
                }, 100);
            });
```

**After** — one line, using the new event-driven method:
```typescript
            await this.waitForConnection(10000);
```

The full updated `joinSession()` method should look like this after the change:

```typescript
    public async joinSession(joinCode: string, username: string, authToken?: string): AsyncResult<any> {
        try {
            // BLOCK-1 FIX: If already connected with matching credentials, skip reconnect
            const isAlreadyConnected = this.socket?.readyState === WebSocket.OPEN &&
                                     this.currentConfig?.username === username &&
                                     this.currentConfig?.authToken === authToken;

            if (!isAlreadyConnected) {
                if (CONFIG.DEBUG_WS) logger.log('[WS] joinSession: Reconnecting with guest credentials');
                this.disconnect();
                this.connect(username, authToken);
            } else {
                if (CONFIG.DEBUG_WS) logger.log('[WS] joinSession: Already connected with matching credentials, skipping reconnect');
            }

            await this.waitForConnection(10000);

            // Connection successful, now send join action
            const response = await this.sendAction('join-session', { joinCode, username });
            return { success: true, data: response };

        } catch (err: any) {
            this.disconnect();
            return { success: false, error: err };
        }
    }
```

---

## Step 4 — Verification

Run from the repo root:

```bash
cd /Users/andrewmauer/projects/social-vinyl-mobile

# Zero TypeScript errors
npx tsc --noEmit 2>&1 | head -40

# All tests pass
npm test 2>&1 | tail -30
```

Expected: `tsc` exits clean (no output). Jest exits with all suites passing.

If `tsc` reports errors, fix them before opening the PR. Common issues to watch for:
- Any remaining call site that passes `number` to `setSessionId` (should now fail — fix by wrapping with `String(...)`)
- Any place that compares `sessionId` to a number literal (update to string)

---

## Step 5 — Commit and Open PR

```bash
git add src/services/WebSocketService.ts src/hooks/useWebSocket.ts src/store/useSessionStore.ts
git commit -m "$(cat <<'EOF'
refactor: event-driven join session + sessionId type normalization (#136, #138, #139)

Co-Authored-By: Andrew Mauer <ajmauer@gmail.com>
EOF
)"
```

Then open the PR against `main`:

```bash
gh pr create \
  --title "refactor: event-driven join session + sessionId type normalization (#136, #138, #139)" \
  --body "$(cat <<'EOF'
## Summary

- **#139** Normalize `sessionId` to `string` at the WebSocket message boundary (`String(sessionId)` in `session-joined` handler). Update `useSessionStore` interface and `useWebSocket` return type from `string | number | null` to `string | null`. Remove now-redundant `.toString()` coercions.
- **#138** Replace 100ms polling loop in `joinSession()` with `waitForConnection()` — a Zustand store subscription that resolves immediately on `connectionState === 'connected'` and rejects with a timeout after 10 seconds. Zero CPU waste between state changes.
- **#136** Remove `dynamic require('@/store/useSessionStore')` hack inside the polling loop and the `PROTOCOL_ACK` handler. Replaced with a static top-level import.

## Verification

- [x] `npx tsc --noEmit` — zero errors
- [x] `npm test` — all suites pass

## Manual Test Checklist

- [ ] Guest join via 6-digit code entry (join-session.tsx)
- [ ] Guest join via deep link (index.tsx handleGuestJoin)
- [ ] Guest join via QR scan (if #173 is merged; otherwise skip)
- [ ] Host login and session create still works
- [ ] Reconnect after backgrounding app still transitions to `connected`

Closes #136
Closes #138
Closes #139
EOF
)"
```

---

## Call Sites (No Changes Needed — Awareness Only)

| Location | Path | Note |
|---|---|---|
| `SessionService.ts:115` | `src/services/SessionService.ts` | wraps `wsService.joinSession()` — no change |
| `app/index.tsx:225` | `app/index.tsx` | `handleGuestJoin()` calls wsService directly — no change |
| `app/join-session.tsx:127` | `app/join-session.tsx` | calls via sessionService — no change |
| `app/session-list.tsx:70` | `app/session-list.tsx` | calls via sessionService — no change |

---

## Files Changed Summary

| File | Changes |
|---|---|
| `src/store/useSessionStore.ts` | `sessionId: string \| null` (was `string \| number \| null`); drop `.toString()` in `setSessionId` and `setSessionSecret` |
| `src/hooks/useWebSocket.ts` | `sessionId: string \| null` in return type; `String(sessionId)` normalization; remove `.toString()` in connect callback |
| `src/services/WebSocketService.ts` | Static import for `useSessionStore`; replace dynamic require; add `waitForConnection()`; replace polling block |
