import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../shared/theme/useTheme';
import { logoutUser } from '../../features/auth/api';
import { useMyProfile } from '../../features/profile/useMyProfile';

/* ===== SVG-иконки ===== */

const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21 1 6" />
    <line x1="8" y1="3" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="21" />
  </svg>
);

const FriendsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const GameIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="6" />
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UserSilhouetteIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="#ffffff"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21 C4 15 8 13 12 13 C16 13 20 15 20 21 Z" />
  </svg>
);

/* ===== Пункты меню ===== */

const navItems = [
  { to: '/map', label: 'Карта', Icon: MapIcon },
  { to: '/friends', label: 'Друзья', Icon: FriendsIcon },
  { to: '/chats', label: 'Чаты', Icon: ChatIcon },
  { to: '/game', label: 'Игра', Icon: GameIcon },
];

/* ===== Layout ===== */

export function MainLayout() {
  const { theme, toggle } = useTheme();
  const { profile } = useMyProfile();
  const navigate = useNavigate();
  const location = useLocation();

  // На карте меню плавает поверх — отступ не нужен
  const isMapPage = location.pathname === '/map';

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Шапка */}
      <header
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          height: 60,
          padding: '0 20px',
          background: 'var(--bg-header)',
          color: 'var(--text-header)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            color: 'var(--text-header)',
          }}
        >
          Nomi
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggle}
            title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'transparent',
              color: 'var(--text-header)',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          <Link
            to="/profile"
            title="Профиль"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              border: '2px solid var(--accent)',
              boxShadow: '0 0 10px var(--accent-glow)',
              overflow: 'hidden',
            }}
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <UserSilhouetteIcon />
            )}
          </Link>

          <button
            onClick={handleLogout}
            title="Выйти из аккаунта"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'transparent',
              color: 'var(--text-header)',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
              transition: '0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = '#ff4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }}
          >
            <LogoutIcon />
            <span>Выйти</span>
          </button>
        </div>
      </header>

      {/* Основная область */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Меню — по центру слева */}
        <nav
          style={{
            position: 'absolute',
            top: '50%',
            left: 20,
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            padding: 8,
            background: 'var(--bg-header)',
            border: '1px solid var(--border-strong)',
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            zIndex: 1100,
          }}
        >
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 10,
                color: isActive ? 'var(--accent)' : 'var(--text-header)',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                textDecoration: 'none',
                transition: '0.15s',
                whiteSpace: 'nowrap',
              })}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <main
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            // На всех страницах кроме карты оставляем место под меню
            paddingLeft: isMapPage ? 0 : 180,
            boxSizing: 'border-box',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}