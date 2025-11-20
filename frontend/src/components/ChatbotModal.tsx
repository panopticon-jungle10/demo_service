'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

interface ChatbotModalProps {
  onClose: () => void;
}

type Step = 'question' | 'ai_answer' | 'want_post' | 'title' | 'password' | 'toggles' | 'name' | 'email' | 'completed';

export default function ChatbotModal({ onClose }: ChatbotModalProps) {
  const [conversationId] = useState(uuidv4());
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [wantsToPost, setWantsToPost] = useState(false);
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);

    try {
      const response = await api.chat({
        conversationId,
        originalQuestion: question,
        wantsToPost: false,
      });

      setAiAnswer(response.aiAnswer);
      setStep('ai_answer');
    } catch (error) {
      setAiAnswer('챗봇: 오류입니다. AI 서비스가 현재 이용 불가능합니다.');
      setStep('ai_answer');
    } finally {
      setLoading(false);
    }
  };

  const handleWantPost = (wants: boolean) => {
    setWantsToPost(wants);
    if (wants) {
      setStep('title');
    } else {
      onClose();
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);

    try {
      const response = await api.chat({
        conversationId,
        originalQuestion: question,
        wantsToPost: true,
        postData: {
          title,
          password,
          isAnonymous,
          isPrivate,
          authorName: isAnonymous ? undefined : authorName,
          email: email || undefined,
        },
      });

      alert(response.reply);
      onClose();
    } catch (error) {
      alert('글 작성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">AI 챗봇</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 'question' && (
          <div>
            <label className="block mb-2 font-semibold">질문을 입력하세요</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              rows={4}
              placeholder="로그 수집에 대해 궁금한 점을 질문해주세요"
            />
            <button
              onClick={handleSubmitQuestion}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '처리 중...' : '질문하기'}
            </button>
          </div>
        )}

        {step === 'ai_answer' && (
          <div>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="whitespace-pre-wrap">{aiAnswer}</p>
            </div>
            <p className="mb-4 font-semibold">글로 작성하시겠습니까?</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleWantPost(true)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                네
              </button>
              <button
                onClick={() => handleWantPost(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                아니오
              </button>
            </div>
          </div>
        )}

        {step === 'title' && (
          <div>
            <label className="block mb-2 font-semibold">글 제목을 입력하세요</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              placeholder="제목"
            />
            <button
              onClick={() => setStep('password')}
              disabled={!title.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              다음
            </button>
          </div>
        )}

        {step === 'password' && (
          <div>
            <label className="block mb-2 font-semibold">비밀번호를 입력하세요</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              placeholder="비밀번호"
            />
            <button
              onClick={() => setStep('toggles')}
              disabled={!password.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              다음
            </button>
          </div>
        )}

        {step === 'toggles' && (
          <div>
            <label className="block mb-4 font-semibold">익명/비공개 여부 선택</label>
            <div className="space-y-4 mb-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5"
                />
                <span>익명으로 작성</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-5 h-5"
                />
                <span>비공개로 작성</span>
              </label>
            </div>
            <button
              onClick={() => {
                if (isAnonymous) {
                  setStep('email');
                } else {
                  setStep('name');
                }
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              다음
            </button>
          </div>
        )}

        {step === 'name' && (
          <div>
            <label className="block mb-2 font-semibold">이름을 입력하세요</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              placeholder="이름"
            />
            <button
              onClick={() => setStep('email')}
              disabled={!authorName.trim()}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              다음
            </button>
          </div>
        )}

        {step === 'email' && (
          <div>
            <label className="block mb-2 font-semibold">이메일 입력 (선택)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              placeholder="email@example.com"
            />
            <div className="flex gap-4">
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? '제출 중...' : '제출'}
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                건너뛰기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
