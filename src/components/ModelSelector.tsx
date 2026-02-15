import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { type Model, POPULAR_MODELS } from '../types';
import { Search, X, Loader2, Star } from 'lucide-react';

type Provider = 'n1n' | 'openrouter';

const OPENROUTER_POPULAR_MODELS = [
  'openai/gpt-4o',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-1.5-pro',
  'meta-llama/llama-3.1-70b',
  'x-ai/grok-2',
];

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (modelId: string) => void;
  currentModel: string;
  apiKey: string;
  provider: Provider;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  isOpen,
  onClose,
  onSelectModel,
  currentModel,
  apiKey,
  provider,
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint =
        provider === 'openrouter' ? 'https://openrouter.ai/api/v1/models' : 'https://api.n1n.ai/v1/models';

      const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'n1n.ai Chat';
      }

      const response = await axios.get(endpoint, { headers });
      const data = response.data.data || response.data;
      if (Array.isArray(data)) {
        setModels(data.slice(0, 50));
      } else {
        setError('Неверный формат ответа API');
      }
    } catch (err) {
      setError('Ошибка загрузки моделей');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, provider]);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSearch('');

    if (provider === 'openrouter') {
      setModels(OPENROUTER_POPULAR_MODELS.map((id) => ({ id, object: 'model', created: 0, owned_by: 'openrouter' })));
      setIsLoading(false);
      return;
    }

    if (models.length === 0) void fetchModels();
  }, [fetchModels, isOpen, models.length, provider]);

  useEffect(() => {
    setModels([]);
    setError('');
  }, [provider]);

  if (!isOpen) return null;

  const popularIds = provider === 'openrouter' ? OPENROUTER_POPULAR_MODELS : POPULAR_MODELS;
  const popularModels = models.filter((m) => popularIds.includes(m.id));
  const otherModels = models
    .filter((m) => !popularIds.includes(m.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  const filteredPopular = popularModels.filter((m) =>
    m.id.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOther = otherModels.filter((m) =>
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ height: '80vh', padding: '0', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'white' }}>Выберите модель</h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a0a0a0' }} />
            <input
              type="text"
              placeholder="Поиск модели..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
              autoFocus
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="spin" size={32} color="var(--primary)" />
            </div>
          ) : error ? (
            <div style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</div>
          ) : (
            <>
              {filteredPopular.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#a0a0a0', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Star size={14} fill="#f1c40f" color="#f1c40f" /> Популярные
                  </h4>
                  <div className="model-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    {filteredPopular.map((model) => (
                      <button
                        key={model.id}
                        className={`btn ${currentModel === model.id ? 'btn-primary' : ''}`}
                        style={{ justifyContent: 'center', fontSize: '0.85rem' }}
                        onClick={() => onSelectModel(model.id)}
                      >
                        {model.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredOther.length > 0 && (
                <div>
                  <h4 style={{ color: '#a0a0a0', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Все модели</h4>
                  <div className="model-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredOther.map((model) => (
                      <button
                        key={model.id}
                        className="btn"
                        style={{
                          justifyContent: 'flex-start',
                          background: currentModel === model.id ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                          borderColor: currentModel === model.id ? 'var(--primary)' : 'transparent',
                        }}
                        onClick={() => onSelectModel(model.id)}
                      >
                        {model.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
