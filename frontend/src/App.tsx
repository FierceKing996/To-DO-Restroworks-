import { useState, useEffect } from 'react';

// Import engines
import { initDB } from './db/dbconfig.js';
import { SyncManager } from './services/syncManager.js';
import { AuthService } from './services/authService.js';
import { IDB } from './db/idbHelper.js';
import { TaskService } from './services/taskService'; // Ensure this is imported!
import Auth from './components/Auth';

// Import UI Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import WorkspaceModal from './components/WorkspaceModal';
import AdminDashboard from './components/AdminDashboard';
import KanbanBoard from './components/KanbanBoard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(AuthService.isAuthenticated());
  const [userName, setUserName] = useState(localStorage.getItem('agency_user') || 'User');
  
  // ⚡ KANBAN STATE
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  
  const [user, setUser] = useState<any>(() => {
    try {
      // Use the safe getter we fixed earlier
      return AuthService.getUser() || {};
    } catch (e) {
      return {};
    }
  });
  
  const [isDbReady, setIsDbReady] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [currentWorkspace, setCurrentWorkspace] = useState({ 
    id: 'default-personal', 
    title: 'Personal' 
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  // --- ⚡ 1. DEFINE LOAD TASKS (The Missing Piece) ---
  const loadTasks = async () => {
      if (!currentProject) return;
      try {
          // Fetch all tasks for this workspace
          const allTasks = await TaskService.getTasks(currentWorkspace.id);
          
          // Filter client-side for the current project
          // (Later we can optimize this to fetch only project tasks from backend)
          const projectTasks = allTasks.filter((t: any) => t.projectId === currentProject._id);
          setTasks(projectTasks);
      } catch (err) {
          console.error("Failed to load tasks", err);
      }
  };

  // --- ⚡ 2. USE EFFECT TO LOAD ---
  useEffect(() => {
    if (currentProject) {
        loadTasks();
    }

    // ⚡ NEW: Auto-refresh when internet comes back
    const handleOnline = () => {
        console.log("Back online! Refreshing tasks...");
        setTimeout(() => loadTasks(), 2000); // Wait 2s for SyncManager to finish uploading
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentProject, currentWorkspace]); // Reload if project OR workspace changes

  // --- ⚡ 3. HANDLE CREATE TASK ---
  const handleTaskCreate = async (sectionId: string, content: string) => {
      const tempId = `temp-${Date.now()}`;
      const newTask = {
          clientId: tempId,
          content,
          sectionId,
          projectId: currentProject._id,
          workspaceId: currentWorkspace.id,
          priority: 'Medium',
          order: tasks.length,
          completed: false
      };
      
      // Optimistic Update (Show it immediately)
      setTasks(prev => [...prev, newTask]);
      
      try {
        // Sync to Backend
        await TaskService.addTask(newTask);
        // Refresh to get the real ID from server
        loadTasks(); 
      } catch (err) {
        console.error("Failed to create task", err);
      }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const startupSequence = async () => {
      try {
        await initDB();           
        SyncManager.init();      
        
        // Try to fetch archives if online
        if (navigator.onLine) {
            try {
                const res = await fetch('http://localhost:5000/api/archives', {
                    headers: { 'Authorization': `Bearer ${AuthService.getToken()}` }
                });
                if (res.ok) {
                    const { data } = await res.json();
                    for (const arc of data.archives) {
                        await IDB.put('archives', { ...arc, type: 'AES-GCM' });
                    }
                }
            } catch (err) { console.warn("Offline: Could not fetch cloud archives."); }
        }
        setIsDbReady(true);      
        console.log("App Online");
      } catch (error) {
        console.error("Critical System Failure: DB Init", error);
      }
    };

    startupSequence();
  }, [isAuthenticated]);

  // --- AUTH SCREENS ---
  if (!isAuthenticated) {
      return <Auth onLogin={() => {
          // Just read what AuthService saved. Do NOT overwrite.
          const freshUser = AuthService.getUser();
          setUser(freshUser); 
          setUserName(freshUser?.username || 'User');
          setIsAuthenticated(true);
      }} />;
  }

  if (isAuthenticated && !user?.role) {
      return (
        <div className="flex items-center justify-center h-screen bg-[#111] text-gray-400">
            Verifying Access...
        </div>
      );
  }

  if (user?.role === 'superadmin') {
      return <AdminDashboard onLogout={() => {
          AuthService.logout();
          setIsAuthenticated(false);
          setUser({});
      }} />;
  }

  if (!isDbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1A1A1A] text-[#00ff88]">
        Initializing System...
      </div>
    );
  }
  const filteredTasks = tasks.filter(task => 
      task.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // --- MAIN RENDER ---
  return (
    // 1. Change app-container to have a white background and full height
    <div className="app-container flex h-screen bg-white"> 
      
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentWorkspaceId={currentWorkspace.id}
        setCurrentWorkspace={setCurrentWorkspace}
        openModal={() => setIsModalOpen(true)}
        refreshTrigger={sidebarRefreshTrigger}
        currentProjectId={currentProject?._id}
        onProjectSelect={setCurrentProject}
      />

      {/* 2. Change dashboard to have a light gray background (bg-gray-50) */}
      <main className="dashboard flex-1 flex flex-col overflow-hidden bg-gray-50">
        <Header 
          username={userName} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
        
        {/* SWITCH: Show Kanban OR Empty State */}
        {currentProject ? (
             <KanbanBoard 
                project={currentProject}
                tasks={filteredTasks}
                onTaskMove={(id, section) => loadTasks()} 
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={loadTasks}
             />
         ) : (
             // 3. Updated Empty State (Light Theme)
             <div className="flex h-full items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mb-4">
                        {/* Professional Icon for Empty State */}
                        <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-1">No Project Selected</p>
                    <p className="text-sm text-gray-500">Select a project from the sidebar to view its board.</p>
                </div>
             </div>
         )}
         
        {/* 4. Removed Footer to match the clean reference image */}
        {/* <Footer workspaceId={currentWorkspace.id} onLogout={() => setIsAuthenticated(false)} /> */}
      </main>

      {isModalOpen && (
        <WorkspaceModal closeModal={() => setIsModalOpen(false)}
        onWorkspaceAdded={() => setSidebarRefreshTrigger(prev => prev + 1)}
        />
      )}

    </div>
  );
}

export default App;