const CREDENTIALS_KEY = 'torre_forte_admin_credentials';
const SESSION_KEY = 'torre_forte_admin_session';

interface AdminCredentials {
  name: string;
  passwordHash: string;
}

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hasRegisteredAdmin(): boolean {
  return localStorage.getItem(CREDENTIALS_KEY) !== null;
}

export function hasActiveSession(): boolean {
  return localStorage.getItem(SESSION_KEY) === 'true';
}

export function getRegisteredAdminName(): string | null {
  const saved = localStorage.getItem(CREDENTIALS_KEY);
  if (!saved) return null;
  try {
    return (JSON.parse(saved) as AdminCredentials).name;
  } catch {
    return null;
  }
}

export async function registerAdmin(name: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  const credentials: AdminCredentials = { name, passwordHash };
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  localStorage.setItem(SESSION_KEY, 'true');
}

export async function loginAdmin(password: string): Promise<boolean> {
  const saved = localStorage.getItem(CREDENTIALS_KEY);
  if (!saved) return false;
  const credentials = JSON.parse(saved) as AdminCredentials;
  const passwordHash = await hashPassword(password);
  if (passwordHash !== credentials.passwordHash) return false;
  localStorage.setItem(SESSION_KEY, 'true');
  return true;
}

export function logoutAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
