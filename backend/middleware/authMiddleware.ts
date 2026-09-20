import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'AMIE_CLINICAL_SUPER_SECRET_KEY_2026';

// Extendemos el Request de Express para inyectar el usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    organizationId?: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso denegado. Token de autorización no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Inyectamos los datos del usuario en la petición
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      organizationId: decoded.organizationId
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token de sesión inválido o expirado. Inicie sesión nuevamente.' });
  }
};

// Middleware exclusivo para administradores (SuperAdmin / ClinicAdmin)
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'CLINIC_ADMIN')) {
    return res.status(403).json({ error: 'Privilegios insuficientes. Se requiere rol de Administrador.' });
  }
  next();
};
