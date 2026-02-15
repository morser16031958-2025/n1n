import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { type Message } from '../types';
import { Send, Loader2 } from 'lucide-react';

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, isLoading, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="messages-list" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.role}`}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
              borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                : 'var(--bot-msg-bg)',
              color: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            {msg.role === 'assistant' ? (
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
              />
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            )}
          </div>
        ))}
        {isLoading && (
          <div
            className="message assistant"
            style={{
              alignSelf: 'flex-start',
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              borderBottomLeftRadius: '2px',
              background: 'var(--bot-msg-bg)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Loader2 className="animate-spin" size={18} />
            <span style={{ fontSize: '0.9rem', color: '#a0a0a0' }}>Печатает...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area" style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--darker-bg)' }}>
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Введите сообщение..."
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              paddingRight: '3rem',
              resize: 'none',
              maxHeight: '150px',
              overflowY: 'auto',
              minHeight: '44px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '8px',
              background: input.trim() ? 'var(--primary)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem',
              cursor: input.trim() ? 'pointer' : 'default',
              color: input.trim() ? 'white' : '#555',
              transition: 'all 0.2s',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
