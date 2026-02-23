import { IDB } from '../db/idbHelper.js';
import { SyncManager } from './syncManager.js';
import { AuthService } from './authService.js';

const API_URL = 'http://localhost:5000/api/tasks';

export const TaskService = {
    
    // 1. GET TASKS (Updated to use workspaceId)
    async getTasks(workspaceId) { 
        if (navigator.onLine) {
            try {
                // Fetch tasks from Express backend
                const response = await fetch(API_URL, {
                    headers: { 
                        'Authorization': `Bearer ${AuthService.getToken()}` 
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Server returned status: ${response.status}`);
                }

                const data = await response.json();
                const serverTasks = data.data ? data.data.tasks : data; 
                
                if (Array.isArray(serverTasks)) {
                    for (const task of serverTasks) {
                        // FIX: Ensure MongoDB's _id or clientId is properly mapped to IndexedDB's 'id'
                        const safeTask = { 
                            ...task, 
                            id: task.clientId || task.id || task._id, 
                            synced: true 
                        };
                        
                        await IDB.put('tasks', safeTask); 
                    }
                    console.log(" Local database perfectly hydrated from server.");
                }
            } catch (err) {
                
                console.error(' Hydration Error:', err.message);
            }
        }

        // ALWAYS return the tasks from IndexedDB
        const localTasks = await IDB.getAll('tasks', 'workspaceId', workspaceId);
        
        const visibleTasks = localTasks.filter(t => !t.isDeleted);
        return visibleTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    async syncBatch(tasksArray) {
        const token = AuthService.getToken();
        
        const response = await fetch(`${API_URL}/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tasks: tasksArray }) 
        });
        
        if (!response.ok) {
            throw new Error(`Batch sync failed with status: ${response.status}`);
        }
        
        return await response.json();
    },

    // 2. ADD TASK (Updated to use workspaceId)
    async addTask(taskData) {
        const newTask = {
            ...taskData,
            id: crypto.randomUUID(), 
            synced: false,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            isDeleted: false
            // Note: taskData MUST contain workspaceId now
        };

        await IDB.put('tasks', newTask);

        if (navigator.onLine) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AuthService.getToken()}`
                     },
                    body: JSON.stringify({ ...newTask, clientId: newTask.id }) 
                });

                if (response.ok) {
                    await IDB.put('tasks', { ...newTask, synced: true });
                    return { ...newTask, synced: true };
                }
            } catch (err) {
                console.warn('Offline: Task saved locally.');
            }
        }

        await this.addToSyncQueue({ 
            id: newTask.id, 
            action: 'CREATE', 
            payload: newTask 
        });

        return newTask;
    },

    // 3. UPDATE TASK
    async updateTask(task) {
        const updatedTask = { 
            ...task, 
            synced: false, 
            updatedAt: new Date().toISOString() 
        };

        await IDB.put('tasks', updatedTask);

        if (navigator.onLine) {
            try {
                const response = await fetch(`${API_URL}/${task.id}`, { 
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AuthService.getToken()}`
                     },
                    body: JSON.stringify(updatedTask)
                });
                
                if (response.ok) {
                    await IDB.put('tasks', { ...updatedTask, synced: true });
                    return;
                }
            } catch (err) { console.warn('Offline update'); }
        }

        await this.addToSyncQueue({ 
            id: task.id, 
            action: 'UPDATE', 
            payload: updatedTask 
        });
    },

    

    // 4. DELETE TASK
    async deleteTask(taskId) {
        const task = await IDB.get('tasks', taskId);
        if (!task) return;

        const updatedTask = { ...task, isDeleted: true, synced: false, updatedAt: new Date().toISOString() };
        await IDB.put('tasks', updatedTask);

        if (navigator.onLine) {
            try {
                await fetch(`${API_URL}/${taskId}`, { method: 'DELETE',
                    headers: { 'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AuthService.getToken()}`
                     }
                 });
                await IDB.put('tasks', { ...updatedTask, synced: true });
                return;
            } catch (e) { console.warn('Offline delete'); }
        }

        await this.addToSyncQueue({ 
            id: taskId, 
            action: 'DELETE',
            payload: { id: taskId }
        });
    },

    // HELPER: SMART QUEUE
    async addToSyncQueue(newItem) {
        const queue = await IDB.getAll('syncQueue');
        const existingCreate = queue.find(q => q.id === newItem.id && q.action === 'CREATE');

        if (existingCreate) {
            if (newItem.action === 'DELETE') {
                await IDB.delete('syncQueue', existingCreate.id); 
            } else {
                existingCreate.payload = { ...newItem.payload, clientId: newItem.id };
                await IDB.put('syncQueue', existingCreate);
            }
        } else {
            await IDB.put('syncQueue', newItem);
        }
        SyncManager.processQueue();
    }
};