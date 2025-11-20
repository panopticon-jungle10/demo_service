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

  const fetchPost = async (pwd?: string) => {
    try {
      const data = await api.getPost(params.id as string, pwd);
      setPost(data);
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
    if (!password) return;
    fetchPost(password);
  };

  const handleEdit = () => {
    router.push(`/posts/${params.id}/edit`);
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        {/* Post Detail */}
        <div className="bg-white border border-gray-200 rounded">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-bold mb-4 text-black">{post.title}</h1>
            <div className="flex items-center justify-between text-sm text-black">
              <div className="flex items-center gap-4">
                <span>작성자: {post.isAnonymous ? '익명' : post.authorName}</span>
                <span>{new Date(post.createdAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[300px]">
            <p className="text-black whitespace-pre-wrap leading-relaxed">{post.content}</p>
            {post.email && (
              <p className="text-sm text-black mt-4">이메일: {post.email}</p>
            )}
          </div>

          {/* Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <h3 className="text-lg font-bold mb-4">답변 ({post.comments.length})</h3>
              <CommentList comments={post.comments} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300"
          >
            목록
          </button>
          <button
            onClick={handleEdit}
            className="px-6 py-2 bg-black text-white rounded text-sm font-semibold hover:bg-gray-800"
          >
            수정
          </button>
        </div>
      </div>
    </div>
  );
}
