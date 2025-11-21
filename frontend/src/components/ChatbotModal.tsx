"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { api } from "@/lib/api";
import { X } from "lucide-react";

interface ChatbotModalProps {
  onClose: () => void;
}

type Step = "question" | "ai_answer" | "post_form";

export default function ChatbotModal({ onClose }: ChatbotModalProps) {
  const [conversationId] = useState(uuidv4());
  const [step, setStep] = useState<Step>("question");
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [wantsToPost, setWantsToPost] = useState(false);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
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
      setStep("ai_answer");
    } catch (error: any) {
      console.error("Chat error:", error);
      setAiAnswer("챗봇: 오류입니다. AI 서비스가 현재 이용 불가능합니다.");
      setStep("ai_answer");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!authorName.trim()) {
      alert("이름은 필수입니다");
      return;
    }

    setLoading(true);

    try {
      const response = await api.chat({
        conversationId,
        originalQuestion: question,
        wantsToPost: true,
        postData: {
          title,
          password,
          authorName,
          isAnonymous,
          isPrivate,
          email: email || undefined,
        },
      });

      alert(response.reply);
      onClose();
    } catch (error: any) {
      console.error("Submit error:", error);
      alert("글 작성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">AI 챗봇</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === "question" && (
          <div>
            <label className="block mb-3 font-semibold text-gray-700 text-base">
              질문을 입력하세요
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4}
              placeholder="로그 수집에 대해 궁금한 점을 질문해주세요"
            />
            <button
              onClick={handleSubmitQuestion}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold shadow-lg shadow-indigo-200 transition-colors"
            >
              {loading ? "처리 중..." : "질문하기"}
            </button>
          </div>
        )}

        {step === "ai_answer" && (
          <div>
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl mb-6">
              <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">{aiAnswer}</p>
            </div>

            <h3 className="text-xl font-semibold mb-5 text-gray-900">글로 작성하시겠습니까?</h3>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("post_form")}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200 transition-colors"
              >
                네
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                아니요
              </button>
            </div>
          </div>
        )}

        {step === "post_form" && (
          <div>
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl mb-6">
              <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">{aiAnswer}</p>
            </div>

            <h3 className="text-xl font-semibold mb-5 text-gray-900">글로 작성하기</h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">비밀번호 *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="글 수정시 필요한 비밀번호"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">이름 *</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="이름"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">이메일 (선택)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">익명으로 작성</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">비공개로 작성</span>
                </label>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={loading || !title.trim() || !password.trim() || !authorName.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold shadow-lg shadow-indigo-200 transition-colors"
              >
                {loading ? "제출 중..." : "글 작성하기"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
