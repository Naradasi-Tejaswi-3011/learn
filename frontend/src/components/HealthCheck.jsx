import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HealthCheck = () => {
  const [status, setStatus] = useState('checking');
  const [backendHealth, setBackendHealth] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('/health', { timeout: 3000 });
        setBackendHealth(response.data);
        setStatus('healthy');
      } catch (error) {
        console.error('Health check failed:', error);
        setStatus('unhealthy');
      }
    };

    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg text-sm">
        🔄 Checking connection...
      </div>
    );
  }

  if (status === 'unhealthy') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
        ❌ Backend disconnected
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg text-sm">
      ✅ System healthy
    </div>
  );
};

export default HealthCheck;
