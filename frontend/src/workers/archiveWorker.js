// client/js/workers/archiveWorker.js

const DB_NAME = 'IDB';
const DB_VERSION = 3;

// --- CRYPTO UTILS ---
async function getCryptoKey() {
    const rawKey = new TextEncoder().encode("AgencyOS-Top-Secret-Passphrase-2026");
    const keyHash = await crypto.subtle.digest('SHA-256', rawKey);
    return crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

// Encrypt
async function encryptPayload(text, key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12)); 

    const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);

    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    return `${ivHex}:${cipherBase64}`;
}

async function decryptPayload(encryptedString, key) {
    const [ivHex, cipherBase64] = encryptedString.split(':');
    
    // Convert back to buffers
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const binaryString = atob(cipherBase64);
    const cipherBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        cipherBuffer[i] = binaryString.charCodeAt(i);
    }

    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, cipherBuffer);
    return new TextDecoder().decode(decryptedBuffer);
}

// --- DB UTILS ---
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = () => reject("Worker DB Connection Failed");
    });
}

// --- MAIN HANDLER ---
self.onmessage = async (e) => {
    const { action, tasks, workspaceId } = e.data;

    try {
        const db = await openDB();
        const key = await getCryptoKey();

        // ==========================================
        // ACTION: ARCHIVE (Encrypt & Delete)
        // ==========================================
        if (action === 'ARCHIVE') {
            const tx = db.transaction(['tasks', 'archives', 'syncQueue'], 'readwrite');
            const taskStore = tx.objectStore('tasks');
            const archiveStore = tx.objectStore('archives');
            const syncQueueStore = tx.objectStore('syncQueue'); 

            let count = 0;
            for (const task of tasks) {
                const encryptedContent = await encryptPayload(task.content, key);
                
                archiveStore.put({
                    id: task.id,
                    originalWorkspace: task.workspaceId,
                    encryptedData: encryptedContent,
                    archivedAt: new Date().toISOString(),
                    type: 'AES-GCM'
                });

                taskStore.delete(task.id);
                
                syncQueueStore.put({ id: task.id, action: 'DELETE', payload: { id: task.id } });
                syncQueueStore.put({ 
                    id: `arc_${task.id}`, 
                    action: 'CREATE_ARCHIVE', 
                    payload: { 
                        id: task.id, 
                        originalWorkspace: task.workspaceId, 
                        encryptedData: encryptedContent 
                    } 
                });
                count++;
            }

            tx.oncomplete = () => self.postMessage({ status: 'SUCCESS', count });
        }

        // ==========================================
        // ACTION: UNARCHIVE (Decrypt & Restore)
        // ==========================================
        if (action === 'UNARCHIVE') {
            // 1. Fetch all archives to find ones matching this workspace
            const readTx = db.transaction('archives', 'readonly');
            const allArchives = await new Promise((resolve) => {
                const req = readTx.objectStore('archives').getAll();
                req.onsuccess = () => resolve(req.result);
            });

            const workspaceArchives = allArchives.filter(a => a.originalWorkspace === workspaceId);
            
            if (workspaceArchives.length === 0) {
                return self.postMessage({ status: 'SUCCESS', count: 0 });
            }

            // 2. Decrypt and Restore
            const writeTx = db.transaction(['tasks', 'archives', 'syncQueue'], 'readwrite');
            const taskStore = writeTx.objectStore('tasks');
            const archiveStore = writeTx.objectStore('archives');
            const syncQueueStore = writeTx.objectStore('syncQueue');

            let count = 0;
            for (const arc of workspaceArchives) {
                const plainContent = await decryptPayload(arc.encryptedData, key);
                
                const recoveredTask = {
                    id: arc.id,
                    content: plainContent,
                    completed: true, // Restore to completed column
                    workspaceId: arc.originalWorkspace,
                    synced: false,
                    isDeleted: false,
                    createdAt: arc.archivedAt,
                    updatedAt: new Date().toISOString()
                };

                taskStore.put(recoveredTask);
                archiveStore.delete(arc.id);
                
                syncQueueStore.put({ id: recoveredTask.id, action: 'CREATE', payload: recoveredTask });
                syncQueueStore.put({ id: `arc_del_${arc.id}`, action: 'DELETE_ARCHIVE', payload: { id: arc.id } });
                count++;
            }

            writeTx.oncomplete = () => self.postMessage({ status: 'SUCCESS', count });
        }

    } catch (err) {
        console.error("Worker Error:", err);
        self.postMessage({ status: 'ERROR', message: err.message });
    }
};