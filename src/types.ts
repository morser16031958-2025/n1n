export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export const POPULAR_MODELS = [
  'kimi-k2.5',
  'glm-5',
  'xiaomi-mimo-2',
  'qwen-max-3',
  'deepseek-v4'
];
