import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { AuthModal } from './components/AuthModal';
import { ModelSelector } from './components/ModelSelector';
import { Chat } from './components/Chat';
import { type Attachment, type Message } from './types';
import { Settings, Plus, Trash2 } from 'lucide-react';

type Provider = 'n1n' | 'openrouter';

function App() {
  const [provider, setProvider] = useState<Provider>('n1n');
  const [n1nApiKey, setN1nApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentModel, setCurrentModel] = useState('deepseek-v3.2');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingHello, setPendingHello] = useState(false);
  const [toast, setToast] = useState<string>('');

  const providerRef = useRef<Provider>('n1n');
  const apiKeyRef = useRef<string>('');
  const n1nApiKeyRef = useRef<string>('');
  const openRouterApiKeyRef = useRef<string>('');
  const currentModelRef = useRef<string>('deepseek-v3.2');
  const messagesRef = useRef<Message[]>([]);
  const initialHelloSentRef = useRef(false);

  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  useEffect(() => {
    n1nApiKeyRef.current = n1nApiKey;
    if (providerRef.current === 'n1n') apiKeyRef.current = n1nApiKey;
  }, [n1nApiKey]);

  useEffect(() => {
    openRouterApiKeyRef.current = openRouterApiKey;
    if (providerRef.current === 'openrouter') apiKeyRef.current = openRouterApiKey;
  }, [openRouterApiKey]);

  useEffect(() => {
    currentModelRef.current = currentModel;
  }, [currentModel]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const storedProvider = localStorage.getItem('provider') as Provider | null;
    const nextProvider: Provider = storedProvider === 'openrouter' ? 'openrouter' : 'n1n';

    const storedN1nKey = localStorage.getItem('n1n_api_key') || '';
    const storedOpenRouterKey = localStorage.getItem('openrouter_api_key') || '';

    setProvider(nextProvider);
    providerRef.current = nextProvider;

    setN1nApiKey(storedN1nKey);
    n1nApiKeyRef.current = storedN1nKey;

    setOpenRouterApiKey(storedOpenRouterKey);
    openRouterApiKeyRef.current = storedOpenRouterKey;

    const initialApiKey = nextProvider === 'openrouter' ? storedOpenRouterKey : storedN1nKey;
    apiKeyRef.current = initialApiKey;

    if (!initialApiKey) setIsAuthOpen(true);
  }, []);

  useEffect(() => {
    if (!apiKeyRef.current) return;
    if (messagesRef.current.length !== 0) return;
    if (initialHelloSentRef.current) return;
    initialHelloSentRef.current = true;
    void handleSendMessage('Привет');
  }, [n1nApiKey, openRouterApiKey, provider]);

  const providerLabel = useMemo(() => (provider === 'n1n' ? 'n1n.ai' : 'OpenRouter'), [provider]);
  const providerGradient = useMemo(
    () =>
      provider === 'n1n'
        ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
        : 'linear-gradient(135deg, #ff8a00, #ff3d00)',
    [provider]
  );
  const activeApiKey = useMemo(() => (provider === 'openrouter' ? openRouterApiKey : n1nApiKey), [provider, openRouterApiKey, n1nApiKey]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  const handleSetKey = (key: string) => {
    if (providerRef.current === 'openrouter') {
      localStorage.setItem('openrouter_api_key', key);
      setOpenRouterApiKey(key);
      openRouterApiKeyRef.current = key;
      apiKeyRef.current = key;
    } else {
      localStorage.setItem('n1n_api_key', key);
      setN1nApiKey(key);
      n1nApiKeyRef.current = key;
      apiKeyRef.current = key;
    }
    setIsAuthOpen(false);
    if (pendingHello) {
      setPendingHello(false);
      void handleSendMessage('Привет');
    }
  };

  const resetChat = () => {
    messagesRef.current = [];
    setMessages([]);
  };

  const defaultModelForProvider = (p: Provider) => (p === 'openrouter' ? 'openai/gpt-4o' : 'deepseek-v3.2');

  const switchProvider = (next: Provider) => {
    if (providerRef.current === next) return;
    providerRef.current = next;
    setProvider(next);
    localStorage.setItem('provider', next);

    setIsModelSelectorOpen(false);
    resetChat();

    const nextModel = defaultModelForProvider(next);
    currentModelRef.current = nextModel;
    setCurrentModel(nextModel);

    const nextKey = next === 'openrouter' ? openRouterApiKeyRef.current : n1nApiKeyRef.current;
    apiKeyRef.current = nextKey;

    showToast(`🔄 Чат очищен. Выбран провайдер: ${next === 'openrouter' ? 'OpenRouter' : 'n1n.ai'}`);

    if (!nextKey) {
      setIsAuthOpen(true);
      setPendingHello(true);
      return;
    }

    void handleSendMessage('Привет');
  };

  const buildApiUserContent = (text: string, attachments: Attachment[]) => {
    const images = attachments.filter((a) => a.kind === 'image' && a.dataUrl);
    const textFiles = attachments.filter((a) => a.kind === 'file' && typeof a.text === 'string' && a.text.length > 0);
    const otherFiles = attachments.filter((a) => a.kind === 'file' && !(typeof a.text === 'string' && a.text.length > 0));

    let mergedText = text || '';
    if (textFiles.length > 0) {
      for (const f of textFiles) {
        mergedText += `\n\nФайл: ${f.name}\n\n\`\`\`\n${f.text}\n\`\`\``;
      }
    }
    if (otherFiles.length > 0) {
      mergedText += `\n\nФайлы (без содержимого):\n${otherFiles.map((f) => `- ${f.name}`).join('\n')}`;
    }

    if (images.length === 0) return mergedText;

    const parts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];
    if (mergedText.trim()) parts.push({ type: 'text', text: mergedText });
    for (const img of images) {
      parts.push({ type: 'image_url', image_url: { url: img.dataUrl! } });
    }
    return parts;
  };

  const extractAssistantText = (rawContent: unknown) => {
    if (typeof rawContent === 'string') return rawContent;
    if (Array.isArray(rawContent)) {
      return rawContent
        .map((p) => {
          const type = (p as any)?.type;
          if (type === 'text') return String((p as any)?.text ?? '');
          return '';
        })
        .join('');
    }
    return '';
  };

  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (!apiKeyRef.current) {
      setIsAuthOpen(true);
      return;
    }

    const newMessages: Message[] = [...messagesRef.current, { role: 'user', content, attachments }];
    messagesRef.current = newMessages;
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const endpoint =
        providerRef.current === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.n1n.ai/v1/chat/completions';

      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKeyRef.current}`,
        'Content-Type': 'application/json',
      };

      if (providerRef.current === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'n1n.ai Chat';
      }

      const apiMessages = newMessages.map((m) => {
        if (m.role === 'user') {
          return {
            role: 'user',
            content: buildApiUserContent(m.content, m.attachments || []),
          };
        }
        return { role: 'assistant', content: m.content };
      });

      const response = await axios.post(endpoint, {
        model: currentModelRef.current,
        messages: apiMessages,
        temperature: 0.7,
      }, { headers });

      const rawMessage = response.data?.choices?.[0]?.message;
      const botMessage: Message = {
        role: 'assistant',
        content: extractAssistantText(rawMessage?.content),
      };
      setMessages((prev) => {
        const next: Message[] = [...prev, botMessage];
        messagesRef.current = next;
        return next;
      });
    } catch (error: unknown) {
      console.error(error);
      let errorMsg = 'Произошла ошибка';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          errorMsg = '❌ Неверный API ключ';
          setIsAuthOpen(true); // Prompt to re-enter
        } else if (error.response?.status === 429) {
          errorMsg = '⚠️ Превышен лимит запросов';
        } else if (error.response?.status && error.response.status >= 500) {
          errorMsg = '❌ Серверная ошибка, попробуйте позже';
        } else {
            errorMsg = `❌ Ошибка: ${error.message}`;
        }
      }
      setMessages((prev) => {
        const errMessage: Message = { role: 'assistant', content: errorMsg };
        const next: Message[] = [...prev, errMessage];
        messagesRef.current = next;
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    resetChat();
    if (apiKeyRef.current) void handleSendMessage('Привет');
  };

  const handleClearChat = () => {
    resetChat();
  };

  const handleModelSelect = (modelId: string) => {
    currentModelRef.current = modelId;
    setCurrentModel(modelId);
    setIsModelSelectorOpen(false);
    resetChat(); // "При выборе новой модели → АВТОМАТИЧЕСКАЯ ОЧИСТКА ЧАТА"
    if (apiKeyRef.current) {
      void handleSendMessage('Привет');
    } else {
      setPendingHello(true);
      setIsAuthOpen(true);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'row', height: '100vh', background: 'var(--dark-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--darker-bg)',
        padding: '1rem',
        gap: '1rem',
        flexShrink: 0
      }}>

        <div 
          onClick={() => setIsModelSelectorOpen(true)}
          style={{ 
            fontSize: '1.8rem', 
            fontWeight: 'bold', 
            background: providerGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'opacity 0.2s'
          }}
          title="Нажмите, чтобы сменить модель"
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          🤖 {providerLabel} | {currentModel}
        </div>

        <button 
          className="btn" 
          onClick={() => setIsModelSelectorOpen(true)}
          style={{ marginBottom: '1rem', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.05)', border: 'none', width: '100%' }}
        >
          <Settings size={16} />
          <span>Сменить модель</span>
        </button>

        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0.6rem',
            background: 'rgba(255,255,255,0.03)',
            marginBottom: '1rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>Провайдер</div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn"
              onClick={() => switchProvider('n1n')}
              style={{
                flex: 1,
                justifyContent: 'center',
                fontSize: '1.05rem',
                padding: '0.65rem 0.5rem',
                background: provider === 'n1n' ? 'rgba(102, 126, 234, 0.22)' : 'transparent',
                borderColor: provider === 'n1n' ? 'rgba(102, 126, 234, 0.5)' : 'var(--border)',
                color: provider === 'n1n' ? 'white' : '#a0a0a0',
              }}
            >
              n1n.ai
            </button>
            <button
              className="btn"
              onClick={() => switchProvider('openrouter')}
              style={{
                flex: 1,
                justifyContent: 'center',
                fontSize: '1.05rem',
                padding: '0.65rem 0.5rem',
                background: provider === 'openrouter' ? 'rgba(255, 138, 0, 0.18)' : 'transparent',
                borderColor: provider === 'openrouter' ? 'rgba(255, 138, 0, 0.5)' : 'var(--border)',
                color: provider === 'openrouter' ? 'white' : '#a0a0a0',
              }}
            >
              OpenRouter
            </button>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleNewChat}
          style={{ justifyContent: 'center', padding: '0.8rem' }}
        >
          <Plus size={18} />
          <span>Новый чат</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <button 
            className="btn" 
            onClick={handleClearChat}
            style={{ justifyContent: 'flex-start', background: 'transparent', border: 'none', color: '#ff6b6b', padding: '0.8rem' }}
          >
            <Trash2 size={18} />
            <span>Очистить чат</span>
          </button>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a0a0a0', fontSize: '0.8rem' }}>
          {activeApiKey ? (
            <>
              <div title="Ключ сохранен">🔑</div>
              <span>API ключ активен</span>
            </>
          ) : (
             <button onClick={() => setIsAuthOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
               Ввести API ключ
             </button>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Mobile Header - visible only on small screens */}
        <div className="mobile-header" style={{
           display: 'none',
           padding: '1rem',
           borderBottom: '1px solid var(--border)',
           background: 'var(--darker-bg)',
           alignItems: 'center',
           justifyContent: 'space-between'
        }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
             <div style={{ fontSize: '0.9rem', color: '#a0a0a0' }}>{providerLabel}</div>
             <div style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>{currentModel}</div>
           </div>
           <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
             <button className="btn" onClick={() => switchProvider(provider === 'n1n' ? 'openrouter' : 'n1n')} style={{ padding: '0.4rem 0.6rem' }}>
               {provider === 'n1n' ? 'OpenRouter' : 'n1n.ai'}
             </button>
             <button onClick={() => setIsModelSelectorOpen(true)} style={{ background: 'none', border: 'none', color: 'white' }}>
               <Settings size={20} />
             </button>
           </div>
        </div>

        <Chat 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={handleSendMessage} 
        />

        {toast && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '16px',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.65)',
              border: '1px solid var(--border)',
              color: 'white',
              padding: '0.6rem 0.9rem',
              borderRadius: '10px',
              backdropFilter: 'blur(10px)',
              maxWidth: '92%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              zIndex: 50,
            }}
          >
            {toast}
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onSetKey={handleSetKey} 
        providerLabel={providerLabel}
        accent={provider === 'openrouter' ? '#ff8a00' : '#667eea'}
      />
      
      {/* Conditionally render ModelSelector only when open to trigger fetch */}
      {isModelSelectorOpen && (
        <ModelSelector
          isOpen={isModelSelectorOpen}
          onClose={() => setIsModelSelectorOpen(false)}
          onSelectModel={handleModelSelect}
          currentModel={currentModel}
          apiKey={activeApiKey}
          provider={provider}
        />
      )}
      
      <style>{`
        @media (max-width: 768px) {
          .app-container {
            flex-direction: column !important;
          }
          aside {
            display: none !important;
          }
          .mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
