import { useState, useEffect } from 'react';
import { FiMenu, FiChevronRight, FiChevronDown, FiPlus, FiLayout, FiBriefcase } from 'react-icons/fi';
import { ProjectService } from '../services/projectService';
import { useWorkspaces } from '../hooks/useWorkspaces';

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    currentWorkspaceId: string;
    setCurrentWorkspace: (ws: { id: string; title: string }) => void;
    currentProjectId: string | null;
    onProjectSelect: (project: any) => void;
    openModal: () => void;
    refreshTrigger: number;
}

export default function Sidebar({
    isCollapsed,
    toggleSidebar,
    currentWorkspaceId,
    setCurrentWorkspace,
    currentProjectId,
    onProjectSelect,
    openModal,
    refreshTrigger
}: SidebarProps) {
    const { workspaces } = useWorkspaces(refreshTrigger);
    const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(null);
    const [projectsMap, setProjectsMap] = useState<Record<string, any[]>>({});
    const [loadingProjects, setLoadingProjects] = useState<string | null>(null);

    // Fetch projects when a workspace is expanded
    const toggleWorkspace = async (wsId: string) => {
        if (expandedWorkspace === wsId) {
            setExpandedWorkspace(null);
            return;
        }
        setExpandedWorkspace(wsId);
        if (!projectsMap[wsId]) {
            setLoadingProjects(wsId);
            try {
                const projs = await ProjectService.getProjects(wsId);
                setProjectsMap(prev => ({ ...prev, [wsId]: projs }));
            } catch (err) {
                console.error(`Failed to load projects for ${wsId}`, err);
            } finally {
                setLoadingProjects(null);
            }
        }
    };

    const handleCreateProject = async (wsId: string) => {
        const title = prompt("Enter Project Name:");
        if (!title) return;
        try {
            const newProj = await ProjectService.createProject(title, wsId);
            setProjectsMap(prev => ({ ...prev, [wsId]: [...(prev[wsId] || []), newProj] }));
            onProjectSelect(newProj);
        } catch (err) { alert("Failed to create project"); }
    };

    return (
        <aside className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen flex-shrink-0 ${isCollapsed ? 'w-16' : 'w-64'}`}>
            
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white">
                            <FiLayout size={14} />
                        </div>
                        <span className="font-bold text-gray-900 tracking-tight">AgencyOS</span>
                    </div>
                )}
                <button onClick={toggleSidebar} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                    <FiMenu size={20} />
                </button>
            </div>

            {/* Workspaces List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-1">
                {!isCollapsed && <div className="px-4 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Workspaces</div>}
                
                {workspaces.map((ws: any) => (
                    <div key={ws.id}>
                        {/* Workspace Row */}
                        <div 
                            className={`group flex items-center px-3 py-2 mx-2 rounded-md cursor-pointer transition-colors ${
                                currentWorkspaceId === ws.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onClick={() => {
                                setCurrentWorkspace({ id: ws.id, title: ws.title });
                                toggleWorkspace(ws.id);
                            }}
                        >
                            {!isCollapsed && (
                                <span className={`mr-2 transition-transform ${currentWorkspaceId === ws.id ? 'text-blue-500' : 'text-gray-400'}`}>
                                    {expandedWorkspace === ws.id ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                                </span>
                            )}
                            
                            <div className={isCollapsed ? "mx-auto" : "mr-3"}>
                                  <FiBriefcase size={18} />
                            </div>
                            
                            {!isCollapsed && <span className="text-sm truncate flex-1">{ws.title}</span>}
                        </div>

                        {/* Nested Projects */}
                        {!isCollapsed && expandedWorkspace === ws.id && (
                            <div className="mt-1 space-y-1">
                                {loadingProjects === ws.id && <div className="px-10 py-1 text-xs text-gray-400">Loading...</div>}
                                
                                {projectsMap[ws.id]?.map(proj => (
                                    <div 
                                        key={proj._id}
                                        onClick={() => onProjectSelect(proj)}
                                        className={`ml-6 pl-8 pr-3 py-1.5 flex items-center gap-2 text-sm cursor-pointer rounded-md transition-colors ${
                                            currentProjectId === proj._id 
                                                ? 'bg-blue-100 text-blue-700 font-medium' 
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                                        <span className="truncate">{proj.title}</span>
                                    </div>
                                ))}

                                {/* Add Project Button */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleCreateProject(ws.id); }}
                                    className="ml-6 pl-8 py-1.5 text-xs text-gray-400 hover:text-blue-600 flex items-center gap-2 w-full text-left transition-colors"
                                >
                                    <FiPlus size={14} /> New Project
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

             {/* Add Workspace Bottom Button */}
             <div className="p-4 border-t border-gray-200">
                <button 
                    onClick={openModal}
                    className={`flex items-center justify-center gap-2 py-2 w-full border rounded-md text-sm font-medium transition-colors ${
                        isCollapsed ? 'border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                >
                    <FiPlus size={16} /> {!isCollapsed && "Add Workspace"}
                </button>
            </div>
        </aside>
    );
}