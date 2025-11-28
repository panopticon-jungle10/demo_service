'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api';
import { X, Loader2 } from 'lucide-react';

interface ChatbotModalProps {
  onClose: () => void;
}

type Step = 'question' | 'ai_loading' | 'ai_answer' | 'post_form' | 'post_submitted';

export default function ChatbotModal({ onClose }: ChatbotModalProps) {
  const [conversationId] = useState(uuidv4());
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);
  const [traceContext, setTraceContext] = useState<{ traceId?: string; spanId?: string }>({});

  // AI 요청 처리
  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;
    setAiLoading(true);
    setStep('ai_loading');

    try {
      const response = await api.chatAsk({
        conversationId,
        originalQuestion: question,
      });

      // Trace context 저장
      if (response._traceContext) {
        setTraceContext(response._traceContext);
      }

      setAiAnswer(response.aiAnswer);

      // AI 답변이 완료되어도 step은 변경하지 않음
      // - ai_loading: 사용자가 "확인" 버튼을 눌러야 다음 단계로 진행
      // - post_form: 글작성 폼 유지, AI 답변만 업데이트
      // - post_submitted: 글작성 완료 상태 유지
    } catch (error: any) {
      console.error('Chat error:', error);
      setAiAnswer('챗봇: 오류입니다. AI 서비스가 현재 이용 불가능합니다.');
      // 에러가 발생해도 step은 변경하지 않음
    } finally {
      setAiLoading(false);
    }
  };

  // 글작성 처리
  const handleFinalSubmit = async () => {
    setPostLoading(true);

    try {
      const response = await api.chatPost(
        {
          conversationId,
          originalQuestion: question,
          postData: {
            email: email || undefined,
          },
        },
        traceContext,
      );

      setPostResult(response.reply);
      setStep('post_submitted');

      // AI 답변이 아직 로딩 중이면 메시지 표시
      if (aiLoading) {
        alert('글이 생성되었습니다. AI 답변이 완료되면 자동으로 댓글로 등록됩니다.');
      } else {
        alert(response.reply);
        onClose();
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('글 작성 중 오류가 발생했습니다');
    } finally {
      setPostLoading(false);
    }
  };

  // 글작성이 먼저 완료되고 AI가 나중에 완료된 경우 모달 닫기
  useEffect(() => {
    if (step === 'post_submitted' && !aiLoading && aiAnswer) {
      setTimeout(() => {
        alert(`${postResult}\nAI 답변이 댓글로 등록되었습니다.`);
        onClose();
      }, 500);
    }
  }, [step, aiLoading, aiAnswer, postResult, onClose]);

  return (
    <div className="fixed bottom-4 sm:bottom-24 right-4 sm:right-8 z-50 w-full sm:w-[400px] max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] sm:h-[600px]">
        <div className="flex justify-between items-center px-6 py-4 bg-indigo-600 text-white">
          <h2 className="text-xl font-bold">AI 챗봇</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'question' && (
            <div>
              <label className="block mb-3 font-semibold text-gray-700 text-sm">
                질문을 입력하세요
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg mb-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={5}
                placeholder="판옵티콘 서비스에 대해 궁금한 점을 질문해주세요"
              />
              <button
                onClick={handleSubmitQuestion}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold transition-colors text-sm"
              >
                {loading ? '처리 중...' : '질문하기'}
              </button>
            </div>
          )}

          {step === 'ai_loading' && (
            <div>
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                  <p className="text-gray-700 font-semibold mb-2">
                    AI가 답변을 생성하고 있습니다...
                  </p>
                  <p className="text-sm text-gray-500 mb-8">잠시만 기다려 주세요</p>
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-4">
                  <p className="whitespace-pre-wrap text-gray-900 leading-relaxed text-sm">
                    {aiAnswer}
                  </p>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-base font-semibold mb-4 text-gray-900">
                  글을 작성하시겠습니까?
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('post_form')}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-semibold transition-colors text-sm"
                  >
                    확인
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-semibold transition-colors text-sm"
                  >
                    나가기
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'ai_answer' && (
            <div>
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-4">
                <p className="whitespace-pre-wrap text-gray-900 leading-relaxed text-sm">
                  {aiAnswer}
                </p>
              </div>

              <h3 className="text-base font-semibold mb-4 text-gray-900">글로 작성하시겠습니까?</h3>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('post_form')}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-semibold transition-colors text-sm"
                >
                  확인
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-semibold transition-colors text-sm"
                >
                  나가기
                </button>
              </div>
            </div>
          )}

          {step === 'post_form' && (
            <div>
              {aiLoading && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
                  <p className="text-sm text-yellow-800">AI 답변이 생성되는 중입니다...</p>
                </div>
              )}

              {aiAnswer && !aiLoading && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-4">
                  <p className="whitespace-pre-wrap text-gray-900 leading-relaxed text-sm">
                    {aiAnswer}
                  </p>
                </div>
              )}

              <h3 className="text-base font-semibold mb-4 text-gray-900">글로 작성하기</h3>

              <div className="space-y-3">
                <div>
                  <label className="block mb-1.5 font-semibold text-gray-700 text-sm">
                    이메일 (선택)
                    <span className="text-xs text-gray-500 block mt-1">
                      이메일을 적어주시면 답변을 이메일로 보내드립니다
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <button
                  onClick={handleFinalSubmit}
                  disabled={postLoading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {postLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {postLoading ? '제출 중...' : '글 작성하기'}
                </button>
              </div>
            </div>
          )}

          {step === 'post_submitted' && aiLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6 w-full">
                <p className="text-green-800 font-semibold text-sm">
                  ✓ 글이 성공적으로 생성되었습니다!
                </p>
                <p className="text-green-700 text-xs mt-1">{postResult}</p>
              </div>

              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
              <p className="text-gray-700 font-semibold mb-2">AI 답변을 댓글로 등록 중...</p>
              <p className="text-sm text-gray-500">잠시만 기다려 주세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
