'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PostListItem } from '@/types';
import CreatePostModal from '@/components/CreatePostModal';
import ChatbotModal from '@/components/ChatbotModal';
import { Lock, MessageCircle, Search } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    api.getPosts(1)
      .then((data) => setPosts(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCloseChatbot = () => {
    setShowChatbot(false);
    loadPosts();
  };

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Q&A</h1>
          <div className="w-12 h-1 bg-black mx-auto"></div>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center space-x-6 text-sm mb-8 border-b border-gray-200">
          <button className="pb-3 border-b-2 border-black font-semibold">Q&A</button>
          <button className="pb-3 text-gray-500 hover:text-black">NOTICE</button>
          <button className="pb-3 text-gray-500 hover:text-black">FAQ</button>
        </div>

        {/* Table */}
        <div className="bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-t-2 border-black border-b">
                <th className="py-4 px-4 text-left text-sm font-semibold w-16">No</th>
                <th className="py-4 px-4 text-left text-sm font-semibold">제목</th>
                <th className="py-4 px-4 text-center text-sm font-semibold w-32">글쓴이</th>
                <th className="py-4 px-4 text-center text-sm font-semibold w-32">작성시간</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    등록된 게시물이 없습니다.
                  </td>
                </tr>
              ) : (
                posts.map((post, index) => (
                  <tr
                    key={post.id}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/posts/${post.id}`)}
                  >
                    <td className="py-4 px-4 text-sm text-gray-600">{posts.length - index}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {post.isPrivate && <Lock className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm">{post.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-500">
                      {post.authorName || 'PLIPOP'}
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Search & Write Button */}
        <div className="mt-8 flex justify-between items-center">
          <div className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 w-80">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-black text-white px-8 py-2 rounded-full text-sm font-semibold hover:bg-gray-800"
          >
            글쓰기
          </button>
        </div>
      </div>

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={loadPosts}
        />
      )}
      {showChatbot && <ChatbotModal onClose={handleCloseChatbot} />}
    </main>
  );
}
