import React, { useEffect, useState } from 'react';
import { Key } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSetKey: (key: string) => void;
  providerLabel: string;
  accent: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSetKey, providerLabel, accent }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setKey('');
    setError('');
  }, [isOpen, providerLabel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Введите API ключ');
      return;
    }
    if (!key.startsWith('sk-')) {
      setError('Ключ должен начинаться с "sk-"');
      return;
    }
    onSetKey(key.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'white' }}>
          <Key size={24} color={accent} />
          Авторизация {providerLabel}
        </h2>
        <p style={{ marginBottom: '1.5rem', color: '#a0a0a0', fontSize: '0.9rem' }}>
          Введите ваш API ключ для доступа к моделям. Ключ будет сохранен локально в вашем браузере.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="sk-..."
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError('');
              }}
              autoFocus
            />
            {error && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};
