'use client';

import { Comment } from '@/types';
import { Bot, User } from 'lucide-react';

interface CommentListProps {
  comments: Comment[];
  isAdmin?: boolean;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
}

export default function CommentList({ comments, isAdmin, onEdit, onDelete }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        아직 답변이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isAi = comment.isAiGenerated;
        const bgColor = isAi ? 'bg-indigo-50' : 'bg-white';
        const borderColor = isAi ? 'border-indigo-200' : 'border-gray-200';
        const Icon = isAi ? Bot : User;
        const label = isAi ? 'AI 답변' : '관리자 답변';
        const badgeColor = isAi ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700';

        return (
          <div
            key={comment.id}
            className={`p-5 rounded-lg border ${bgColor} ${borderColor}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-5 h-5 text-gray-700" />
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
                {label}
              </span>
              <span className="text-xs text-gray-500 ml-auto">
                {new Date(comment.createdAt).toLocaleString('ko-KR')}
              </span>
            </div>
            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>

            {isAdmin && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => onEdit?.(comment.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete?.(comment.id)}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
