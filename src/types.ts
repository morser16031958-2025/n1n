export interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  kind: 'image' | 'file';
  name: string;
  mime: string;
  size: number;
  dataUrl?: string;
  text?: string;
}

export interface Model {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  pricing?: {
    prompt?: number | string;
    completion?: number | string;
  };
}

export const POPULAR_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-opus-4-6',
  'claude-sonnet-4-5-20250929',
  'deepseek-v3.2',
  'glm-4.7',
  'gpt-5.2',
  'kimi-k2.5',
  'qwen3-coder-plus',
];
