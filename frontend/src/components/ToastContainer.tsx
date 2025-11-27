'use client';

import { useEffect } from 'react';
import * as React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  trafficType?: 'normal' | 'error';
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  duration?: number;
}

export default function ToastContainer({ toasts, onClose, duration = 3000 }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => onClose(toast.id)}
          duration={duration}
          index={index}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
  duration: number;
  index: number;
}

function ToastItem({ toast, onClose, duration, index }: ToastItemProps) {
  const [isExiting, setIsExiting] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(true);

  useEffect(() => {
    // 입장 애니메이션
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 50);

    // 퇴장 애니메이션
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 300); // 애니메이션 시간과 일치
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`transition-all duration-300 ${
        isExiting
          ? 'opacity-0 translate-x-full'
          : isEntering
          ? 'opacity-0 translate-x-full'
          : 'opacity-100 translate-x-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.trafficType === 'normal'
            ? 'bg-blue-50 border border-blue-200'
            : toast.trafficType === 'error'
            ? 'bg-orange-50 border border-orange-200'
            : toast.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        {toast.trafficType === 'normal' ? (
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
        ) : toast.trafficType === 'error' ? (
          <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
        ) : toast.type === 'success' ? (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        )}
        <p
          className={`text-sm font-medium ${
            toast.trafficType === 'normal'
              ? 'text-blue-800'
              : toast.trafficType === 'error'
              ? 'text-orange-800'
              : toast.type === 'success'
              ? 'text-green-800'
              : 'text-red-800'
          }`}
        >
          {toast.message}
        </p>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              onClose();
            }, 300);
          }}
          className={`ml-2 ${
            toast.trafficType === 'normal'
              ? 'text-blue-600 hover:text-blue-800'
              : toast.trafficType === 'error'
              ? 'text-orange-600 hover:text-orange-800'
              : toast.type === 'success'
              ? 'text-green-600 hover:text-green-800'
              : 'text-red-600 hover:text-red-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
