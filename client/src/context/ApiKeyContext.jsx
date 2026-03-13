import { createContext, useContext, useState, useEffect } from 'react';

const ApiKeyContext = createContext();

const API_KEY_STORAGE_KEY = 'anthropic_api_key';
const API_KEY_TIMESTAMP_KEY = 'anthropic_api_key_ts';
const API_KEY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function ApiKeyProvider({ children }) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
    const timestamp = localStorage.getItem(API_KEY_TIMESTAMP_KEY);

    if (saved) {
      // Clear if older than 7 days or missing timestamp
      if (!timestamp || Date.now() - Number(timestamp) > API_KEY_MAX_AGE_MS) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        localStorage.removeItem(API_KEY_TIMESTAMP_KEY);
        return;
      }
      setApiKey(saved);
    }
  }, []);

  const updateApiKey = (key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
      localStorage.setItem(API_KEY_TIMESTAMP_KEY, String(Date.now()));
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      localStorage.removeItem(API_KEY_TIMESTAMP_KEY);
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
