import { useState } from 'react';
// @ts-ignore
import { TaskService } from '../services/taskService.js';

export default function TaskInput({ workspaceId, onTaskAdded }: any) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault(); // Prevents the page from reloading
    if (!content.trim()) return;

    // 1. Save to database
    await TaskService.addTask({
      content: content.trim(),
      workspaceId,
      completed: false
    });

    // 2. Clear input & tell the parent board to refresh
    setContent('');
    onTaskAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="input-card">
      <input 
        type="text" 
        id="task-input" 
        placeholder="New objective..." 
        autoComplete="off"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button type="submit" className="btn-add">+</button>
    </form>
  );
}