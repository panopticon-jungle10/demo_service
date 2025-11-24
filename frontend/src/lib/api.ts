const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const LLM_URL = process.env.NEXT_PUBLIC_LLM_URL || 'http://localhost:5000/llm';

export const api = {
  async getPosts(page: number = 1) {
    const res = await fetch(`${API_URL}/posts?page=${page}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json();
  },

  async getPost(id: string, password?: string) {
    if (password) {
      const res = await fetch(`${API_URL}/posts/${id}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const error = new Error('Failed to fetch post');
        (error as any).status = res.status;
        throw error;
      }
      return res.json();
    } else {
      const res = await fetch(`${API_URL}/posts/${id}`);
      if (!res.ok) {
        const error = new Error('Failed to fetch post');
        (error as any).status = res.status;
        throw error;
      }
      return res.json();
    }
  },

  async getPostAsAdmin(id: string, adminPassword: string) {
    const res = await fetch(`${API_URL}/posts/${id}/admin-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword }),
    });
    if (!res.ok) {
      const error = new Error('Failed to fetch post as admin');
      (error as any).status = res.status;
      throw error;
    }
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
    if (!res.ok) {
      const error = new Error('Failed to update post');
      (error as any).status = res.status;
      throw error;
    }
    return res.json();
  },

  async createComment(
    postId: string,
    content: string,
    adminPassword: string,
    isAiGenerated: boolean = false,
  ) {
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

  async chatAsk(data: { conversationId: string; originalQuestion: string; isError?: boolean }, traceHeaders?: { traceId?: string; spanId?: string }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // 첫 번째 요청이거나 trace header가 없는 경우
    if (traceHeaders?.traceId && traceHeaders?.spanId) {
      headers['X-Trace-Id'] = traceHeaders.traceId;
      headers['X-Span-Id'] = traceHeaders.spanId;
    }

    const res = await fetch(`${LLM_URL}/chat/ask`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to ask AI');

    const responseData = await res.json();

    // 응답 헤더에서 trace context 가져오기
    const responseTraceId = res.headers.get('X-Trace-Id');
    const responseSpanId = res.headers.get('X-Span-Id');

    return {
      ...responseData,
      _traceContext: {
        traceId: responseTraceId,
        spanId: responseSpanId,
      },
    };
  },

  async chatPost(data: { conversationId: string; originalQuestion: string; postData: any }, traceHeaders?: { traceId?: string; spanId?: string }) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // 이전 요청에서 받은 trace header 전달
    if (traceHeaders?.traceId && traceHeaders?.spanId) {
      headers['X-Trace-Id'] = traceHeaders.traceId;
      headers['X-Span-Id'] = traceHeaders.spanId;
    }

    const res = await fetch(`${LLM_URL}/chat/post`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  },

  async verifyAdmin(adminPassword: string) {
    const res = await fetch(`${API_URL}/posts/verify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword }),
    });
    if (!res.ok) throw new Error('Failed to verify admin password');
    return res.json();
  },
};
