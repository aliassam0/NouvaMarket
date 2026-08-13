import { useState, useEffect } from 'react';

export type NetworkSpeed = 'online' | '3g_slow' | 'offline';

interface NetworkState {
  isOnline: boolean;
  networkSpeed: NetworkSpeed;
  toggleSimulatedStatus: (speed: NetworkSpeed) => void;
}

let simulatedStatus: NetworkSpeed = 'online';
const listeners = new Set<(status: NetworkSpeed) => void>();

export function setSimulatedNetworkStatus(status: NetworkSpeed) {
  simulatedStatus = status;
  listeners.forEach((cb) => cb(status));
}

export function useNetworkStatus(): NetworkState {
  const [status, setStatus] = useState<NetworkSpeed>(simulatedStatus);

  useEffect(() => {
    const handleChange = (newStatus: NetworkSpeed) => {
      setStatus(newStatus);
    };

    listeners.add(handleChange);

    const handleBrowserOnline = () => {
      if (simulatedStatus === 'offline') return;
      setSimulatedNetworkStatus('online');
    };

    const handleBrowserOffline = () => {
      setSimulatedNetworkStatus('offline');
    };

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);

    return () => {
      listeners.delete(handleChange);
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
    };
  }, []);

  return {
    isOnline: status !== 'offline',
    networkSpeed: status,
    toggleSimulatedStatus: (speed: NetworkSpeed) => {
      setSimulatedNetworkStatus(speed);
    },
  };
}
