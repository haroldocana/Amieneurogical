export interface DoctorUser {
  username: string;
  doctorName: string;
  colegiadoNumber: number;
  licenseKey: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  aiCredits: number;       // Consultas de IA disponibles
  aiCreditsLimit: number;  // Límite asignado por el administrador
}

const STORAGE_KEY = 'amie_registered_doctors';

const DEFAULT_USERS: DoctorUser[] = [
  {
    username: 'harold01',
    doctorName: 'Dr. Alejandro Morales Rivera',
    colegiadoNumber: 749210,
    licenseKey: 'LIC-2026-AMIE-749210',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    aiCredits: 100,
    aiCreditsLimit: 100
  }
];

export function getRegisteredUsers(): DoctorUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    const parsed = JSON.parse(data);
    // Asegurar compatibilidad agregando cuotas por defecto a usuarios antiguos
    return parsed.map((u: any) => ({
      ...u,
      aiCredits: u.aiCredits ?? 50,
      aiCreditsLimit: u.aiCreditsLimit ?? 50
    }));
  } catch (err) {
    return DEFAULT_USERS;
  }
}

export function registerDoctorUser(
  user: Omit<DoctorUser, 'licenseKey' | 'createdAt' | 'status' | 'aiCredits' | 'aiCreditsLimit'>,
  initialCredits: number = 50
): DoctorUser {
  const users = getRegisteredUsers();
  
  const existing = users.find(
    u => u.username.toLowerCase() === user.username.toLowerCase() || u.colegiadoNumber === user.colegiadoNumber
  );

  if (existing) {
    throw new Error(`El usuario ${user.username} o colegiado ${user.colegiadoNumber} ya está registrado.`);
  }

  const newUser: DoctorUser = {
    ...user,
    licenseKey: `LIC-2026-AMIE-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    aiCredits: initialCredits,
    aiCreditsLimit: initialCredits
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return newUser;
}

/**
 * Asigna o recarga la cuota de consultas de IA para un médico (Función Administrador)
 */
export function updateDoctorAiCredits(username: string, newLimit: number): DoctorUser {
  const users = getRegisteredUsers();
  const index = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

  if (index === -1) {
    throw new Error(`El médico ${username} no existe en la base de licencias.`);
  }

  users[index].aiCreditsLimit = newLimit;
  users[index].aiCredits = newLimit; // Reinicia la cuota disponible al nuevo límite

  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return users[index];
}

/**
 * Descuenta 1 crédito de IA antes de ejecutar una consulta al proxy Vertex AI.
 */
export function consumeAiCredit(username: string): number {
  const users = getRegisteredUsers();
  const cleanUser = username.trim().toLowerCase();
  const index = users.findIndex(u => u.username.toLowerCase() === cleanUser);

  if (index === -1) {
    throw new Error("Especialista no autenticado o no encontrado.");
  }

  if (users[index].aiCredits <= 0) {
    throw new Error(`Límite de consultas de IA alcanzado (${users[index].aiCreditsLimit}/${users[index].aiCreditsLimit}). Por favor, solicita una recarga de cuota al administrador.`);
  }

  users[index].aiCredits -= 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('amie_ai_credits', String(users[index].aiCredits));
  }

  return users[index].aiCredits;
}

export function authenticateDoctor(username: string, colegiado: number): DoctorUser | null {
  const users = getRegisteredUsers();
  const cleanUser = username.trim().toLowerCase();
  
  const found = users.find(
    u => u.username.toLowerCase() === cleanUser && u.colegiadoNumber === Number(colegiado) && u.status === 'ACTIVE'
  );

  if (found && typeof window !== 'undefined') {
    localStorage.setItem('amie_ai_credits', String(found.aiCredits));
    localStorage.setItem('amie_ai_credits_limit', String(found.aiCreditsLimit));
  }

  return found || null;
}
