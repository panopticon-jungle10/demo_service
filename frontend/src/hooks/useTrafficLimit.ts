'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'traffic_generator_usage_count';
const MAX_REQUESTS = 100;

interface TrafficUsageData {
  count: number;
  version: number;
  lastUpdated: string;
}

interface UseTrafficLimitReturn {
  currentCount: number;
  remainingRequests: number;
  isLimitReached: boolean;
  isStorageAvailable: boolean;
  incrementCount: (amount: number) => boolean;
  getWarningMessage: () => string | null;
}

function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function getInitialData(): TrafficUsageData {
  return {
    count: 0,
    version: 1,
    lastUpdated: new Date().toISOString(),
  };
}

function validateStorageData(data: any): TrafficUsageData | null {
  if (!data || typeof data !== 'object') return null;
  if (typeof data.count !== 'number' || data.count < 0 || data.count > 1000) return null;
  if (typeof data.version !== 'number') return null;
  return data as TrafficUsageData;
}

function readUsageData(): TrafficUsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialData();

    const parsed = JSON.parse(raw);
    const validated = validateStorageData(parsed);

    if (!validated) {
      console.warn('Invalid traffic usage data detected, resetting');
      return getInitialData();
    }

    // Sanitize: if count > MAX_REQUESTS, clamp to MAX_REQUESTS
    if (validated.count > MAX_REQUESTS) {
      validated.count = MAX_REQUESTS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    }

    return validated;
  } catch (error) {
    console.error('Failed to read usage data:', error);
    return getInitialData();
  }
}

function writeUsageData(data: TrafficUsageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to write usage data:', error);
  }
}

export function useTrafficLimit(): UseTrafficLimitReturn {
  const [currentCount, setCurrentCount] = useState(0);
  const [isStorageAvailable, setIsStorageAvailable] = useState(true);

  // Load on mount
  useEffect(() => {
    const available = isLocalStorageAvailable();
    setIsStorageAvailable(available);

    if (available) {
      const data = readUsageData();
      setCurrentCount(data.count);
    } else {
      console.warn('localStorage unavailable - rate limiting disabled');
    }
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!isStorageAvailable) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const data = readUsageData();
        setCurrentCount(data.count);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isStorageAvailable]);

  const incrementCount = (amount: number): boolean => {
    if (!isStorageAvailable) {
      console.warn('localStorage unavailable, rate limiting disabled');
      return true; // Fail-open: allow usage but warn
    }

    const data = readUsageData();
    const newCount = data.count + amount;

    if (newCount > MAX_REQUESTS) {
      return false; // Would exceed limit
    }

    // Update localStorage
    const updated: TrafficUsageData = {
      count: newCount,
      version: 1,
      lastUpdated: new Date().toISOString(),
    };

    writeUsageData(updated);
    setCurrentCount(newCount);
    return true;
  };

  const getWarningMessage = (): string | null => {
    if (!isStorageAvailable) {
      return '브라우저 저장소를 사용할 수 없어 제한을 적용할 수 없습니다';
    }

    if (currentCount >= MAX_REQUESTS) {
      return '트래픽 발생 한도에 도달했습니다 (100회)';
    }

    if (currentCount > 0) {
      return `남은 트래픽 발생 횟수: ${MAX_REQUESTS - currentCount}회`;
    }

    return null;
  };

  const remainingRequests = Math.max(0, MAX_REQUESTS - currentCount);
  const isLimitReached = currentCount >= MAX_REQUESTS;

  return {
    currentCount,
    remainingRequests,
    isLimitReached,
    isStorageAvailable,
    incrementCount,
    getWarningMessage,
  };
}
