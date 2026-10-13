// ============================================================================
// AMIE USER & AI CREDIT MANAGEMENT SERVICE
// ============================================================================

export interface UserProfile {
  username: string;
  doctorName: string;
  colegiadoNumber: number | string;
  availableAiCredits: number;
  role: 'Especialista' | 'Investigador' | 'Residente';
  lastSyncTimestamp: string;
  institution?: string;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  username: 'harold01',
  doctorName: 'Dr. Haroldo Ocaña',
  colegiadoNumber: 12345,
  availableAiCredits: 50,
  role: 'Especialista',
  lastSyncTimestamp: new Date().toISOString(),
  institution: 'AMIE Neurobiological Platform'
};

const STORAGE_KEY = 'amie_user_profile';
const CREDITS_EVENT = 'amie_credits_updated';

const BACKEND_URL = (import.meta as any).env?.VITE_API_URL || 'https://amieneurogical.onrender.com';

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Contexto restringido, cookies bloqueadas o modo privado estricto
  }
  return null;
}

function safeSetStorage(key: string, value: string): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch {
    // Cuota excedida o almacenamiento deshabilitado
  }
  return false;
}

function dispatchCreditsUpdateEvent(profile: UserProfile): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CREDITS_EVENT, { detail: profile }));
    }
  } catch {
    // Ignorar en entornos sin soporte para CustomEvent
  }
}

function getStoredAuthToken(): string {
  return safeGetStorage('amie_auth_token') || safeGetStorage('token') || '';
}

/**
 * Obtiene el perfil activo del médico registrado en LocalStorage o asigna el valor base de forma segura.
 */
export function getUserProfile(): UserProfile {
  const stored = safeGetStorage(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as UserProfile;
      if (parsed && typeof parsed === 'object' && typeof parsed.availableAiCredits === 'number') {
        return parsed;
      }
    } catch {
      // JSON corrupto, fallback al perfil por defecto
    }
  }

  // Comprobar si existe un username alternativo almacenado en login
  const activeUsername = safeGetStorage('amie_username') || safeGetStorage('amie_doctor_username');
  const initialProfile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    username: activeUsername || DEFAULT_USER_PROFILE.username,
    lastSyncTimestamp: new Date().toISOString()
  };

  safeSetStorage(STORAGE_KEY, JSON.stringify(initialProfile));
  return initialProfile;
}

/**
 * Actualiza el perfil completo del usuario y notifica reactivamente a toda la aplicación.
 */
export function updateUserProfile(partialProfile: Partial<UserProfile>): UserProfile {
  const current = getUserProfile();
  const updated: UserProfile = {
    ...current,
    ...partialProfile,
    lastSyncTimestamp: new Date().toISOString()
  };

  safeSetStorage(STORAGE_KEY, JSON.stringify(updated));
  dispatchCreditsUpdateEvent(updated);
  return updated;
}

/**
 * Verifica si el usuario dispone de créditos suficientes para una inferencia de IA.
 */
export function hasAvailableCredits(minimum: number = 1): boolean {
  const profile = getUserProfile();
  return profile.availableAiCredits >= minimum;
}

/**
 * Consume créditos de IA por cada análisis o consulta a Gemini.
 * Mantiene compatibilidad retornando el número de créditos remanentes.
 */
export function consumeAiCredit(username?: string, amount: number = 1): number {
  const profile = getUserProfile();
  const targetUser = username ? username.trim().toLowerCase() : profile.username.toLowerCase();

  // Si se pasa un usuario distinto al almacenado, sincronizamos la propiedad
  if (targetUser && profile.username.toLowerCase() !== targetUser) {
    profile.username = targetUser;
  }

  if (profile.availableAiCredits >= amount) {
    profile.availableAiCredits -= amount;
  } else {
    profile.availableAiCredits = 0;
  }

  profile.lastSyncTimestamp = new Date().toISOString();
  safeSetStorage(STORAGE_KEY, JSON.stringify(profile));
  dispatchCreditsUpdateEvent(profile);

  // Intentar sincronización en segundo plano con el backend en Render si hay token
  syncCreditsWithRemoteBackend(profile).catch(() => {});

  return profile.availableAiCredits;
}

/**
 * Recarga créditos de inferencia clínica en el sistema local y despacha el evento.
 */
export function rechargeAiCredits(amount: number = 20): number {
  const profile = getUserProfile();
  const rechargeValue = Number.isFinite(amount) && amount > 0 ? amount : 20;

  profile.availableAiCredits += rechargeValue;
  profile.lastSyncTimestamp = new Date().toISOString();
  
  safeSetStorage(STORAGE_KEY, JSON.stringify(profile));
  dispatchCreditsUpdateEvent(profile);

  syncCreditsWithRemoteBackend(profile).catch(() => {});

  return profile.availableAiCredits;
}

/**
 * Sincroniza asíncronamente el saldo de créditos con el backend en Render / MongoDB.
 */
export async function syncCreditsWithRemoteBackend(profile?: UserProfile): Promise<UserProfile> {
  const activeProfile = profile || getUserProfile();
  const token = getStoredAuthToken();

  if (!token) return activeProfile;

  try {
    const response = await fetch(`${BACKEND_URL}/api/user/credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username: activeProfile.username,
        availableAiCredits: activeProfile.availableAiCredits,
        lastSyncTimestamp: activeProfile.lastSyncTimestamp
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.availableAiCredits === 'number') {
        const syncedProfile: UserProfile = {
          ...activeProfile,
          availableAiCredits: data.availableAiCredits,
          lastSyncTimestamp: data.lastSyncTimestamp || new Date().toISOString()
        };
        safeSetStorage(STORAGE_KEY, JSON.stringify(syncedProfile));
        dispatchCreditsUpdateEvent(syncedProfile);
        return syncedProfile;
      }
    }
  } catch (err) {
    console.warn('[AMIE Credits] Sincronización remota pospuesta. Operando en caché local:', err);
  }

  return activeProfile;
}

/**
 * Hook/Suscripción reactiva para componentes React o servicios que monitoricen créditos.
 */
export function onCreditsUpdated(callback: (profile: UserProfile) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (event: Event) => {
    const customEvt = event as CustomEvent<UserProfile>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as UserProfile;
        callback(parsed);
      } catch {}
    }
  };

  window.addEventListener(CREDITS_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(CREDITS_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
