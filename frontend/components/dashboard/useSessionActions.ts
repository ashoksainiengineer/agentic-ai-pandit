'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { APIClient } from '@/lib/api-client';
import { logger } from '@/lib/secure-logger';

interface UseSessionActionsOptions {
  sessionId: string;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function useSessionActions({ sessionId, onDelete, onDuplicate }: UseSessionActionsOptions) {
  const router = useRouter();
  const { getToken } = useAuth();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState(false);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = await getToken();
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onDelete?.(sessionId);
        setShowDeleteConfirm(false);
      } else {
        setDeleteError(data.error || data.details || 'Failed to delete session');
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Network error');
    } finally {
      setIsDeleting(false);
    }
  }, [getToken, sessionId, onDelete]);

  const handleCloneClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCloning(true);

    try {
      const data = await APIClient.post(`/api/sessions/${sessionId}/clone`, {}, getToken);

      if (data.success && data.data?.id) {
        onDuplicate?.(data.data.id);

        const token = await getToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        let isReady = false;
        for (let attempt = 0; attempt < 20; attempt += 1) {
          let readinessRes: Response;
          try {
            readinessRes = await fetch(`/api/sessions/${data.data.id}`, {
              method: 'GET',
              headers,
              cache: 'no-store',
            });
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 300));
            continue;
          }

          if (readinessRes.ok) {
            const readinessData = await readinessRes.json();
            if (readinessData?.success) {
              isReady = true;
              break;
            }
          } else if (readinessRes.status === 401 || readinessRes.status === 403) {
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (!isReady) {
          alert('Session duplicated, but it is still syncing. Please retry in a few seconds.');
          return;
        }

        router.push(`/rectify/${data.data.id}/edit`);
      } else {
        logger.error('Failed to clone session', new Error(data.error || 'Failed to clone session'));
        alert('Failed to clone session: ' + (data.error || 'Unknown error'));
      }
    } catch (error: unknown) {
      logger.error('Clone error', error);
      alert('Clone failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCloning(false);
    }
  }, [getToken, onDuplicate, router, sessionId]);

  return {
    showDeleteConfirm,
    isDeleting,
    deleteError,
    isCloning,
    handleDeleteClick,
    handleCloseDelete,
    handleConfirmDelete,
    handleCloneClick,
  };
}
