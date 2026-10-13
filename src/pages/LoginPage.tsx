import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, describeAuthError } from '../features/auth/api';
import {
  getSavedAccounts,
  saveAccount,
  removeAccount,
  type SavedAccount,
} from '../features/auth/savedAccounts';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedAccount[]>(() => getSavedAccounts());
  const [quickLoadingId, setQuickLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  /** Обычный вход через форму */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = await loginUser(email, password);
      // Сохраняем для быстрого входа в следующий раз
      saveAccount(email, password, u.displayName || email);
      navigate('/map');
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'unknown';
      setError(describeAuthError(code));
    } finally {
      setLoading(false);
    }
  };

  /** Быстрый вход по сохранённому аккаунту */
  const handleQuickLogin = async (acc: SavedAccount) => {
    setError(null);
    setQuickLoadingId(acc.id);
    try {
      await loginUser(acc.email, acc.password);
      navigate('/map');
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'unknown';
      setError(`Не удалось войти как ${acc.name}: ${describeAuthError(code)}`);
      // Если пароль изменился — удаляем сохранёнку
      if (code.includes('password') || code.includes('credential')) {
        removeAccount(acc.id);
        setSaved(getSavedAccounts());
      }
    } finally {
      setQuickLoadingId(null);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeAccount(id);
    setSaved(getSavedAccounts());
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    margin: '6px 0 16px',
    background: '#1a1a2e',
    border: '1px solid #3a3a5e',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
        background: '#1a1a2e',
        color: '#fff',
        padding: 24,
      }}
    >
      <div style={{ width: 340 }}>
        {/* === Сохранённые аккаунты === */}
        {saved.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                color: '#a0a0b0',
                marginBottom: 8,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Быстрый вход
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {saved.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: '#232342',
                    borderRadius: 10,
                    cursor: quickLoadingId ? 'wait' : 'pointer',
                    transition: '0.15s',
                    border: '1px solid transparent',
                    opacity: quickLoadingId && quickLoadingId !== acc.id ? 0.5 : 1,
                  }}
                  onClick={() => !quickLoadingId && handleQuickLogin(acc)}
                  onMouseEnter={(e) => {
                    if (!quickLoadingId)
                      e.currentTarget.style.borderColor = acc.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: acc.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {acc.name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {acc.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#a0a0b0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {acc.email}
                    </div>
                  </div>
                  {quickLoadingId === acc.id ? (
                    <span style={{ fontSize: 12, color: '#a0a0b0' }}>…</span>
                  ) : (
                    <button
                      onClick={(e) => handleRemove(acc.id, e)}
                      title="Удалить из сохранённых"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'transparent',
                        color: '#a0a0b0',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        lineHeight: 1,
                        padding: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ff8080')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#a0a0b0')}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                textAlign: 'center',
                color: '#5a5a7a',
                fontSize: 11,
                margin: '12px 0',
              }}
            >
              или войти под другим
            </div>
          </div>
        )}

        {/* === Обычная форма === */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 32,
            background: '#232342',
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h1
            style={{
              textAlign: 'center',
              fontSize: 32,
              marginBottom: 8,
              letterSpacing: 2,
            }}
          >
            Nomi
          </h1>
          <p
            style={{
              textAlign: 'center',
              color: '#a0a0b0',
              marginBottom: 24,
              fontSize: 13,
            }}
          >
            Войдите, чтобы продолжить
          </p>

          <label style={{ fontSize: 12, color: '#a0a0b0' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={inputStyle}
          />

          <label style={{ fontSize: 12, color: '#a0a0b0' }}>Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={inputStyle}
          />

          {error && (
            <div
              style={{
                padding: 10,
                marginBottom: 12,
                background: 'rgba(255, 68, 68, 0.15)',
                border: '1px solid #ff4444',
                borderRadius: 8,
                color: '#ff8080',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              background: '#0ABAB5',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>

          <p
            style={{
              textAlign: 'center',
              marginTop: 16,
              fontSize: 13,
              color: '#a0a0b0',
            }}
          >
            Нет аккаунта?{' '}
            <Link to="/register" style={{ color: '#0ABAB5' }}>
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}