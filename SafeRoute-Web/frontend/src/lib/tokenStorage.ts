const TOKEN_KEY = "token";
const USER_KEY = "user";
const STORAGE_FLAG_KEY = "auth_storage";

let memoryToken: string | null = null;
let memoryUser: string | null = null;
let validated = false;

function isPageRefresh(): boolean {
  if (typeof window === "undefined" || typeof performance === "undefined") return false;
  try {
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return entries.length > 0 && entries[0].type === "reload";
  } catch {
    return false;
  }
}

export function saveAuth(
  token: string,
  user: object,
  remember: boolean
): void {
  const userStr = JSON.stringify(user);
  localStorage.setItem(STORAGE_FLAG_KEY, remember ? "local" : "session");

  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, userStr);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, userStr);
    memoryToken = token;
    memoryUser = userStr;
    validated = true;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const flag = localStorage.getItem(STORAGE_FLAG_KEY);
  if (!flag) return null;

  if (flag === "local") {
    return localStorage.getItem(TOKEN_KEY);
  }

  if (memoryToken) return memoryToken;

  if (!validated) {
    validated = true;
    const stored = sessionStorage.getItem(TOKEN_KEY);

    if (stored && isPageRefresh()) {
      memoryToken = stored;
      memoryUser = sessionStorage.getItem(USER_KEY);
      return memoryToken;
    }

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  return null;
}

export function getUser(): string | null {
  if (typeof window === "undefined") return null;

  const flag = localStorage.getItem(STORAGE_FLAG_KEY);
  if (!flag) return null;

  if (flag === "local") {
    return localStorage.getItem(USER_KEY);
  }

  getToken();
  return memoryUser;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(STORAGE_FLAG_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  memoryToken = null;
  memoryUser = null;
  validated = false;
}
