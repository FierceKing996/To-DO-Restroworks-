export const DB_CONFIG = {
    name: 'IDB',
    version: 3, 
    stores: {
        tasks: { 
            keyPath: 'id', 
            
            indexes: ['synced', 'completed', 'userId', 'workspaceID'] 
        },
        archives: {
            keyPath: 'id'
        },
        workspaces: {
            keyPath: 'id',
            indexes: ['synced', 'isDeleted'],
        },
        users: { 
            keyPath: 'userId',
            indexes: ['username']
        },
        syncQueue: { 
            keyPath: 'id', 
            autoIncrement: true 
        }
    }
};

export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const txn = event.target.transaction; // Get transaction to update existing stores
            
            if (!db.objectStoreNames.contains('workspaces')) {
                const wsStore = db.createObjectStore('workspaces', { keyPath: 'id' });
                wsStore.createIndex('synced', 'synced', { unique: false });
                wsStore.createIndex('isDeleted', 'isDeleted', { unique: false });
                
                // Add default "Personal" workspace immediately so the app isn't empty
                wsStore.put({ 
                    id: 'default-personal', 
                    title: 'Personal', 
                    synced: false, 
                    isDeleted: false,
                    updatedAt: new Date().toISOString() 
                });
            }

            // 1. TASKS
            if (!db.objectStoreNames.contains('tasks')) {
                // A. Fresh Install: Create new with 'workspaceId'
                const store = db.createObjectStore('tasks', { keyPath: 'id' });
                store.createIndex('synced', 'synced', { unique: false });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('workspaceId', 'workspaceId', { unique: false }); // New Standard
                store.createIndex('completed', 'completed', { unique: false });
            } else {
                const store = txn.objectStore('tasks');
                
                // Delete old index if it exists
                if (store.indexNames.contains('workspace')) {
                    store.deleteIndex('workspace');
                }

                // Add new index if missing
                if (!store.indexNames.contains('workspaceId')) {
                    store.createIndex('workspaceId', 'workspaceId', { unique: false });
                }
            }

            // ... (Rest of the stores: archives, users, syncQueue) ...
            if (!db.objectStoreNames.contains('archives')) db.createObjectStore('archives', { keyPath: 'id' });
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'userId' });
            if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('IndexedDB Init Failed');
    });
}