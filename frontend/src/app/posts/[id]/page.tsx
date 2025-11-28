'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Post } from '@/types';
import CommentList from '@/components/CommentList';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const fetchPost = async (pwd?: string) => {
    try {
      const data = await api.getPost(params.id as string, pwd);
      setPost(data);
      setNeedsPassword(false);
      setPasswordError(false);
    } catch (error: any) {
      if (error.status === 401) {
        setNeedsPassword(true);
        if (pwd) {
          setPasswordError(true);
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
    if (!password) return;
    fetchPost(password);
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
        <div className="max-w-md mx-auto bg-white border border-gray-200 p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">비공개 글</h2>
          <p className="text-gray-600 mb-6 text-center">비밀번호를 입력하세요</p>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(false);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            className={`w-full px-4 py-2.5 border rounded-lg mb-1 text-sm transition-colors ${
              passwordError
                ? 'border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500'
                : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
            }`}
            placeholder="비밀번호"
          />
          {passwordError && (
            <p className="text-red-500 text-xs mb-3">비밀번호를 다시 입력해주세요</p>
          )}
          <button
            onClick={handlePasswordSubmit}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors mt-3"
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
        {/* Post Detail */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-md">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 md:p-8">
            <h1 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 text-gray-900">{post.title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-2 md:gap-4">
                <span>작성자: JUNGLE</span>
                <span className="hidden sm:inline">{new Date(post.createdAt).toLocaleString('ko-KR')}</span>
                <span className="sm:hidden">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-8 min-h-[200px] md:min-h-[300px]">
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-sm md:text-base">{post.content}</p>
            {post.email && (
              <p className="text-xs md:text-sm text-gray-600 mt-4 md:mt-6">이메일: {post.email}</p>
            )}
          </div>

          {/* Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="border-t border-gray-200 p-4 md:p-8 bg-gray-50">
              <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-gray-900">답변 ({post.comments.length})</h3>
              <CommentList comments={post.comments} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors w-full sm:w-auto"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
