'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PostListItem } from '@/types';
import CreatePostModal from '@/components/CreatePostModal';
import ChatbotModal from '@/components/ChatbotModal';
import { Lock, MessageCircle, Search, ChevronDown } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    api
      .getPosts(1)
      .then((data) => setPosts(data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCloseChatbot = () => {
    setShowChatbot(false);
    loadPosts();
  };

  const filteredPosts = posts
    .map((post, index) => ({
      ...post,
      postNumber: posts.length - index,
    }))
    .filter((post) => {
      if (!searchTerm.trim()) return true;
      return post.postNumber.toString().includes(searchTerm);
    });

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-3 text-gray-900">Q&A</h1>
          <p className="text-sm md:text-base text-gray-600">서비스에 대한 질문과 답변</p>
        </div>

        {/* Service Information */}
        <div className="mb-6 md:mb-8 space-y-4">
          {/* Always Visible Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
            <div className="text-sm md:text-base text-gray-800 leading-relaxed space-y-2">
              <p>해당 서비스는 Panopticon의 실시간 트래픽 모니터링을 위한 데모 서비스입니다.</p>
              <p>트래픽 발생과 함께 Panopticon 서비스에 대한 질문에 답변드리기 위해 제작되었습니다.</p>
              <p>Panopticon 서비스, 정글생활 관련 질문, 10기 응원 메시지 모두 환영합니다.</p>
            </div>
          </div>

          {/* Accordion Section */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors"
              aria-expanded={isGuideOpen}
            >
              <h3 className="text-base md:text-lg font-semibold text-gray-900">서비스 이용 안내</h3>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                  isGuideOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isGuideOpen && (
              <div className="border-t border-gray-200 p-4 md:p-6 space-y-6 animate-in slide-in-from-top duration-200">
                {/* Subsection 1: How to Check Answers */}
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-3">답변 확인 방법</h4>
                  <div className="text-sm md:text-base text-gray-700 leading-relaxed space-y-2">
                    <p>답변을 확인하실 수 있는 방법은 두 가지입니다:</p>
                    <ol className="list-decimal list-inside space-y-1.5 ml-2">
                      <li>
                        <strong>이메일 답변:</strong> 이메일 주소를 남겨주시면 해당 이메일로 상세 답변을 회신해드립니다.
                      </li>
                      <li>
                        <strong>사이트 재방문:</strong> 글 번호와 비밀번호를 기억하신 후 재방문하시면 댓글로 답변을 확인하실 수 있습니다.
                      </li>
                    </ol>
                    <div className="mt-3 text-xs md:text-sm text-gray-600 space-y-1">
                      <p>※ 가급적 이메일 주소를 남겨주시면 더 빠르고 정확한 답변을 받으실 수 있습니다.</p>
                      <p>※ 본 Q&A 페이지는 2025년 12월 6일 종료 예정입니다.</p>
                    </div>
                  </div>
                </div>

                {/* Subsection 2: Main Features */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-3">주요 기능 안내</h4>
                  <div className="text-sm md:text-base text-gray-700 leading-relaxed space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1.5">1. 글쓰기</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600">
                        <li>일반적인 게시글 작성 기능입니다.</li>
                        <li>글 작성 시 설정한 비밀번호는 수정 및 비공개 글 열람 시 필요합니다.</li>
                        <li>삭제 기능은 제공되지 않습니다.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1.5">2. AI 챗봇 (우측 하단)</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600">
                        <li>Panopticon 서비스에 대해 학습된 AI 챗봇이 즉시 답변을 제공합니다.</li>
                        <li>Panopticon 관련 질문에 한해 자동 답변이 가능합니다.</li>
                        <li>챗봇 이용 후 바로 글로 남기실 수 있으며, 개발팀의 추가 답변도 받으실 수 있습니다.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="py-4 px-4 text-left text-sm font-semibold w-16 text-gray-700">No</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">제목</th>
                <th className="py-4 px-4 text-center text-sm font-semibold w-32 text-gray-700">
                  글쓴이
                </th>
                <th className="py-4 px-4 text-center text-sm font-semibold w-32 text-gray-700">
                  작성시간
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 게시물이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/posts/${post.id}`)}
                  >
                    <td className="py-4 px-4 text-sm text-gray-600">{post.postNumber}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {post.isPrivate && <Lock className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm text-gray-900 font-medium">{post.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">
                      {post.authorName || 'PLIPOP'}
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-600">
                      {new Date(post.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Card List - Mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              로딩 중...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 게시물이 없습니다.'}
            </div>
          ) : (
            filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg cursor-pointer transition-shadow"
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {post.isPrivate && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    <span className="text-sm text-gray-900 font-medium line-clamp-2">{post.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">#{post.postNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{post.authorName || 'PLIPOP'}</span>
                  <span>{new Date(post.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Search & Write Button */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <div className="relative flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2.5 w-full sm:w-80 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="글 번호를 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-indigo-600 text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all w-full sm:w-auto"
          >
            글쓰기
          </button>
        </div>
      </div>

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} onSuccess={loadPosts} />
      )}
      {showChatbot && <ChatbotModal onClose={handleCloseChatbot} />}
    </main>
  );
}
