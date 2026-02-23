import { IDB } from '../db/idbHelper.js';
import { SyncManager } from './syncManager.js';
import { AuthService } from './authService.js';
const API_URL = 'http://localhost:5000/api/workspaces';

export const WorkspaceService = {
    
    // 1. GET ALL (Local First)
    async getWorkspaces() {
        // A. HYDRATION: If online, fetch latest from Express backend
        if (navigator.onLine) {
            try {
                const response = await fetch(API_URL, {
                    headers: { 'Authorization': `Bearer ${AuthService.getToken()}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const serverWorkspaces = data.data ? data.data.workspaces : data;
                    
                    if (Array.isArray(serverWorkspaces)) {
                        for (const ws of serverWorkspaces) {
                            // Map MongoDB _id to IDB id securely
                            await IDB.put('workspaces', { 
                                ...ws, 
                                id: ws.clientId || ws.id || ws._id, 
                                synced: true 
                            });
                        }
                    }
                }
            } catch (err) {
                console.warn(' Offline: Loading workspaces strictly from local cache.');
            }
        }

        // B. Load from IDB
        const localData = await IDB.getAll('workspaces');
        const activeWorkspaces = localData.filter(w => !w.isDeleted);
        
        if (activeWorkspaces.length === 0) {
            const defaultWs = { 
                id: crypto.randomUUID(), 
                title: 'Personal', 
                color: '#666',
                synced: false, 
                isDeleted: false,
                createdAt: new Date().toISOString()
            };
            
            // Actually put it in the database so it survives!
            await IDB.put('workspaces', defaultWs); 
            
            // Queue it to sync to the backend too
            await IDB.put('syncQueue', { 
                id: defaultWs.id, 
                action: 'CREATE_WORKSPACE', 
                payload: defaultWs 
            });
            SyncManager.processQueue();
            
            return [defaultWs];
        }
        
        return activeWorkspaces;
    },

    // 2. ADD WORKSPACE
    async addWorkspace(title, color = '#666') {
        const newWs = {
            id: crypto.randomUUID(),
            title,
            color,
            synced: false,
            isDeleted: false,
            updatedAt: new Date().toISOString()
        };

        // A. Save Local
        await IDB.put('workspaces', newWs);

        // B. Try Network
        if (navigator.onLine) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AuthService.getToken()}`
                     },
                    body: JSON.stringify({ ...newWs, clientId: newWs.id })
                });

                if (response.ok) {
                    await IDB.put('workspaces', { ...newWs, synced: true });
                    return { ...newWs, synced: true };
                }
            } catch (err) {
                console.warn('Offline: Workspace saved locally.');
            }
        }

        // C. Queue it (Action: CREATE_WORKSPACE)
        await IDB.put('syncQueue', { 
            id: newWs.id, 
            action: 'CREATE_WORKSPACE', // Distinct action name
            payload: newWs 
        });

        SyncManager.processQueue();
        return newWs;
    },

    // 3. DELETE WORKSPACE
    async deleteWorkspace(workspaceId) {
        const ws = await IDB.get('workspaces', workspaceId);
        if (!ws) return;

        const updatedWs = { ...ws, isDeleted: true, synced: false };
        await IDB.put('workspaces', updatedWs);

        if (navigator.onLine) {
            try {
                await fetch(`${API_URL}/${workspaceId}`, { method: 'DELETE' ,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AuthService.getToken()}` // 🔐 ADD THIS LINE
                    }
                }   
                );
                await IDB.put('workspaces', { ...updatedWs, synced: true });
                return;
            } catch (e) { console.warn('Offline delete'); }
        }

        await IDB.put('syncQueue', { 
            id: workspaceId, 
            action: 'DELETE_WORKSPACE',
            payload: { id: workspaceId }
        });
        
        SyncManager.processQueue();
    }
};