import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { DoctorUserModel, OrganizationModel } from '../models/AuthAndLicenseModels';

// Extensión para solicitudes autenticadas
export interface AuthRequest extends Request {
  user?: {
    id?: string;
    username?: string;
    email?: string;
    role?: string;
    name?: string;
    collegiateNumber?: string;
    hospitalName?: string;
    organizationId?: string;
  };
}

/**
 * Búsqueda segura y polimórfica de médico por ObjectId, username o email.
 * Si el usuario no existe en la BD (ej. primer inicio o demo 'harold01'), 
 * lo auto-aprovisiona con licencia activa y bolsón de bienvenida.
 */
const findOrCreateDoctorSafely = async (identifier: string) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  
  let doctor = isObjectId
    ? await DoctorUserModel.findById(identifier).populate('organizationId')
    : await DoctorUserModel.findOne({ 
        $or: [{ username: identifier }, { email: identifier.toLowerCase().trim() }] 
      }).populate('organizationId');

  // Si no existe, se genera el registro inicial para no bloquear la consulta clínica
  if (!doctor) {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    doctor = await DoctorUserModel.create({
      username: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      email: identifier.includes('@') ? identifier.toLowerCase().trim() : `${identifier}@amie-clinical.org`,
      fullName: 'Dr. Alejandro Morales Rivera',
      accountType: 'INDIVIDUAL',
      personalLicense: {
        isActive: true,
        validUntil: oneYearFromNow,
        tier: 'PRO_CLINICAL'
      },
      personalAiQuotaPool: {
        totalTokensPurchased: 100,
        tokensUsed: 0,
        lastRefillDate: new Date()
      },
      authMethod: 'LOCAL'
    });
  }

  return doctor;
};

// -----------------------------------------------------------------------
// 1. DESCUENTO ATÓMICO DE TOKENS DEL BOLSÓN DE IA
// -----------------------------------------------------------------------
export const consumeAiTokens = async (
  userId: string, 
  tokensToConsume: number = 1
): Promise<{ success: boolean; remaining: number; message?: string }> => {
  try {
    const doctor: any = await findOrCreateDoctorSafely(userId);
    if (!doctor) {
      return { success: false, remaining: 0, message: 'Usuario médico no encontrado.' };
    }

    const now = new Date();

    // A) MÉDICO INDEPENDIENTE
    if (doctor.accountType === 'INDIVIDUAL') {
      const validUntil = doctor.personalLicense?.validUntil ? new Date(doctor.personalLicense.validUntil) : null;
      const isActive = doctor.personalLicense?.isActive ?? true;

      if (!isActive || (validUntil && now > validUntil)) {
        return { 
          success: false, 
          remaining: 0, 
          message: 'Su licencia individual ha expirado. Por favor, extienda su suscripción médica.' 
        };
      }

      const total = doctor.personalAiQuotaPool?.totalTokensPurchased ?? 100;
      const used = doctor.personalAiQuotaPool?.tokensUsed ?? 0;
      const remaining = total - used;

      if (remaining < tokensToConsume) {
        return { 
          success: false, 
          remaining: Math.max(0, remaining), 
          message: `Bolsón de IA agotado. Disponibles: ${remaining}, Requeridos: ${tokensToConsume}. Adquiera más créditos.` 
        };
      }

      doctor.personalAiQuotaPool.tokensUsed = used + tokensToConsume;
      await doctor.save();

      return { 
        success: true, 
        remaining: Math.max(0, total - doctor.personalAiQuotaPool.tokensUsed) 
      };
    }

    // B) MÉDICO CORPORATIVO (HOSPITAL / CLÍNICA)
    if (doctor.accountType === 'CORPORATE_MEMBER' && doctor.organizationId) {
      const org: any = await OrganizationModel.findById(doctor.organizationId);
      const orgValidUntil = org?.corporateLicense?.validUntil ? new Date(org.corporateLicense.validUntil) : null;
      const orgIsActive = org?.corporateLicense?.isActive ?? true;

      if (!org || !orgIsActive || (orgValidUntil && now > orgValidUntil)) {
        return { 
          success: false, 
          remaining: 0, 
          message: 'La licencia de su institución hospitalaria está inactiva o vencida.' 
        };
      }

      const orgTotal = org.globalAiQuotaPool?.totalTokensPurchased ?? 0;
      const orgUsed = org.globalAiQuotaPool?.tokensUsed ?? 0;
      const orgRemaining = orgTotal - orgUsed;

      if (orgRemaining < tokensToConsume) {
        return { 
          success: false, 
          remaining: Math.max(0, orgRemaining), 
          message: 'El bolsón global de IA de la institución ha sido agotado.' 
        };
      }

      org.globalAiQuotaPool.tokensUsed = orgUsed + tokensToConsume;
      if (!doctor.corporateAssignedQuota) doctor.corporateAssignedQuota = { usedTokens: 0 };
      doctor.corporateAssignedQuota.usedTokens = (doctor.corporateAssignedQuota.usedTokens || 0) + tokensToConsume;

      await org.save();
      await doctor.save();

      return { 
        success: true, 
        remaining: Math.max(0, orgTotal - org.globalAiQuotaPool.tokensUsed) 
      };
    }

    return { success: false, remaining: 0, message: 'Tipo de cuenta no autorizado para procesar telemetría.' };
  } catch (error: any) {
    console.error('Error en consumeAiTokens:', error);
    return { success: false, remaining: 0, message: error.message || 'Error debitando cuota de IA.' };
  }
};

// -----------------------------------------------------------------------
// 2. SOLICITUD DE RESETEO DE CONTRASEÑA
// -----------------------------------------------------------------------
export const requestPasswordReset = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Debe proporcionar un correo electrónico válido.' });
    }

    const doctor: any = await DoctorUserModel.findOne({ email: email.toLowerCase().trim() });
    if (!doctor) {
      return res.status(404).json({ error: 'No existe una cuenta registrada con este correo electrónico.' });
    }

    if (doctor.accountType === 'CORPORATE_MEMBER') {
      return res.status(403).json({ 
        error: `Su cuenta pertenece a una red institucional. Restablezca su clave desde el portal SSO de su hospital (${doctor.authMethod || 'SAML/SSO'}).` 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    doctor.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    doctor.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora
    await doctor.save();

    const frontendBaseUrl = process.env.FRONTEND_URL || 'https://amieneurogical-frontend.onrender.com';
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}`;

    return res.status(200).json({ 
      success: true,
      message: 'Enlace de restablecimiento generado con éxito.',
      resetUrl 
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------------------------------------------------
// 3. RECARGA DE BOLSÓN Y EXTENSIÓN MULTIANUAL (1, 2 O 3 AÑOS)
// -----------------------------------------------------------------------
export const refillQuotaAndLicense = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { targetId, isOrganization, addTokens, extensionYears } = req.body;

    if (!targetId) {
      return res.status(400).json({ error: 'Debe especificar el targetId (ID de médico u organización).' });
    }

    const tokensToAdd = Number(addTokens) || 0;
    const yearsToAdd = Number(extensionYears) || 0;

    if (isOrganization) {
      const org: any = await OrganizationModel.findById(targetId);
      if (!org) return res.status(404).json({ error: 'Organización hospitalaria no encontrada.' });

      org.globalAiQuotaPool.totalTokensPurchased = (org.globalAiQuotaPool.totalTokensPurchased || 0) + tokensToAdd;

      if (yearsToAdd > 0) {
        const baseDate = org.corporateLicense?.validUntil && new Date(org.corporateLicense.validUntil) > new Date()
          ? new Date(org.corporateLicense.validUntil)
          : new Date();
        baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);
        org.corporateLicense.validUntil = baseDate;
        org.corporateLicense.isActive = true;
      }

      await org.save();
      return res.status(200).json({ 
        success: true, 
        message: 'Bolsón y extensión corporativa aplicados con éxito.', 
        organization: org 
      });
    } else {
      const doctor: any = await findOrCreateDoctorSafely(targetId);
      if (!doctor) return res.status(404).json({ error: 'Médico no encontrado.' });

      doctor.personalAiQuotaPool.totalTokensPurchased = (doctor.personalAiQuotaPool.totalTokensPurchased || 0) + tokensToAdd;
      doctor.personalAiQuotaPool.lastRefillDate = new Date();

      if (yearsToAdd > 0) {
        const baseDate = doctor.personalLicense?.validUntil && new Date(doctor.personalLicense.validUntil) > new Date()
          ? new Date(doctor.personalLicense.validUntil)
          : new Date();
        baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);
        doctor.personalLicense.validUntil = baseDate;
        doctor.personalLicense.isActive = true;
      }

      await doctor.save();
      return res.status(200).json({ 
        success: true, 
        message: 'Bolsón y extensión de licencia médica aplicados con éxito.', 
        doctor 
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// -----------------------------------------------------------------------
// 4. PERFIL SAAS PARA EL FRONTEND (AdminSaaSPanel y Header)
// -----------------------------------------------------------------------
export const getSaasProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id || req.user?.username || 'PAC-8104';
    const doctor: any = await findOrCreateDoctorSafely(String(userId));

    const total = doctor.personalAiQuotaPool?.totalTokensPurchased ?? 100;
    const used = doctor.personalAiQuotaPool?.tokensUsed ?? 0;
    const available = Math.max(0, total - used);

    const now = new Date();
    const expiry = doctor.personalLicense?.validUntil ? new Date(doctor.personalLicense.validUntil) : new Date(now.getTime() + 365 * 86400000);
    const diffDays = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return res.status(200).json({
      success: true,
      data: {
        id: doctor._id,
        username: doctor.username,
        name: doctor.fullName || doctor.name || 'Dr. Alejandro Morales Rivera',
        licenseDaysRemaining: diffDays,
        aiTokensTotal: total,
        aiTokensUsed: used,
        aiTokensAvailable: available,
        accountType: doctor.accountType || 'INDIVIDUAL',
        tier: doctor.personalLicense?.tier || 'PRO_CLINICAL'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// -----------------------------------------------------------------------
// 5. RECARGA DIRECTA DE TOKENS DESDE LA CONSOLA
// -----------------------------------------------------------------------
export const rechargeAiTokens = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id || req.user?.username;
    const { amount } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado.' });
    }

    const tokens = Number(amount);
    if (isNaN(tokens) || tokens <= 0) {
      return res.status(400).json({ success: false, error: 'El monto de recarga debe ser mayor a 0.' });
    }

    const doctor: any = await findOrCreateDoctorSafely(String(userId));
    doctor.personalAiQuotaPool.totalTokensPurchased = (doctor.personalAiQuotaPool.totalTokensPurchased || 0) + tokens;
    doctor.personalAiQuotaPool.lastRefillDate = new Date();
    await doctor.save();

    const total = doctor.personalAiQuotaPool.totalTokensPurchased;
    const used = doctor.personalAiQuotaPool.tokensUsed || 0;

    return res.status(200).json({
      success: true,
      message: `¡Recarga de ${tokens} tokens acreditada con éxito!`,
      data: {
        aiTokensTotal: total,
        aiTokensUsed: used,
        aiTokensAvailable: Math.max(0, total - used)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
