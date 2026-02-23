import { useState, useEffect } from 'react';
// @ts-ignore
import { TaskService } from '../services/taskService.js';

export function useTasks(workspaceId: string) {
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchTasks = async () => {
    if (!workspaceId) return;
    const data = await TaskService.getTasks(workspaceId);
    setTasks(data);
  };

  // Run on mount, when workspace changes, or when background sync happens
  useEffect(() => {
    fetchTasks();
    const handleSync = () => fetchTasks();
    window.addEventListener('task-synced', handleSync);
    
    return () => {
      window.removeEventListener('task-synced', handleSync);
    };
  }, [workspaceId]);

  // Pre-filter the data for the UI
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Return the data and the refresh function to the component
  return {
    tasks,
    activeTasks,
    completedTasks,
    fetchTasks
  };
}