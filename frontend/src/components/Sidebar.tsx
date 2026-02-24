import { useWorkspaces } from '../hooks/useWorkspaces';
import { useEffect } from 'react';
import { FiMenu, FiFolder, FiPlus, FiWifi, FiWifiOff } from 'react-icons/fi';
export default function Sidebar({ 
  isCollapsed, 
  toggleSidebar, 
  currentWorkspaceId, 
  setCurrentWorkspace, 
  openModal,
  refreshTrigger 
}: any) {
  
  const { workspaces } = useWorkspaces(refreshTrigger);
  useEffect(() => {
    if (workspaces.length > 0) {
      const isValid = workspaces.some((ws: any) => ws.id === currentWorkspaceId);
      
      if (!isValid) {
        setCurrentWorkspace({ id: workspaces[0].id, title: workspaces[0].title });
      }
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspace]);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <button onClick={toggleSidebar} className="icon-btn" style={{ 
            background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
            display: 'flex', justifyContent: 'center', alignItems: 'center' 
        }}>
            <FiMenu size={24} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-label" style={{ padding: '10px 20px', fontSize: '0.75rem', color: '#888', letterSpacing: '1px' }}>
          {!isCollapsed && 'WORKSPACES'}
        </div>
        <ul id="workspace-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {workspaces.map((ws: any) => (
            <li 
              key={ws.id}
              className={`nav-item ${ws.id === currentWorkspaceId ? 'active' : ''}`}
              onClick={() => setCurrentWorkspace({ id: ws.id, title: ws.title })}
              style={{ 
                padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                backgroundColor: ws.id === currentWorkspaceId ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              <span className="nav-icon" style={{ display: 'flex' }}><FiFolder size={18} /></span>
              {!isCollapsed && <span className="nav-text">{ws.title}</span>}
            </li>
          ))}
        </ul>
      </nav>

      {/* ⚡ THE UPGRADED BOTTOM SECTION */}
      <div className="sidebar-footer-actions mt-auto" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        
        {/* The New Workspace Button */}
        <button 
          onClick={openModal} 
          title="Create New Workspace"
          className="create-workspace-btn"
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            backgroundColor: '#2a2b36', /* Sleek dark slate from your reference */
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0' : '0 16px',
            gap: '12px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#343542'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2b36'}
        >
          <span style={{ display: 'flex', opacity: 0.8 }}>
            <FiPlus size={20} />
          </span>
          {!isCollapsed && <span>Create Workspace</span>}
        </button>

        {/* The Connection Status */}
        <div 
          className="status-indicator" 
          title="System Status"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '0.8rem' }}
        >
          {navigator.onLine ? 
            <FiWifi size={16} color="#10b981" /> : 
            <FiWifiOff size={16} color="#ef4444" />
          }
          {!isCollapsed && <span>{navigator.onLine ? 'System Online' : 'Offline Mode'}</span>}
        </div>

      </div>
    </aside>
  );
}