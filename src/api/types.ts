type ChatRole = 'user' | 'assistant' | 'system';

// Shape of wrapper-api's ai worker (dev-ai.0xhackerspace.workers.dev),
// GET/POST /v1/sessions and /v1/sessions/:id/messages.
interface ChatSession {
  id: string;
  title: string | null;
  agent_id: string | null;
  team_id: string | null;
  created_at: string;
  updated_at?: string;
  role?: string;
}

interface ChatApiMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  agent_id: string | null;
  created_at: string;
}

interface ListResponse<T> {
  object: 'list';
  data: T[];
  next_cursor: string | null;
}

interface SendMessageResponse {
  session_id: string;
  message: { role: 'assistant'; content: string };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type { ChatApiMessage, ChatRole, ChatSession, ListResponse, SendMessageResponse };
