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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-black">AI 챗봇</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === "question" && (
          <div>
            <label className="block mb-2 font-semibold text-black">
              질문을 입력하세요
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4 text-black"
              rows={4}
              placeholder="로그 수집에 대해 궁금한 점을 질문해주세요"
            />
            <button
              onClick={handleSubmitQuestion}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "처리 중..." : "질문하기"}
            </button>
          </div>
        )}

        {step === "ai_answer" && (
          <div>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="whitespace-pre-wrap text-black">{aiAnswer}</p>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-black">글로 작성하시겠습니까?</h3>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("post_form")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                네
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 font-semibold"
              >
                아니요
              </button>
            </div>
          </div>
        )}

        {step === "post_form" && (
          <div>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="whitespace-pre-wrap text-black">{aiAnswer}</p>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-black">글로 작성하기</h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-black">제목 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  placeholder="제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-black">비밀번호 *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  placeholder="글 수정시 필요한 비밀번호"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-black">이름 *</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  placeholder="이름"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-black">이메일 (선택)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-black"
                  placeholder="email@example.com"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-black">익명으로 작성</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-black">비공개로 작성</span>
                </label>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={loading || !title.trim() || !password.trim() || !authorName.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
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
