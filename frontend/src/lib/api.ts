const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const LLM_URL = process.env.NEXT_PUBLIC_LLM_URL || 'http://localhost:5000';

export const api = {
  async getPosts(page: number = 1) {
    const res = await fetch(`${API_URL}/posts?page=${page}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  async getPost(id: string, password?: string) {
    const url = password
      ? `${API_URL}/posts/${id}?password=${encodeURIComponent(password)}`
      : `${API_URL}/posts/${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch post');
    return res.json();
  },

  async createPost(data: any) {
    const res = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  },

  async updatePost(id: string, data: any) {
    const res = await fetch(`${API_URL}/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update post');
    return res.json();
  },

  async deletePost(id: string, password: string) {
    const res = await fetch(`${API_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error('Failed to delete post');
    return res.json();
  },

  async createComment(postId: string, content: string, adminPassword: string, isAiGenerated: boolean = false) {
    const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, adminPassword, isAiGenerated }),
    });
    if (!res.ok) throw new Error('Failed to create comment');
    return res.json();
  },

  async updateComment(commentId: string, content: string, adminPassword: string) {
    const res = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, adminPassword }),
    });
    if (!res.ok) throw new Error('Failed to update comment');
    return res.json();
  },

  async deleteComment(commentId: string, adminPassword: string) {
    const res = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword }),
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  },

  async chat(data: any) {
    const res = await fetch(`${LLM_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to chat');
    return res.json();
  },
};
