// ============================================================================
// AMIE USER & AI CREDIT MANAGEMENT SERVICE
// ============================================================================

export interface UserProfile {
  username: string;
  doctorName: string;
  colegiadoNumber: number;
  availableAiCredits: number;
  role: 'Especialista' | 'Investigador' | 'Residente';
  lastSyncTimestamp: string;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  username: 'harold01',
  doctorName: 'Dr. Haroldo Ocaña',
  colegiadoNumber: 12345,
  availableAiCredits: 50,
  role: 'Especialista',
  lastSyncTimestamp: new Date().toISOString()
};

/**
 * Obtiene el perfil activo del médico registrado en LocalStorage o asigna el valor base.
 */
export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_USER_PROFILE;

  const stored = localStorage.getItem('amie_user_profile');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  }

  localStorage.setItem('amie_user_profile', JSON.stringify(DEFAULT_USER_PROFILE));
  return DEFAULT_USER_PROFILE;
}

/**
 * Consume 1 crédito de IA por cada análisis o consulta a Gemini 3.8 Flash.
 */
export function consumeAiCredit(username: string): number {
  if (typeof window === 'undefined') return 50;

  const profile = getUserProfile();
  if (profile.availableAiCredits > 0) {
    profile.availableAiCredits -= 1;
    profile.lastSyncTimestamp = new Date().toISOString();
    localStorage.setItem('amie_user_profile', JSON.stringify(profile));
  }

  return profile.availableAiCredits;
}

/**
 * Recarga créditos de inferencia clínica en el sistema.
 */
export function rechargeAiCredits(amount: number = 20): number {
  if (typeof window === 'undefined') return 50;

  const profile = getUserProfile();
  profile.availableAiCredits += amount;
  localStorage.setItem('amie_user_profile', JSON.stringify(profile));
  return profile.availableAiCredits;
}
