import { useState, useEffect } from 'react';
// @ts-ignore
import { WorkspaceService } from '../services/workspaceService.js';

export function useWorkspaces(refreshTrigger: number) {
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const data = await WorkspaceService.getWorkspaces();
      setWorkspaces(data);
    };
    fetchWorkspaces();
  }, [refreshTrigger]);

  return { workspaces };
}