'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Post } from '@/types';
import CommentList from '@/components/CommentList';

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('adminPassword');
    if (saved) {
      setAdminPassword(saved);
      setAuthenticated(true);
      loadPosts();
    }
  }, []);

  const handleLogin = async () => {
    if (!adminPassword) return;

    try {
      const data = await api.getPosts(1);
      sessionStorage.setItem('adminPassword', adminPassword);
      setAuthenticated(true);
      setPasswordError(false);
      setPosts(data.data || []);
    } catch (error) {
      setPasswordError(true);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await api.getPosts(1);
      setPosts(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateComment = async () => {
    if (!commentContent.trim() || !selectedPost) return;

    try {
      await api.createComment(selectedPost.id, commentContent, adminPassword, false);
      alert('댓글이 작성되었습니다');
      setCommentContent('');
      await loadPostDetail(selectedPost.id);
    } catch (error) {
      alert('댓글 작성 실패: 관리자 비밀번호를 확인하세요');
    }
  };

  const loadPostDetail = async (postId: string) => {
    try {
      const post = await api.getPostAsAdmin(postId, adminPassword);
      setSelectedPost(post);
    } catch (error) {
      alert('글을 불러올 수 없습니다. 관리자 비밀번호를 확인하세요.');
      console.error(error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    try {
      await api.updateComment(commentId, editContent, adminPassword);
      alert('댓글이 수정되었습니다');
      setEditingCommentId(null);
      if (selectedPost) await loadPostDetail(selectedPost.id);
    } catch (error) {
      alert('수정 실패');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await api.deleteComment(commentId, adminPassword);
      alert('댓글이 삭제되었습니다');
      if (selectedPost) await loadPostDetail(selectedPost.id);
    } catch (error) {
      alert('삭제 실패');
    }
  };

  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">관리자 로그인</h1>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => {
              setAdminPassword(e.target.value);
              setPasswordError(false);
            }}
            className={`w-full px-4 py-2.5 border rounded-lg mb-1 outline-none text-sm transition-colors ${
              passwordError
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
            }`}
            placeholder="관리자 비밀번호"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          {passwordError && (
            <p className="text-red-500 text-xs mb-3">비밀번호를 다시 입력해주세요</p>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200 transition-all mt-3"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-3 text-gray-900">관리자 페이지</h1>
          <p className="text-sm md:text-base text-gray-600">댓글 관리</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Post List */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">글 목록</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">제목</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold w-24 text-gray-700">
                      댓글
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-12 text-center text-gray-500">
                        등록된 게시물이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr
                        key={post.id}
                        className="border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors"
                        onClick={() => loadPostDetail(post.id)}
                      >
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-900 font-medium">{post.title}</span>
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-600">
                          {post.comments?.length || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Post Detail + Comment Form */}
          <div>
            {selectedPost ? (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">글 상세</h2>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg font-bold mb-3 text-gray-900">{selectedPost.title}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedPost.content}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="font-bold mb-4 text-gray-900">기존 댓글</h3>
                  <CommentList
                    comments={selectedPost.comments || []}
                    isAdmin={true}
                    onEdit={(id) => {
                      setEditingCommentId(id);
                      const comment = selectedPost.comments?.find((c) => c.id === id);
                      if (comment) setEditContent(comment.content);
                    }}
                    onDelete={handleDeleteComment}
                  />
                </div>

                {editingCommentId && (
                  <div className="bg-indigo-50 p-6 rounded-lg mb-6 border border-indigo-100">
                    <h3 className="font-bold mb-3 text-gray-900">댓글 수정</h3>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditComment(editingCommentId)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200 transition-all text-sm"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-all text-sm"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="font-bold mb-3 text-gray-900">새 댓글 작성</h3>
                  <p className="text-sm text-gray-500 mb-4">* 관리자만 댓글을 작성할 수 있습니다</p>
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-4 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm"
                    rows={4}
                    placeholder="댓글 내용을 입력하세요"
                  />
                  <div className="text-xs text-gray-400 mb-4">
                    비밀번호는 로그인 시 입력한 관리자 비밀번호가 자동으로 사용됩니다
                  </div>
                  <button
                    onClick={handleCreateComment}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-200 transition-all"
                  >
                    댓글 작성
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12">
                <div className="text-gray-400 text-center">좌측에서 글을 선택하세요</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
