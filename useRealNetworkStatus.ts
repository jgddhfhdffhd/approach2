import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export default function useRealNetworkStatus(pollInterval: number = 5000) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const checkConnection = async () => {
    try {
      const net = await Network.getNetworkStateAsync();

      if (!net.isConnected || !net.isInternetReachable) {
        setIsConnected(false);
        return;
      }

      const res = await fetch('https://clients3.google.com/generate_204');
      setIsConnected(res.status === 204);
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const timer = setInterval(checkConnection, pollInterval);
    return () => clearInterval(timer);
  }, []);

  return isConnected;
}
