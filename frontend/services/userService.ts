export interface DoctorUser {
  username: string;
  doctorName: string;
  colegiadoNumber: number;
  licenseKey: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

const STORAGE_KEY = 'amie_registered_doctors';

const DEFAULT_USERS: DoctorUser[] = [
  {
    username: 'harold01',
    doctorName: 'Dr. Alejandro Morales Rivera',
    colegiadoNumber: 749210,
    licenseKey: 'LIC-2026-AMIE-749210',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
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
    return JSON.parse(data);
  } catch (err) {
    return DEFAULT_USERS;
  }
}

export function registerDoctorUser(user: Omit<DoctorUser, 'licenseKey' | 'createdAt' | 'status'>): DoctorUser {
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
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return newUser;
}

export function authenticateDoctor(username: string, colegiado: number): DoctorUser | null {
  const users = getRegisteredUsers();
  const cleanUser = username.trim().toLowerCase();
  
  const found = users.find(
    u => u.username.toLowerCase() === cleanUser && u.colegiadoNumber === Number(colegiado) && u.status === 'ACTIVE'
  );

  return found || null;
}
