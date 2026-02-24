// @ts-ignore
import { TaskService } from '../services/taskService.js';
import { IDB } from '../db/idbHelper.js';
import { SyncManager } from '../services/syncManager.js';
import { FiArchive, FiRefreshCcw, FiLogOut } from 'react-icons/fi';

export default function Footer({ workspaceId, onLogout }: any) {

  // --- 1. ARCHIVE LOGIC ---
  const handleArchive = async () => {
    if (!workspaceId) return alert("Select a workspace first!");

    // Grab all tasks and filter the completed ones
    const allTasks = await TaskService.getTasks(workspaceId);
    const completedTasks = allTasks.filter((t: any) => t.completed);

    if (completedTasks.length === 0) {
      alert("No completed missions to archive!");
      return;
    }

    console.log(` Sending ${completedTasks.length} tasks to Encryption Worker...`);

    // Spin up the Web Worker
    const worker = new Worker(new URL('../workers/archiveWorker.js', import.meta.url), { type: 'module' });
    
    // Send the tasks to be encrypted and moved
    worker.postMessage({ action: 'ARCHIVE', tasks: completedTasks });

    worker.onmessage = async (e) => { 
      if (e.data.status === 'SUCCESS') {
        worker.terminate();
        
        console.log("⏳ Pushing deletions to the server...");
        await SyncManager.processQueue(); 
        
        window.dispatchEvent(new Event('task-synced')); 
      }
    };
  };
//--------Unarchive ---------------
  const handleUnarchive = async () => {
    if (!workspaceId) return alert("Select a workspace first!");

    const worker = new Worker(new URL('../workers/archiveWorker.js', import.meta.url), { type: 'module' });
    
    // Send the UNARCHIVE command with the current workspace ID
    worker.postMessage({ action: 'UNARCHIVE', workspaceId });

    worker.onmessage = async (e) => { 
      if (e.data.status === 'SUCCESS') {
        if (e.data.count === 0) alert("No archived missions found for this workspace.");
        worker.terminate();
        
        console.log("⏳ Pushing restored missions to the server...");
        await SyncManager.processQueue(); 
        
        window.dispatchEvent(new Event('task-synced')); 
      } else {
        alert("Failed to decrypt archives.");
        worker.terminate();
      }
    };
  };

  // --- 2. LOGOUT LOGIC ---
  const handleLogout = async () => {
    if (confirm("Initiate total system logout?")) {
      console.log(" Initiating secure logout protocol...");
      
      // 1. Destroy the authentication token
      localStorage.removeItem('token'); 

      // 2.  Wipe all local offline data so the next user starts completely fresh
      try {
        await IDB.clear('tasks');
        await IDB.clear('workspaces');
        await IDB.clear('syncQueue');
        await IDB.clear('archives'); // Keeps encrypted backups private to the user who made them
        console.log(" Local database securely wiped.");
      } catch (err) {
        console.error(" Error wiping local database:", err);
      }

      // 3. Trigger the React state to hide the dashboard and show the login screen
      if (onLogout) onLogout();
    }
  };

  return (
    <footer className="app-footer" style={{ 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
      padding: '10px 20px', borderTop: '1px solid #eaeaea', backgroundColor: '#f8f9fa' 
    }}>
      <div className="footer-brand" style={{ fontWeight: 'bold', color: '#555' }}>
        Agency OS
      </div>
      
      <div className="footer-actions" style={{ display: 'flex', gap: '12px' }}>
        
        <button onClick={handleArchive} style={{ 
            background: 'none', border: '1px solid #f39c12', color: '#f39c12', 
            padding: '6px 10px', borderRadius: '4px', fontSize:'0.8rem', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '6px'
        }}>
           <FiArchive /> Archive All
        </button>

        <button onClick={handleUnarchive} style={{ 
            background: 'none', border: '1px solid #8b5cf6', color: '#8b5cf6', 
            padding: '6px 10px', borderRadius: '4px', fontSize:'0.8rem', cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '6px'
        }}>
           <FiRefreshCcw /> Unarchive All
        </button>

        <button onClick={handleLogout} style={{ 
            background: 'none', border: '1px solid #dc3545', color: '#dc3545', 
            padding: '6px 10px', borderRadius: '4px', fontSize:'0.8rem' , cursor: 'pointer', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <FiLogOut /> Log Out
        </button>
      </div>
    </footer>
  );
}