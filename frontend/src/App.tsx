import { useState, useEffect } from 'react';

// Import your Vanilla JS engines (Vite handles .js imports perfectly)
import { initDB } from './db/dbconfig.js';
import { SyncManager } from './services/syncManager.js';
import { AuthService } from './services/authService.js';
import { IDB } from './db/idbHelper.js';
import Auth from './components/Auth';

// Import our UI Components (We will build these next)
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskBoard from './components/TaskBoard';
import Footer from './components/Footer';
import WorkspaceModal from './components/WorkspaceModal';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [userName, setUserName] = useState(localStorage.getItem('agency_user') || 'User');
  const [searchQuery, setSearchQuery] = useState('');
  // --- GLOBAL STATE ---
  // 1. Wait for DB to load before showing the UI

  const [isDbReady, setIsDbReady] = useState(false);
  
  // 2. Sidebar Toggle State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  
  // 3. Active Workspace State
  const [currentWorkspace, setCurrentWorkspace] = useState({ 
    id: 'default-personal', 
    title: 'Personal' 
  });

  // 4. Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  // --- INITIALIZATION ---
  // useEffect with an empty array [] runs exactly ONCE when the app loads
  useEffect(() => {
    if (!isAuthenticated) return;

    const startupSequence = async () => {
      try {
        await initDB();           // Create IndexedDB tables
        SyncManager.init();      // Start background sync listeners
        if (navigator.onLine) {
            try {
                const res = await fetch('http://localhost:5000/api/archives', {
                    headers: { 'Authorization': `Bearer ${AuthService.getToken()}` }
                });
                if (res.ok) {
                    const { data } = await res.json();
                    for (const arc of data.archives) {
                        await IDB.put('archives', {
                            id: arc.vaultId,
                            originalWorkspace: arc.originalWorkspace,
                            encryptedData: arc.encryptedData,
                            archivedAt: arc.createdAt,
                            type: 'AES-GCM'
                        });
                    }
                }
            } catch (err) { console.warn("Offline: Could not fetch cloud archives."); }
        }
        setIsDbReady(true);       // Reveal the UI
        console.log("App Online");
      } catch (error) {
        console.error("Critical System Failure: DB Init", error);
      }
    };

    startupSequence();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
      return <Auth onLogin={() => {
          setIsAuthenticated(true);
          setUserName(localStorage.getItem('agency_user') || 'User'); 
      }} />;
  }

  // Show a loading screen while IndexedDB boots up
  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1A1A1A] text-[#00ff88]">
        Initializing System...
      </div>
    );
  }

  // --- THE MAIN UI RENDER ---
  return (
    <div className="app-container">
      
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentWorkspaceId={currentWorkspace.id}
        setCurrentWorkspace={setCurrentWorkspace}
        openModal={() => setIsModalOpen(true)}
        refreshTrigger={sidebarRefreshTrigger}
      />

      <main className="dashboard">
        <Header 
          username={userName} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
        
        <TaskBoard 
          workspaceId={currentWorkspace.id} 
          workspaceTitle={currentWorkspace.title} 
          searchQuery={searchQuery} 
        />
        
        <Footer workspaceId={currentWorkspace.id} onLogout={() => setIsAuthenticated(false)} />
      </main>

      {/* Conditionally render the modal */}
      {isModalOpen && (
        <WorkspaceModal closeModal={() => setIsModalOpen(false)}
        onWorkspaceAdded={() => setSidebarRefreshTrigger(prev => prev + 1)}
        />
      )}

    </div>
  );
}

export default App;