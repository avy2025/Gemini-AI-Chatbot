/**
 * storage.js
 * Handles persistent chat history using IndexedDB (preferred)
 * with a localStorage fallback for environments that block IDB.
 *
 * Schema versioning ensures old data is migrated safely on updates.
 */

const DB_NAME = 'GeminiChatDB';
const DB_VERSION = 2; // Bump this integer when schema changes
const STORE_NAME = 'messages';
const LS_KEY = 'gemini_chat_history'; // localStorage fallback key

/** @type {IDBDatabase|null} */
let db = null;

/** Flag set to true when IndexedDB is unavailable */
let useLocalStorage = false;

/* ─────────────────────────────────────────────
   IndexedDB helpers
───────────────────────────────────────────── */

/**
 * Opens (or upgrades) the IndexedDB database.
 * Resolves when the DB is ready.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Called when DB version changes (first open or upgrade)
        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // v1 → create object store
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // v2 → add `role` index if upgrading from v1
            if (event.oldVersion < 2) {
                const transaction = event.target.transaction;
                const store = transaction.objectStore(STORE_NAME);
                if (!store.indexNames.contains('role')) {
                    store.createIndex('role', 'role', { unique: false });
                }
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Wraps an IDB request in a Promise.
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
function idbRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

/* ─────────────────────────────────────────────
   localStorage fallback helpers
───────────────────────────────────────────── */

function lsLoad() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
        return [];
    }
}

function lsSave(messages) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(messages));
    } catch (e) {
        console.warn('localStorage write failed:', e);
    }
}

/* ─────────────────────────────────────────────
   Public API
───────────────────────────────────────────── */

/**
 * Message record shape stored in IndexedDB / localStorage.
 * @typedef {Object} ChatMessage
 * @property {number}  [id]        - Auto-assigned by IDB
 * @property {string}  role        - 'user' | 'ai'
 * @property {string}  content     - Raw message text
 * @property {number}  timestamp   - Unix ms
 * @property {string}  timeLabel   - Human-readable HH:MM
 * @property {number}  schemaVersion - DB_VERSION at save time
 */

/**
 * Initialise storage. Must be awaited before other calls.
 * Falls back to localStorage if IndexedDB is unavailable.
 */
export async function initStorage() {
    try {
        db = await openDB();
        useLocalStorage = false;
    } catch (err) {
        console.warn('IndexedDB unavailable, using localStorage fallback:', err);
        useLocalStorage = true;
    }
}

/**
 * Persist a single message.
 * @param {'user'|'ai'} role
 * @param {string} content
 * @param {string} timeLabel
 * @returns {Promise<number>} The new message ID
 */
export async function saveMessage(role, content, timeLabel) {
    const record = {
        role,
        content,
        timestamp: Date.now(),
        timeLabel,
        schemaVersion: DB_VERSION,
    };

    if (useLocalStorage) {
        const messages = lsLoad();
        record.id = Date.now(); // pseudo-key
        messages.push(record);
        lsSave(messages);
        return record.id;
    }

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    return idbRequest(store.add(record));
}

/**
 * Load all persisted messages, ordered by timestamp ascending.
 * @returns {Promise<ChatMessage[]>}
 */
export async function loadAllMessages() {
    if (useLocalStorage) {
        return lsLoad().sort((a, b) => a.timestamp - b.timestamp);
    }

    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    return idbRequest(index.getAll());
}

/**
 * Delete all messages from storage.
 * @returns {Promise<void>}
 */
export async function clearAllMessages() {
    if (useLocalStorage) {
        localStorage.removeItem(LS_KEY);
        return;
    }

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    return idbRequest(store.clear());
}

/* ─────────────────────────────────────────────
   Export / Import
───────────────────────────────────────────── */

/**
 * Serialise all messages to a JSON blob and trigger a download.
 */
export async function exportMessages() {
    const messages = await loadAllMessages();
    const exportData = {
        schemaVersion: DB_VERSION,
        exportedAt: new Date().toISOString(),
        messages,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gemini-chat-${new Date().toISOString().split('T')[0]}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
}

/**
 * Import messages from an uploaded JSON file.
 * Validates schema version compatibility before importing.
 * @param {File} file
 * @returns {Promise<ChatMessage[]>} Imported messages (so UI can replay them)
 * @throws {Error} If the file is invalid or schema version is too old
 */
export async function importMessages(file) {
    const text = await file.text();
    let data;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Invalid JSON file. Please upload a valid chat export.');
    }

    if (!data.messages || !Array.isArray(data.messages)) {
        throw new Error('Invalid export file format — missing messages array.');
    }

    // Warn but do not block if schema version is very old (< 1)
    const exportedVersion = data.schemaVersion ?? 1;
    if (exportedVersion < 1) {
        throw new Error(`Incompatible export version (v${exportedVersion}). Minimum supported: v1.`);
    }

    // Clear existing history first, then import
    await clearAllMessages();

    for (const msg of data.messages) {
        await saveMessage(
            msg.role || 'ai',
            msg.content || '',
            msg.timeLabel || ''
        );
    }

    return data.messages;
}
