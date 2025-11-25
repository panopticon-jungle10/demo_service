"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { X } from "lucide-react";

interface CreatePostModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePostModal({
  onClose,
  onSuccess,
}: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !password.trim()) {
      alert("제목, 내용, 비밀번호는 필수입니다");
      return;
    }

    if (!authorName.trim()) {
      alert("이름은 필수입니다");
      return;
    }

    setLoading(true);

    try {
      const res = await api.createPost({
        title,
        content,
        password,
        authorName,
        email: email || undefined,
        isAnonymous,
        isPrivate,
      });

      alert(`${res.message}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.log(error);
      alert("글 작성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900">글 작성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              내용 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={8}
              placeholder="내용을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              비밀번호 *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="비밀번호 (조회, 수정시 필요)"
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
              <span className="text-sm text-gray-700 font-medium">익명</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
              />
              <span className="text-sm text-gray-700 font-medium">비공개</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              이름 *{" "}
              {isAnonymous && (
                <span className="text-xs text-gray-500 font-normal">
                  (익명으로 표시됩니다)
                </span>
              )}
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="이름 또는 별칭"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              상세 답변 수신 이메일 (선택)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors shadow-lg shadow-indigo-200"
          >
            {loading ? "작성 중..." : "작성하기"}
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
