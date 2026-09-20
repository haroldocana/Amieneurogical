import { Request, Response } from 'express';
import { DoctorUserModel, OrganizationModel } from '../models/AuthAndLicenseModels';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// -----------------------------------------------------------------------
// 1. CONSUMO Y DESCUENTO DEL BOLSÓN DE IA (Middleware / Helper)
// -----------------------------------------------------------------------
export const consumeAiTokens = async (userId: string, tokensToConsume: number = 1): Promise<{ success: boolean; remaining: number; message?: string }> => {
  const doctor = await DoctorUserModel.findById(userId).populate('organizationId');
  if (!doctor) return { success: false, remaining: 0, message: 'Usuario médico no encontrado.' };

  // CASO A: MÉDICO INDEPENDIENTE
  if (doctor.accountType === 'INDIVIDUAL') {
    if (!doctor.personalLicense.isActive || new Date() > new Date(doctor.personalLicense.validUntil)) {
      return { success: false, remaining: 0, message: 'Su licencia individual ha expirado. Por favor, extienda su suscripción.' };
    }
    const remaining = doctor.personalAiQuotaPool.totalTokensPurchased - doctor.personalAiQuotaPool.tokensUsed;
    if (remaining < tokensToConsume) {
      return { success: false, remaining, message: 'Bolsón de IA personal agotado. Adquiera más créditos.' };
    }
    doctor.personalAiQuotaPool.tokensUsed += tokensToConsume;
    await doctor.save();
    return { success: true, remaining: doctor.personalAiQuotaPool.totalTokensPurchased - doctor.personalAiQuotaPool.tokensUsed };
  }

  // CASO B: MÉDICO CORPORATIVO (HOSPITAL)
  if (doctor.accountType === 'CORPORATE_MEMBER' && doctor.organizationId) {
    const org = await OrganizationModel.findById(doctor.organizationId);
    if (!org || !org.corporateLicense.isActive || new Date() > new Date(org.corporateLicense.validUntil)) {
      return { success: false, remaining: 0, message: 'La licencia institucional de su hospital se encuentra inactiva o vencida.' };
    }
    const orgRemaining = org.globalAiQuotaPool.totalTokensPurchased - org.globalAiQuotaPool.tokensUsed;
    if (orgRemaining < tokensToConsume) {
      return { success: false, remaining: orgRemaining, message: 'El bolsón global de IA de la institución ha sido agotado.' };
    }
    // Descuenta del bolsón global del hospital y de la cuota del usuario
    org.globalAiQuotaPool.tokensUsed += tokensToConsume;
    doctor.corporateAssignedQuota.usedTokens += tokensToConsume;
    await org.save();
    await doctor.save();
    return { success: true, remaining: org.globalAiQuotaPool.totalTokensPurchased - org.globalAiQuotaPool.tokensUsed };
  }

  return { success: false, remaining: 0, message: 'Tipo de cuenta no autorizado.' };
};

// -----------------------------------------------------------------------
// 2. SOLICITAR RESETEO DE CONTRASEÑA (Para Médicos Independientes)
// -----------------------------------------------------------------------
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const doctor = await DoctorUserModel.findOne({ email: email.toLowerCase().trim() });

    if (!doctor) {
      return res.status(404).json({ error: 'No existe una cuenta registrada con este correo electrónico.' });
    }

    if (doctor.accountType === 'CORPORATE_MEMBER') {
      return res.status(403).json({ 
        error: `Cuenta gestionada corporativamente por su institución (${doctor.authMethod}). Restablezca su clave a través del departamento de TI de su hospital.` 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    doctor.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    doctor.passwordResetExpires = new Date(Date.now() + 3600000); // 1 Hora de validez
    await doctor.save();

    // Aquí integrar servicio de envío de email (SendGrid, AWS SES, Resend, etc.)
    return res.status(200).json({ 
      message: 'Enlace de restablecimiento generado.',
      resetTokenUrl: `https://aima.health/reset-password?token=${resetToken}` 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------------------------------
// 3. RECARGA DE BOLSÓN Y EXTENSIÓN DE LICENCIA (1, 2 O 3 AÑOS)
// -----------------------------------------------------------------------
export const refillQuotaAndLicense = async (req: Request, res: Response) => {
  try {
    const { targetId, isOrganization, addTokens, extensionYears } = req.body;

    if (isOrganization) {
      const org = await OrganizationModel.findById(targetId);
      if (!org) return res.status(404).json({ error: 'Organización no encontrada.' });

      org.globalAiQuotaPool.totalTokensPurchased += addTokens || 0;
      if (extensionYears && extensionYears > 0) {
        const currentExp = new Date(org.corporateLicense.validUntil > new Date() ? org.corporateLicense.validUntil : new Date());
        currentExp.setFullYear(currentExp.getFullYear() + extensionYears);
        org.corporateLicense.validUntil = currentExp;
      }
      await org.save();
      return res.status(200).json({ message: 'Bolsón corporativo actualizado.', organization: org });
    } else {
      const doctor = await DoctorUserModel.findById(targetId);
      if (!doctor) return res.status(404).json({ error: 'Médico no encontrado.' });

      doctor.personalAiQuotaPool.totalTokensPurchased += addTokens || 0;
      doctor.personalAiQuotaPool.lastRefillDate = new Date();

      if (extensionYears && extensionYears > 0) {
        const currentExp = new Date(doctor.personalLicense.validUntil && doctor.personalLicense.validUntil > new Date() ? doctor.personalLicense.validUntil : new Date());
        currentExp.setFullYear(currentExp.getFullYear() + extensionYears);
        doctor.personalLicense.validUntil = currentExp;
        doctor.personalLicense.isActive = true;
      }
      await doctor.save();
      return res.status(200).json({ message: 'Bolsón e extensión de licencia médica aplicados.', doctor });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
