// utils/session.ts
export type SupabaseSession = { user?: { id: string; email?: string }; access_token?: string } | null;

export const setSession = (session: SupabaseSession) => {
  localStorage.setItem('supabase_session', JSON.stringify(session));
  localStorage.setItem('ft_logged_in', '1');
  localStorage.setItem('ft_last_changed', String(Date.now()));
  window.dispatchEvent(new Event('authChange'));
};

export const clearSession = () => {
  localStorage.removeItem('supabase_session');
  localStorage.removeItem('ft_logged_in');
  localStorage.setItem('ft_last_changed', String(Date.now()));
  window.dispatchEvent(new Event('authChange'));
};

export const getSession = (): SupabaseSession | null => {
  const session = localStorage.getItem('supabase_session');
  return session ? JSON.parse(session) : null;
};
