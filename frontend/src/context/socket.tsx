import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { AppSocket, ClientToServerEvents } from '../types/socket';

interface SocketContextType {
  socket: AppSocket | null;
  isConnected: boolean;
  emitEvent: <K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emitEvent: () => {
    throw new Error("Socket context not initalised")
  }
});

const SOCKET_SERVER_URL = "http://localhost:8080"

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const emitEvent: SocketContextType['emitEvent'] = (event, ...args) => {
    if (!socket) {
      console.warn('Socket not connected')
      return;
    }
    socket.emit(event, ...args)
  }
  
  useEffect(() => {
    // Initialize the socket connection
    const socketInstance: AppSocket = io(SOCKET_SERVER_URL, { // Replace with your server URL
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    // Connection events
    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.off('connect')
      socketInstance.off('disconnect')
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, emitEvent }}>
      {children}
    </SocketContext.Provider>
  );
};