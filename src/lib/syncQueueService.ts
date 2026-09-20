import { SyncQueueItem } from '../types';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

const QUEUE_COLLECTION = 'sync_queue';
const LOCAL_QUEUE_KEY = 'kenitra_sheets_sync_queue_v1';

// Local storage fallback helpers
function getLocalQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalQueue(items: SyncQueueItem[]) {
  try {
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Local queue save note:', err);
  }
}

/**
 * Enqueue a sync operation
 */
export async function enqueueSync(
  entity_type: SyncQueueItem['entity_type'],
  entity_id: string,
  operation: SyncQueueItem['operation'],
  payload: any,
  initialError?: string
): Promise<SyncQueueItem> {
  const id = `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const item: SyncQueueItem = {
    id,
    entity_type,
    entity_id,
    operation,
    payload,
    status: initialError ? 'failed' : 'pending',
    attempts: initialError ? 1 : 0,
    last_error: initialError,
    created_at: now,
    updated_at: now,
  };

  // 1. Save to local storage cache immediately
  const local = getLocalQueue();
  saveLocalQueue([item, ...local.filter((i) => i.id !== id)]);

  // 2. Persist to Firestore if online
  try {
    const docRef = doc(db, QUEUE_COLLECTION, id);
    await setDoc(docRef, item);
  } catch (err) {
    console.warn('Sync queue Firestore persist deferred to local cache:', err);
  }

  return item;
}

/**
 * Update a queue item status or attempt count
 */
export async function updateQueueStatus(
  id: string,
  status: SyncQueueItem['status'],
  lastError?: string
) {
  const now = new Date().toISOString();
  const local = getLocalQueue();
  const existing = local.find((i) => i.id === id);

  const updated: SyncQueueItem = existing
    ? {
        ...existing,
        status,
        attempts: (existing.attempts || 0) + 1,
        last_error: lastError ?? existing.last_error,
        updated_at: now,
      }
    : {
        id,
        entity_type: 'order',
        entity_id: id,
        operation: 'create',
        payload: {},
        status,
        attempts: 1,
        last_error: lastError,
        created_at: now,
        updated_at: now,
      };

  saveLocalQueue(local.map((i) => (i.id === id ? updated : i)));

  try {
    const docRef = doc(db, QUEUE_COLLECTION, id);
    await updateDoc(docRef, {
      status,
      attempts: updated.attempts,
      last_error: lastError || null,
      updated_at: now,
    });
  } catch {
    // Handled locally
  }
}

/**
 * Subscribe to sync queue items in real-time
 */
export function subscribeToSyncQueue(
  onSuccess: (items: SyncQueueItem[]) => void
) {
  const colRef = collection(db, QUEUE_COLLECTION);
  const q = query(colRef, orderBy('created_at', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snap) => {
      const items: SyncQueueItem[] = [];
      snap.forEach((d) => {
        items.push(d.data() as SyncQueueItem);
      });

      // Merge with local queue
      const local = getLocalQueue();
      const firestoreIds = new Set(items.map((i) => i.id));
      const combined = [...items, ...local.filter((i) => !firestoreIds.has(i.id))];
      onSuccess(combined);
    },
    (err) => {
      console.warn('Sync queue Firestore snapshot fallback:', err);
      onSuccess(getLocalQueue());
    }
  );
}

/**
 * Remove a single queue item
 */
export async function removeQueueItem(id: string) {
  const local = getLocalQueue().filter((i) => i.id !== id);
  saveLocalQueue(local);

  try {
    const docRef = doc(db, QUEUE_COLLECTION, id);
    await deleteDoc(docRef);
  } catch {
    // Handled locally
  }
}

/**
 * Clear all completed items from the queue
 */
export async function clearCompletedQueue() {
  const local = getLocalQueue().filter((i) => i.status !== 'completed');
  saveLocalQueue(local);
}

/**
 * Process and retry failed queue items via the Backend API
 */
export async function processQueueItem(
  item: SyncQueueItem,
  accessToken: string,
  spreadsheetId: string
): Promise<boolean> {
  await updateQueueStatus(item.id, 'processing');

  try {
    const res = await fetch('/api/sheets/sync-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        spreadsheetId,
        entity_type: item.entity_type,
        operation: item.operation,
        payload: item.payload,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    await updateQueueStatus(item.id, 'completed');
    return true;
  } catch (err: any) {
    console.error(`Failed to process queue item ${item.id}:`, err);
    await updateQueueStatus(item.id, 'failed', err.message || String(err));
    return false;
  }
}

/**
 * Retry all pending or failed items
 */
export async function retryAllFailedItems(
  accessToken: string,
  spreadsheetId: string
): Promise<{ succeeded: number; failed: number }> {
  const items = getLocalQueue().filter(
    (i) => i.status === 'failed' || i.status === 'pending'
  );

  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    const ok = await processQueueItem(item, accessToken, spreadsheetId);
    if (ok) succeeded++;
    else failed++;
  }

  return { succeeded, failed };
}
