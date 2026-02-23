// Notice we don't need useState or useEffect here anymore!
// @ts-ignore
import { TaskService } from '../services/taskService.js';
import TaskInput from './TaskInput';
import TaskCard from './TaskCard';
import { useTasks } from '../hooks/useTasks'; // ⚡ Import your new hook

export default function TaskBoard({ workspaceId, workspaceTitle }: any) {
  
  // ⚡ Call the hook! It does all the heavy lifting behind the scenes.
  const { tasks, activeTasks, completedTasks, fetchTasks } = useTasks(workspaceId);

  // --- DRAG AND DROP INTERACTION ---
  const handleDragOver = (e: any) => {
    e.preventDefault(); 
  };

  const handleDrop = async (e: any, newCompletedStatus: boolean) => {
    e.preventDefault();
    const draggedTaskId = e.dataTransfer.getData('taskId');
    if (!draggedTaskId) return;

    const taskToUpdate = tasks.find(t => t.id === draggedTaskId);
    if (taskToUpdate && taskToUpdate.completed !== newCompletedStatus) {
      taskToUpdate.completed = newCompletedStatus;
      await TaskService.updateTask(taskToUpdate);
      fetchTasks(); 
    }
  };

  // --- UI RENDER ---
  return (
    <div className="kanban-board">
      
      {/* ACTIVE COLUMN */}
      <section className="column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, false)}>
        <div className="column-header">
          <h2>Active Missions</h2>
          <span className="count-badge">{activeTasks.length}</span>
        </div>
        
        <TaskInput workspaceId={workspaceId} onTaskAdded={fetchTasks} />

        <ul className="task-list">
          {activeTasks.length > 0 ? (
            activeTasks.map(task => (
              <TaskCard key={task.id} task={task} workspaceId={workspaceId} onTaskChange={fetchTasks} />
            ))
          ) : (
            <div style={{ color: '#aaa', fontSize: '0.9rem', padding: '10px', textAlign: 'center' }}>No active missions.</div>
          )}
        </ul>
      </section>

      {/* COMPLETED COLUMN */}
      <section className="column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, true)}>
        <div className="column-header">
          <h2>Completed</h2>
          <span className="count-badge">{completedTasks.length}</span>
        </div>
        
        <ul className="task-list completed-zone" style={{ minHeight: '200px' }}>
          {completedTasks.length > 0 ? (
            completedTasks.map(task => (
              <TaskCard key={task.id} task={task} workspaceId={workspaceId} onTaskChange={fetchTasks} />
            ))
          ) : (
            <div style={{ color: '#aaa', fontSize: '0.9rem', padding: '10px', textAlign: 'center' }}>Empty archives.</div>
          )}
        </ul>
      </section>

    </div>
  );
}