export interface Comment {
  id: string;
  postId: string;
  content: string;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  postId: number;
  title: string;
  content: string;
  email?: string;
  authorName?: string;
  isPrivate: boolean;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
}

export interface PostListItem {
  id: string;
  postId: number;
  title: string;
  authorName?: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface CollectedData {
  originalQuestion: string;
  aiAnswer: string;
  wantsToPost: boolean;
  title: string;
  password: string;
  isAnonymous: boolean;
  isPrivate: boolean;
  authorName: string;
  email: string;
}
