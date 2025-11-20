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

  useEffect(() => {
    const saved = sessionStorage.getItem('adminPassword');
    if (saved) {
      setAdminPassword(saved);
      setAuthenticated(true);
      loadPosts();
    }
  }, []);

  const handleLogin = () => {
    if (!adminPassword) return;
    sessionStorage.setItem('adminPassword', adminPassword);
    setAuthenticated(true);
    loadPosts();
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
      const post = await api.getPost(postId);
      setSelectedPost(post);
    } catch (error) {
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">관리자 로그인</h1>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-4"
            placeholder="관리자 비밀번호"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">관리자 페이지 - 댓글 관리</h1>

        <div className="grid grid-cols-2 gap-6">
          {/* Post List */}
          <div>
            <h2 className="text-xl font-bold mb-4">글 목록</h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg"
                  onClick={() => loadPostDetail(post.id)}
                >
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    댓글 수: {post.comments?.length || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Post Detail + Comment Form */}
          <div>
            {selectedPost ? (
              <div>
                <h2 className="text-xl font-bold mb-4">글 상세</h2>
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg font-bold mb-2">{selectedPost.title}</h3>
                  <p className="text-gray-800 whitespace-pre-wrap mb-4">
                    {selectedPost.content}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="font-bold mb-4">기존 댓글</h3>
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
                  <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <h3 className="font-bold mb-2">댓글 수정</h3>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg mb-2"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditComment(editingCommentId)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="px-4 py-2 bg-gray-300 rounded-lg"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="font-bold mb-4">새 댓글 작성</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    * 관리자만 댓글을 작성할 수 있습니다
                  </p>
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4"
                    rows={4}
                    placeholder="댓글 내용을 입력하세요"
                  />
                  <div className="text-xs text-gray-400 mb-4">
                    비밀번호는 로그인 시 입력한 관리자 비밀번호가 자동으로 사용됩니다
                  </div>
                  <button
                    onClick={handleCreateComment}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    댓글 작성
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                좌측에서 글을 선택하세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
