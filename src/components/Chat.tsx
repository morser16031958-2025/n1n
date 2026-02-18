import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { type Attachment, type Message } from '../types';
import { Send, Paperclip, X } from 'lucide-react';

interface ChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string, attachments: Attachment[]) => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, isLoading, onSendMessage }) => {
  const [input, setInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;
    onSendMessage(input.trim(), pendingAttachments);
    setInput('');
    setPendingAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read_error'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });

  const fileToText = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read_error'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsText(file);
    });

  const isTextLike = (file: File) => {
    if (file.type.startsWith('text/')) return true;
    const n = file.name.toLowerCase();
    return n.endsWith('.md') || n.endsWith('.txt') || n.endsWith('.json') || n.endsWith('.csv') || n.endsWith('.log') || n.endsWith('.yaml') || n.endsWith('.yml');
  };

  const addFiles = async (files: File[]) => {
    const next: Attachment[] = [];
    for (const f of files) {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      if (f.type.startsWith('image/')) {
        const dataUrl = await fileToDataUrl(f);
        next.push({ id, kind: 'image', name: f.name || 'image', mime: f.type, size: f.size, dataUrl });
        continue;
      }
      if (isTextLike(f) && f.size <= 512_000) {
        const text = await fileToText(f);
        next.push({ id, kind: 'file', name: f.name, mime: f.type || 'text/plain', size: f.size, text });
        continue;
      }
      next.push({ id, kind: 'file', name: f.name, mime: f.type || 'application/octet-stream', size: f.size });
    }
    setPendingAttachments((prev) => [...prev, ...next]);
  };

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    e.target.value = '';
    if (list.length === 0) return;
    try {
      await addFiles(list);
    } catch {
      return;
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items || []);
    const imageFiles = items
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter((f): f is File => Boolean(f));
    if (imageFiles.length === 0) return;
    e.preventDefault();
    try {
      await addFiles(imageFiles);
    } catch {
      return;
    }
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const renderAttachments = (attachments: Attachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {attachments.map((a) => (
          <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {a.kind === 'image' && a.dataUrl ? (
              <img src={a.dataUrl} alt={a.name} style={{ maxWidth: '320px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)' }} />
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.92)' }}>
                {a.name}
                {a.text ? '' : ' (без содержимого)'}
              </div>
            )}
          </div>
        ))}
      </div>
    );
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
            {renderAttachments(msg.attachments || [])}
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
              width: 'fit-content'
            }}
          >
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area" style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--darker-bg)' }}>
        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {pendingAttachments.length > 0 && (
            <div style={{ marginBottom: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {pendingAttachments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border)',
                    color: 'white',
                    maxWidth: '100%',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                    {a.kind === 'image' ? '🖼️ ' : '📄 '}
                    {a.name}
                  </span>
                  <button
                    onClick={() => removePendingAttachment(a.id)}
                    style={{ background: 'transparent', border: 'none', color: '#a0a0a0', cursor: 'pointer', padding: 0, display: 'flex' }}
                    disabled={isLoading}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Введите сообщение..."
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            style={{
              width: '100%',
              paddingRight: '6.2rem',
              resize: 'none',
              maxHeight: '150px',
              overflowY: 'auto',
              minHeight: '44px',
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFilesChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={handlePickFiles}
            disabled={isLoading}
            style={{
              position: 'absolute',
              right: '44px',
              bottom: '8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem',
              cursor: isLoading ? 'default' : 'pointer',
              color: '#a0a0a0',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Прикрепить файл или картинку"
          >
            <Paperclip size={18} />
          </button>
          <button
            onClick={handleSend}
            disabled={(!input.trim() && pendingAttachments.length === 0) || isLoading}
            style={{
              position: 'absolute',
              right: '8px',
              bottom: '8px',
              background: input.trim() || pendingAttachments.length > 0 ? 'var(--primary)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              padding: '0.4rem',
              cursor: input.trim() || pendingAttachments.length > 0 ? 'pointer' : 'default',
              color: input.trim() || pendingAttachments.length > 0 ? 'white' : '#555',
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
