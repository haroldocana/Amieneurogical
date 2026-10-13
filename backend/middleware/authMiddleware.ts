import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'AMIE_CLINICAL_SUPER_SECRET_KEY_2026';

export interface UserPayload {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'THERAPIST' | 'PATIENT_SESSION';
  organizationId?: string;
  colegiadoNumber?: number;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// 🟢 1. AUTENTICACIÓN ESTRICTA (Para la Chromebook y Consultas Médicas)
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Acceso denegado. Token de sesión no proporcionado.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      organizationId: decoded.organizationId,
      colegiadoNumber: decoded.colegiadoNumber
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de sesión inválido o expirado. Inicie sesión nuevamente.' 
    });
  }
};

// 🟢 2. AUTORIZACIÓN PARA ADMINISTRADORES
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CLINIC_ADMIN')) {
    return res.status(403).json({ 
      success: false, 
      error: 'Privilegios insuficientes. Se requiere rol de Administrador.' 
    });
  }
  next();
};

// 🟢 3. AUTENTICACIÓN FLEXIBLE PARA LA TELEMETRÍA VR
// Si viene el token del doctor lo asocia, si es la Pico 3 lo deja pasar sin bloquear MongoDB
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      req.user = decoded;
    }
  } catch (e) {
    // Si el token es inválido o no existe, permitimos continuar como sesión de visor VR
    req.user = undefined;
  }
  next();
};
