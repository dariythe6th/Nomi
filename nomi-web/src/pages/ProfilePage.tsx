import { useEffect, useRef, useState } from 'react';
import { useMyProfile } from '../features/profile/useMyProfile';

export function ProfilePage() {
  const { profile, loading, saveProfile, changeAvatar } = useMyProfile();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    queueMicrotask(() => {
      setName(profile.name);
      setStatus(profile.status);
    });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({ name: name.trim(), status: status.trim() });
    } finally {
      setSaving(false);
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой (максимум 5 МБ)');
      return;
    }
    setUploading(true);
    try {
      await changeAvatar(file);
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки: ' + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, color: 'var(--text)' }}>Загрузка профиля…</div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 24, color: 'var(--text)' }}>Профиль не найден</div>
    );
  }

  const initial = profile.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      <h1 style={{ color: 'var(--text)', marginBottom: 24 }}>Профиль</h1>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Аватар */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            onClick={handlePickFile}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 42,
              fontWeight: 700,
              cursor: 'pointer',
              overflow: 'hidden',
              border: '3px solid var(--accent)',
              boxShadow: '0 0 20px var(--accent-glow)',
              transition: '0.2s',
              opacity: uploading ? 0.5 : 1,
            }}
            title="Нажмите, чтобы загрузить аватар"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initial
            )}
          </div>

          <button
            onClick={handlePickFile}
            disabled={uploading}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              fontSize: 13,
              cursor: uploading ? 'wait' : 'pointer',
              opacity: uploading ? 0.5 : 1,
            }}
          >
            {uploading ? 'Загружаем…' : 'Сменить аватар'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Форма */}
        <div style={{ flex: 1, minWidth: 280, maxWidth: 480 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            Имя
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: 20,
              background: 'var(--input-bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />

          <label
            style={{
              display: 'block',
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            Статус
          </label>
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxLength={64}
            placeholder="Чем занимаешься?"
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: 20,
              background: 'var(--input-bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />

          <label
            style={{
              display: 'block',
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 6,
            }}
          >
            Email
          </label>
          <input
            type="text"
            value={profile.email}
            disabled
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: 20,
              background: 'var(--input-bg)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
              boxSizing: 'border-box',
              cursor: 'not-allowed',
            }}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}