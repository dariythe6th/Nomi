import { Link } from 'react-router-dom';

export function LoginPage() {
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
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, marginBottom: 16 }}>Nomi</h1>
        <p style={{ color: '#a0a0b0', marginBottom: 32 }}>
          Найди своих друзей на карте
        </p>

        <Link
          to="/map"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#6c63ff',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 8,
            fontSize: 16,
          }}
        >
          Войти (демо)
        </Link>
      </div>
    </div>
  );
}