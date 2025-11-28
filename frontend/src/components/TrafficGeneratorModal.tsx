'use client';

import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import ToastContainer from './ToastContainer';
import { generateBatchTraces } from '@/utils/dummyTraceGenerator';
import { useTrafficLimit } from '@/hooks/useTrafficLimit';

interface TrafficGeneratorModalProps {
  onClose: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  trafficType?: 'normal' | 'error';
}

const PRODUCER_URL = process.env.NEXT_PUBLIC_PRODUCER_URL || 'http://localhost:3005';
const TRACE_COUNT = 100;

export default function TrafficGeneratorModal({ onClose }: TrafficGeneratorModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isLimitReached, remainingRequests, incrementCount, currentCount } = useTrafficLimit();

  const addToast = (
    message: string,
    type: 'success' | 'error',
    trafficType?: 'normal' | 'error',
  ) => {
    const newToast: Toast = {
      id: Date.now().toString() + Math.random().toString(),
      message,
      type,
      trafficType,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const generateTraffic = async (type: 'normal' | 'error') => {
    if (isGenerating) return;

    // Check if limit is reached
    if (isLimitReached) {
      addToast('트래픽 발생 한도에 도달했습니다 (100회)', 'error');
      return;
    }

    // Try to increment count (count button clicks, not traffic amount)
    const canProceed = incrementCount(1);
    if (!canProceed) {
      addToast(`현재 ${currentCount}회 클릭. 100회를 초과할 수 없습니다`, 'error');
      return;
    }

    setIsGenerating(true);
    const isError = type === 'error';

    try {
      // 1000개 더미 트레이스 생성
      const traces = generateBatchTraces(TRACE_COUNT, isError);

      // Producer 서버로 직접 전송
      const response = await fetch(`${PRODUCER_URL}/producer/sdk/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(traces),
      });

      if (response.ok) {
        const message =
          type === 'normal'
            ? `일반 트래픽 ${TRACE_COUNT}건 발생 완료`
            : `에러 트래픽 ${TRACE_COUNT}건 발생 완료`;
        addToast(message, 'success', type);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Traffic generation failed:', error);
      addToast('트래픽 발생 중 오류가 발생했습니다', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">트래픽 발생시키기</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-6">
              버튼을 클릭하면 {TRACE_COUNT}건의 트레이스가 생성되어 Panopticon에서 실시간 트래픽을
              확인할 수 있습니다.
            </p>

            {/* Limit reached warning (100 times reached) */}
            {isLimitReached && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-semibold">
                  트래픽 발생 한도에 도달했습니다 (100회)
                </p>
                <p className="text-xs text-red-600 mt-1">
                  브라우저 데이터를 삭제하면 초기화됩니다
                </p>
              </div>
            )}

            {/* Normal Traffic Button */}
            <button
              onClick={() => generateTraffic('normal')}
              disabled={isGenerating || isLimitReached}
              className="w-full px-6 py-4 bg-white border-2 border-gray-300 text-gray-800 rounded-lg text-base font-semibold hover:border-indigo-400 hover:bg-indigo-50 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span>
                  {isLimitReached ? '한도 초과' : isGenerating ? '발생 중...' : '일반 트래픽 발생'}
                </span>
                <span className="text-sm text-gray-500">{TRACE_COUNT}건</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-left">정상적인 요청을 발생시킵니다</p>
            </button>

            {/* Error Traffic Button */}
            <button
              onClick={() => generateTraffic('error')}
              disabled={isGenerating || isLimitReached}
              className="w-full px-6 py-4 bg-white border-2 border-gray-300 text-gray-800 rounded-lg text-base font-semibold hover:border-red-400 hover:bg-red-50 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span>
                  {isLimitReached ? '한도 초과' : isGenerating ? '발생 중...' : '에러 트래픽 발생'}
                </span>
                <span className="text-sm text-gray-500">{TRACE_COUNT}건</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-left">500 에러를 발생시킵니다</p>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
