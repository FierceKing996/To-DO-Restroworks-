import { useState } from 'react';
// @ts-ignore
import { WorkspaceService } from '../services/workspaceService.js';

export default function WorkspaceModal({ closeModal, onWorkspaceAdded }: any) {
  const [title, setTitle] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) return;

    // 1. Save to database
    await WorkspaceService.addWorkspace(title.trim());
    
    // 2. Alert the parent to refresh the Sidebar
    onWorkspaceAdded();
    
    // 3. Close the modal
    closeModal();
  };

  // Allow pressing "Enter" to submit
  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') handleCreate();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>New Workspace</h3>
        <input 
          type="text" 
          placeholder="Enter workspace name (e.g. 'Top Secret')" 
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="modal-actions">
          <button onClick={closeModal} className="btn-text">Cancel</button>
          <button onClick={handleCreate} className="btn-primary">Create</button>
        </div>
      </div>
    </div>
  );
}