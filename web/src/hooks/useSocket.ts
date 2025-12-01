'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSocket(
  userId: string = 'user-1',
  onEvent?: (event: string, data: any) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false,
    });

    socket.on('connect', () => {
      socket.emit('join:user', userId);
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', () => {
      // Handled by reconnection logic
    });

    socket.on('error', () => {
      // Handled by reconnection logic
    });

    const handleJobsCreated = (data: any) => {
      onEventRef.current?.('jobs:created', data);
    };

    const handleJobsProgress = (data: any) => {
      onEventRef.current?.('jobs:progress', data);
    };

    const handleJobsItem = (data: any) => {
      onEventRef.current?.('jobs:item', data);
    };

    const handleJobsCompleted = (data: any) => {
      onEventRef.current?.('jobs:completed', data);
    };

    const handleJobsFailed = (data: any) => {
      onEventRef.current?.('jobs:failed', data);
    };

    const handleJobsCanceled = (data: any) => {
      onEventRef.current?.('jobs:canceled', data);
    };

    socket.on('jobs:created', handleJobsCreated);
    socket.on('jobs:progress', handleJobsProgress);
    socket.on('jobs:item', handleJobsItem);
    socket.on('jobs:completed', handleJobsCompleted);
    socket.on('jobs:failed', handleJobsFailed);
    socket.on('jobs:canceled', handleJobsCanceled);

    socketRef.current = socket;

    return () => {
      socket.off('jobs:created', handleJobsCreated);
      socket.off('jobs:progress', handleJobsProgress);
      socket.off('jobs:item', handleJobsItem);
      socket.off('jobs:completed', handleJobsCompleted);
      socket.off('jobs:failed', handleJobsFailed);
      socket.off('jobs:canceled', handleJobsCanceled);
      socket.disconnect();
    };
  }, [userId]);

  return socketRef.current;
}

