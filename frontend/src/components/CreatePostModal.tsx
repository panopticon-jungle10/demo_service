'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePostModal({ onClose, onSuccess }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !password.trim()) {
      alert('제목, 내용, 비밀번호는 필수입니다');
      return;
    }

    if (!isAnonymous && !authorName.trim()) {
      alert('익명이 아닌 경우 이름이 필요합니다');
      return;
    }

    setLoading(true);

    try {
      await api.createPost({
        title,
        content,
        password,
        authorName: isAnonymous ? undefined : authorName,
        email: email || undefined,
        isAnonymous,
        isPrivate,
      });

      alert('글이 작성되었습니다');
      onSuccess();
      onClose();
    } catch (error) {
      alert('글 작성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">글 작성</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
              placeholder="제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">내용 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
              rows={8}
              placeholder="내용을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">비밀번호 *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
              placeholder="비밀번호 (수정/삭제시 필요)"
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
              <span className="text-sm">익명</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">비공개</span>
            </label>
          </div>

          {!isAnonymous && (
            <div>
              <label className="block text-sm font-semibold mb-2">이름 *</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
                placeholder="이름"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">이메일 (선택)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded text-sm"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-black text-white py-2 rounded text-sm font-semibold hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? '작성 중...' : '작성하기'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
