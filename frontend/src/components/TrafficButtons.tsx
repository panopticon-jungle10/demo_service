'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TrafficButtons() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTraffic = async (type: 'normal' | 'error') => {
    if (isGenerating) return;

    setIsGenerating(true);
    const endpoint = `${API_URL}/traffic/${type}`;

    try {
      // 100개의 요청을 병렬로 발생
      const requests = Array.from({ length: 100 }, () =>
        fetch(endpoint).catch(() => null) // 개별 에러는 무시
      );

      const results = await Promise.all(requests);
      const successCount = results.filter((r) => r?.ok).length;

      const message =
        type === 'normal'
          ? `일반 트래픽 ${successCount}건 발생 완료!`
          : `에러 트래픽 100건 발생 완료!`;

      alert(message);
    } catch (error) {
      console.error('Traffic generation failed:', error);
      alert('트래픽 발생 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => generateTraffic('normal')}
        disabled={isGenerating}
        className="hidden sm:block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
        title="100건의 정상 요청을 동시에 발생시킵니다"
      >
        {isGenerating ? '발생 중...' : '일반 트래픽 발생'}
      </button>
      <button
        onClick={() => generateTraffic('error')}
        disabled={isGenerating}
        className="hidden sm:block px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
        title="100건의 에러 요청을 동시에 발생시킵니다"
      >
        {isGenerating ? '발생 중...' : '에러 트래픽 발생'}
      </button>
    </>
  );
}
