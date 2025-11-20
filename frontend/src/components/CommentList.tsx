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
      <div className="text-center py-8 text-gray-400 text-sm">
        아직 답변이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isAi = comment.isAiGenerated;
        const bgColor = isAi ? 'bg-blue-50' : 'bg-white';
        const borderColor = isAi ? 'border-blue-200' : 'border-gray-200';
        const Icon = isAi ? Bot : User;
        const label = isAi ? 'AI 답변' : '관리자 답변';
        const badgeColor = isAi ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';

        return (
          <div
            key={comment.id}
            className={`p-4 rounded border ${bgColor} ${borderColor}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-5 h-5 text-gray-600" />
              <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor}`}>
                {label}
              </span>
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(comment.createdAt).toLocaleString('ko-KR')}
              </span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>

            {isAdmin && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onEdit?.(comment.id)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete?.(comment.id)}
                  className="text-xs text-red-600 hover:underline"
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
