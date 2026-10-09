import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, describeAuthError } from '../features/auth/api';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerUser(email, password, name);
      navigate('/map');
    } catch (err) {
      const code = (err as { code?: string })?.code ?? 'unknown';
      setError(describeAuthError(code));
    } finally {
      setLoading(false);
    }
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
        height: '100vh',
        background: '#1a1a2e',
        color: '#fff',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          padding: 32,
          background: '#232342',
          borderRadius: 16,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <h1 style={{ textAlign: 'center', fontSize: 32, marginBottom: 8, letterSpacing: 2 }}>
          Nomi
        </h1>
        <p style={{ textAlign: 'center', color: '#a0a0b0', marginBottom: 24, fontSize: 13 }}>
          Создайте аккаунт
        </p>

        <label style={{ fontSize: 12, color: '#a0a0b0' }}>Имя</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={32}
          style={inputStyle}
        />

        <label style={{ fontSize: 12, color: '#a0a0b0' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={inputStyle}
        />

        <label style={{ fontSize: 12, color: '#a0a0b0' }}>Пароль (минимум 6 символов)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
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
          {loading ? 'Создаём…' : 'Зарегистрироваться'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#a0a0b0' }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: '#0ABAB5' }}>
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}