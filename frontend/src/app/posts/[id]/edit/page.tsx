'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Post } from '@/types';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);

  const [needsPassword, setNeedsPassword] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');

  const fetchPost = async (pwd?: string) => {
    try {
      const data = await api.getPost(params.id as string, pwd);
      setPost(data);
      setTitle(data.title);
      setContent(data.content);
      setAuthorName(data.authorName || '');
      setEmail(data.email || '');
      setIsAnonymous(data.isAnonymous ?? true);
      setIsPrivate(data.isPrivate ?? true);
      setNeedsPassword(false);
    } catch (error: any) {
      if (error.status === 401) {
        setNeedsPassword(true);
      } else {
        alert('글을 불러올 수 없습니다');
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const handlePasswordSubmit = () => {
    if (!accessPassword) return;
    fetchPost(accessPassword);
  };

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim() || !password.trim()) {
      alert('제목, 내용, 비밀번호는 필수입니다');
      return;
    }

    if (!authorName.trim()) {
      alert('이름은 필수입니다');
      return;
    }

    setSubmitting(true);

    try {
      await api.updatePost(params.id as string, {
        password,
        title,
        content,
        authorName,
        email: email || undefined,
        isAnonymous,
        isPrivate,
      });

      alert('글이 수정되었습니다');
      router.push(`/posts/${params.id}`);
    } catch (error: any) {
      if (error.status === 401) {
        alert('비밀번호가 올바르지 않습니다');
      } else {
        alert('글 수정에 실패했습니다');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white border border-gray-200 p-8 rounded">
          <h2 className="text-xl font-bold mb-4 text-center">비공개 글</h2>
          <p className="text-gray-600 mb-6 text-center text-sm">비밀번호를 입력하세요</p>
          <input
            type="password"
            value={accessPassword}
            onChange={(e) => setAccessPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4 text-sm"
            placeholder="비밀번호"
          />
          <button
            onClick={handlePasswordSubmit}
            className="w-full bg-black text-white py-2 rounded text-sm font-semibold hover:bg-gray-800"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded p-8">
          <h1 className="text-2xl font-bold mb-6 text-black">글 수정</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-black">
                제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm text-black"
                placeholder="제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-black">
                내용 *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm text-black"
                rows={12}
                placeholder="내용을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-black">
                비밀번호 * <span className="text-xs text-gray-500">(글 작성 시 입력한 비밀번호)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm text-black"
                placeholder="비밀번호"
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
                <span className="text-sm text-black">익명</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-black">비공개</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-black">
                이름 * {isAnonymous && <span className="text-xs text-gray-500">(익명으로 표시됩니다)</span>}
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm text-black"
                placeholder="이름"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-black">
                이메일 (선택)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-sm text-black"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleUpdate}
              disabled={submitting}
              className="flex-1 bg-black text-white py-2 rounded text-sm font-semibold hover:bg-gray-800 disabled:bg-gray-400"
            >
              {submitting ? '수정 중...' : '수정하기'}
            </button>
            <button
              onClick={() => router.push(`/posts/${params.id}`)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
