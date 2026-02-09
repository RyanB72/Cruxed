const DEVICE_KEY = "cruxed_device_id";
const SESSION_PREFIX = "cruxed_session_";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export interface CompSession {
  participantId: string;
  displayName: string;
  categoryId: string;
  categoryName: string;
}

export function getCompSession(compId: string): CompSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${SESSION_PREFIX}${compId}`);
  return raw ? JSON.parse(raw) : null;
}

export function setCompSession(compId: string, data: CompSession): void {
  localStorage.setItem(`${SESSION_PREFIX}${compId}`, JSON.stringify(data));
}

export function clearCompSession(compId: string): void {
  localStorage.removeItem(`${SESSION_PREFIX}${compId}`);
}
