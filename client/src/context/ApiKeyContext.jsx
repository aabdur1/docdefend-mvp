import { createContext, useContext, useState, useEffect } from 'react';

const ApiKeyContext = createContext();

export function ApiKeyProvider({ children }) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('anthropic_api_key');
    if (saved) setApiKey(saved);
  }, []);

  const updateApiKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('anthropic_api_key', key);
    } else {
      localStorage.removeItem('anthropic_api_key');
    }
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey: updateApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (!context) throw new Error('useApiKey must be used within ApiKeyProvider');
  return context;
}

export function getAuthHeaders(apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  return headers;
}
