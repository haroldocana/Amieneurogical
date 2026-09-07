export interface DoctorUser {
  username: string;
  doctorName: string;
  colegiadoNumber: number;
  licenseKey: string;
  password?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  expiresAt: string;       // Requerido para el control de tiempo de la licencia
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
    password: 'AMIE_2025_SECURE',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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
    return parsed.map((u: any) => ({
      ...u,
      password: u.password || 'AMIE_2025_SECURE',
      expiresAt: u.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      aiCredits: u.aiCredits ?? 100,
      aiCreditsLimit: u.aiCreditsLimit ?? 100
    }));
  } catch (err) {
    return DEFAULT_USERS;
  }
}

/**
 * Registra o emite una nueva licencia asignando opcionalmente contraseña inicial y cuota de IA.
 */
export function registerDoctorUser(
  user: Omit<DoctorUser, 'licenseKey' | 'createdAt' | 'expiresAt' | 'status' | 'aiCredits' | 'aiCreditsLimit'>,
  initialCredits: number = 100,
  initialPassword?: string
): DoctorUser {
  const users = getRegisteredUsers();
  
  const existing = users.find(
    u => u.username.toLowerCase() === user.username.toLowerCase() || u.colegiadoNumber === user.colegiadoNumber
  );

  if (existing) {
    throw new Error(`El usuario ${user.username} o colegiado ${user.colegiadoNumber} ya está registrado.`);
  }

  const assignedPassword = initialPassword && initialPassword.trim() ? initialPassword.trim() : (user.password || 'AMIE_2026_SECURE');

  const newUser: DoctorUser = {
    ...user,
    password: assignedPassword,
    licenseKey: `LIC-2026-AMIE-${user.colegiadoNumber}`,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    aiCredits: initialCredits,
    aiCreditsLimit: initialCredits
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return newUser;
}

/**
 * Permite al médico actualizar/resetear su contraseña de acceso personal.
 */
export function updateDoctorPassword(username: string, newPass: string): void {
  const users = getRegisteredUsers();
  const index = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (index === -1) throw new Error("Especialista no encontrado en el sistema.");
  users[index].password = newPass;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

/**
 * Asigna o recarga la cuota de consultas de IA para un médico (Función Administrador).
 */
export function updateDoctorAiCredits(username: string, newLimit: number): DoctorUser {
  const users = getRegisteredUsers();
  const index = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

  if (index === -1) {
    throw new Error(`El médico ${username} no existe en la base de licencias.`);
  }

  users[index].aiCreditsLimit = newLimit;
  users[index].aiCredits = newLimit;

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
    throw new Error(`Límite de consultas de IA alcanzado (${users[index].aiCreditsLimit}/${users[index].aiCreditsLimit}). Solicita un incremento de cuota.`);
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
