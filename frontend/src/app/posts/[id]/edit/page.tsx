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
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');

  const [needsPassword, setNeedsPassword] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [accessPasswordError, setAccessPasswordError] = useState(false);
  const [updatePasswordError, setUpdatePasswordError] = useState(false);

  const fetchPost = async (pwd?: string) => {
    try {
      const data = await api.getPost(params.id as string, pwd);
      setPost(data);
      setContent(data.content);
      setEmail(data.email || '');
      setNeedsPassword(false);
      setAccessPasswordError(false);
    } catch (error: any) {
      if (error.status === 401) {
        setNeedsPassword(true);
        if (pwd) {
          setAccessPasswordError(true);
        }
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
    if (!content.trim() || !password.trim()) {
      alert('내용과 비밀번호는 필수입니다');
      return;
    }

    setSubmitting(true);

    try {
      await api.updatePost(params.id as string, {
        password,
        content,
        email: email || undefined,
      });

      alert('글이 수정되었습니다');
      setUpdatePasswordError(false);
      router.push(`/posts/${params.id}`);
    } catch (error: any) {
      if (error.status === 401) {
        setUpdatePasswordError(true);
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
            onChange={(e) => {
              setAccessPassword(e.target.value);
              setAccessPasswordError(false);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            className={`w-full px-4 py-2 border rounded mb-1 text-sm transition-colors ${
              accessPasswordError
                ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500'
                : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            }`}
            placeholder="비밀번호"
          />
          {accessPasswordError && (
            <p className="text-red-500 text-xs mb-3">비밀번호를 다시 입력해주세요</p>
          )}
          <button
            onClick={handlePasswordSubmit}
            className="w-full bg-black text-white py-2 rounded text-sm font-semibold hover:bg-gray-800 mt-3"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container mx-auto px-4 py-6 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-black">글 수정</h1>

          <div className="space-y-4">
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setUpdatePasswordError(false);
                }}
                className={`w-full px-4 py-2 border rounded text-sm text-black mb-1 transition-colors ${
                  updatePasswordError
                    ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500'
                    : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                }`}
                placeholder="비밀번호"
              />
              {updatePasswordError && (
                <p className="text-red-500 text-xs">비밀번호를 다시 입력해주세요</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-black">
                상세 답변 수신 이메일 (선택)
                <span className="text-xs text-gray-500 block mt-1">
                  이메일을 적어주시면 답변을 이메일로 보내드립니다
                </span>
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

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
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
