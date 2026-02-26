import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { FiMoreHorizontal, FiEdit2, FiTrash2, FiCheck, FiX, FiCloudOff } from 'react-icons/fi';
import { ProjectService } from '../services/projectService';
import { TaskService } from '../services/taskService';

interface KanbanBoardProps {
    project: any;
    tasks: any[];
    onTaskMove: (taskId: string, sectionId: string) => void;
    onTaskCreate: (sectionId: string, content: string) => void;
    onTaskUpdate?: () => void; 
}

export default function KanbanBoard({ project, tasks, onTaskMove, onTaskCreate, onTaskUpdate }: KanbanBoardProps) {
    const [sections, setSections] = useState<any[]>([]);
    const [newTaskContent, setNewTaskContent] = useState<Record<string, string>>({});
    const [openPriorityMenuId, setOpenPriorityMenuId] = useState<string | null>(null);
    // UI State
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [localTasks, setLocalTasks] = useState<any[]>([]);
    
    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);
    useEffect(() => {
        if (project?.sections) {
            setSections([...project.sections].sort((a, b) => a.order - b.order));
        }
    }, [project]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        setOpenPriorityMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // ⚡ 1. INSTANT UI UPDATE: Stop the snap-back
        const updatedTasks = Array.from(localTasks);
        const taskIndex = updatedTasks.findIndex(t => (t._id || t.clientId || t.id) === draggableId);
        
        if (taskIndex > -1) {
            // Update the section ID locally right away
            updatedTasks[taskIndex].sectionId = destination.droppableId;
            setLocalTasks(updatedTasks); 
        }

        // ⚡ 2. BACKGROUND SERVER SYNC
        const isCompleted = destination.droppableId.toLowerCase().includes('done');
        await TaskService.moveTask(draggableId, destination.droppableId, destination.index, isCompleted);
        
        // ⚡ 3. PERMANENT REFRESH
        if(onTaskUpdate) onTaskUpdate();
    };

    const handleAddSection = async () => {
        const title = prompt("Section Name:");
        if (!title) return;
        const newSections = [...sections, { id: `sec-${Date.now()}`, title, order: sections.length }];
        setSections(newSections);
        await ProjectService.updateSections(project._id, newSections);
    };

    // ⚡ BULLETPROOF HANDLERS (Using exact strings)
    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await TaskService.deleteTask(taskId);
            setOpenMenuId(null);
            if(onTaskUpdate) onTaskUpdate(); 
        } catch (e) {
            alert("Failed to delete task");
        }
    };

    const startEditing = (taskId: string, content: string) => {
        setEditingTaskId(taskId);
        setEditContent(content);
        setOpenMenuId(null);
    };

    const saveEdit = async (taskId: string) => {
        if (!editContent.trim()) return;
        try {
            await TaskService.updateTask(taskId, { content: editContent });
            setEditingTaskId(null);
            if(onTaskUpdate) onTaskUpdate();
        } catch (e) {
            alert("Failed to update task");
        }
    };

    const handlePriorityChange = async (taskId: string, newPriority: string) => {
        try {
            // Instant UI Update (Optimistic)
            const updatedTasks = [...localTasks];
            const taskIndex = updatedTasks.findIndex(t => (t._id || t.clientId || t.id) === taskId);
            if (taskIndex > -1) {
                updatedTasks[taskIndex].priority = newPriority;
                setLocalTasks(updatedTasks);
            }

            // Tell the server
            await TaskService.updateTask(taskId, { priority: newPriority });
            setOpenPriorityMenuId(null); // Close menu
            if(onTaskUpdate) onTaskUpdate(); // Sync
        } catch (e) {
            console.error("Priority Error:", e);
            alert("Failed to update priority");
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch(priority) {
            case 'High': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20';
            case 'Medium': return 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20';
            case 'Low': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
            default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
            <div className="h-16 px-6 border-b border-gray-200 flex items-center justify-between bg-white">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
                    <p className="text-xs text-gray-500">Board View</p>
                </div>
                <button onClick={handleAddSection} className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-md border border-gray-300 shadow-sm transition-colors">
                    + Add Section
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 flex overflow-x-auto p-6 gap-6 items-start">
                    {sections.map(section => {

                        const sectionTasks = localTasks.filter(t => t.sectionId === section.id).sort((a, b) => a.order - b.order);
                        return (
                            <Droppable key={section.id} droppableId={section.id}>
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="w-80 flex-shrink-0 flex flex-col bg-gray-100/50 rounded-lg border border-gray-200 max-h-full">
                                        <div className="flex items-center justify-between p-3">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-sm text-gray-700">{section.title}</h3>
                                                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{sectionTasks.length}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300">
                                            {sectionTasks.map((task, index) => {
                                                // ⚡ THE MASTER ID: We define it once per task and use it for everything.
                                                const activeTaskId = task._id || task.clientId || task.id;
                                                const isEditing = editingTaskId === activeTaskId;
                                                const isUnsynced = !task._id;

                                                return (
                                                    <Draggable key={activeTaskId} draggableId={activeTaskId} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                                                                className={`bg-white p-3 rounded-lg border shadow-sm group relative transition-all ${
                                                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 rotate-2 z-50' : 'border-gray-200 hover:border-blue-300'
                                                                }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex gap-2">
                                                                        <div className="relative">
                                                                                                                    <button 
                                                                                                                            onClick={(e) => { 
                                                                                                                                e.stopPropagation(); 
                                                                                                                                setOpenPriorityMenuId(openPriorityMenuId === activeTaskId ? null : activeTaskId);
                                                                                                                                setOpenMenuId(null); // Close the edit/delete menu if it's open
                                                                                                                            }}
                                                                                                                            className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase tracking-wider cursor-pointer hover:shadow-md transition-all ${getPriorityStyle(task.priority || 'Medium')}`}
                                                                                                                        >
                                                                                                                            {task.priority || 'Medium'}
                                                                                                                        </button>

                                                                                                                        {/* The Dropdown Menu */}
                                                                                                                        {openPriorityMenuId === activeTaskId && (
                                                                                                                            <div className="absolute left-0 top-6 w-28 bg-white border border-gray-200 shadow-xl rounded-lg z-50 py-1 overflow-hidden">
                                                                                                                                {['High', 'Medium', 'Low'].map(level => (
                                                                                                                                    <button 
                                                                                                                                        key={level}
                                                                                                                                        onClick={(e) => { 
                                                                                                                                            e.stopPropagation(); 
                                                                                                                                            handlePriorityChange(activeTaskId, level); 
                                                                                                                                        }}
                                                                                                                                        className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                                                                                                                                    >
                                                                                                                                        <span className={`px-2 py-0.5 rounded w-full text-center ${getPriorityStyle(level)}`}>
                                                                                                                                            {level}
                                                                                                                                        </span>
                                                                                                                                    </button>
                                                                                                                                ))}
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </div>
                                                                        {isUnsynced && (
                                                                            <span className="flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded border border-orange-200" title="Not synced yet">
                                                                                <FiCloudOff size={10} /> Syncing...
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {!isEditing && (
                                                                        <div className="relative">
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === activeTaskId ? null : activeTaskId); }}
                                                                                className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                                                                            >
                                                                                <FiMoreHorizontal />
                                                                            </button>
                                                                            
                                                                            {openMenuId === activeTaskId && (
                                                                                <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 shadow-xl rounded-lg z-50 py-1 overflow-hidden">
                                                                                    <button onClick={(e) => { e.stopPropagation(); startEditing(activeTaskId, task.content); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2">
                                                                                        <FiEdit2 size={12} /> Edit
                                                                                    </button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(activeTaskId); }} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                                                        <FiTrash2 size={12} /> Delete
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {isEditing ? (
                                                                    <div className="mt-2">
                                                                        <textarea 
                                                                            autoFocus className="w-full text-sm border border-blue-300 rounded p-2 outline-none ring-2 ring-blue-100 min-h-[60px]"
                                                                            value={editContent} onChange={(e) => setEditContent(e.target.value)}
                                                                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(activeTaskId); } }}
                                                                        />
                                                                        <div className="flex gap-2 mt-2 justify-end">
                                                                            <button onClick={() => setEditingTaskId(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><FiX /></button>
                                                                            <button onClick={() => saveEdit(activeTaskId)} className="p-1 text-green-600 hover:bg-green-50 rounded"><FiCheck /></button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-gray-800 leading-relaxed break-words">{task.content}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>

                                        <div className="p-2 border-t border-gray-200 bg-white rounded-b-lg">
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                const val = newTaskContent[section.id];
                                                if(val && val.trim()) {
                                                    setNewTaskContent({ ...newTaskContent, [section.id]: '' });
                                                    onTaskCreate(section.id, val);
                                                }
                                            }}>
                                                <input 
                                                    className="w-full bg-gray-50 hover:bg-white border border-transparent hover:border-gray-300 rounded-md p-2 text-sm text-gray-700 placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="+ Add Task" value={newTaskContent[section.id] || ''} onChange={(e) => setNewTaskContent({ ...newTaskContent, [section.id]: e.target.value })}
                                                />
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
}