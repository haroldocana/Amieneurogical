import { Request, Response } from 'express';
import { DoctorUserModel, OrganizationModel } from '../models/AuthAndLicenseModels';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// -----------------------------------------------------------------------
// 1. DESCUENTO DE TOKENS DEL BOLSÓN DE IA
// -----------------------------------------------------------------------
export const consumeAiTokens = async (userId: string, tokensToConsume: number = 1): Promise<{ success: boolean; remaining: number; message?: string }> => {
  const doctor = await DoctorUserModel.findById(userId).populate('organizationId');
  if (!doctor) return { success: false, remaining: 0, message: 'Usuario médico no encontrado.' };

  // A) MÉDICO INDEPENDIENTE
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

  // B) MÉDICO CORPORATIVO (HOSPITAL)
  if (doctor.accountType === 'CORPORATE_MEMBER' && doctor.organizationId) {
    const org = await OrganizationModel.findById(doctor.organizationId);
    if (!org || !org.corporateLicense.isActive || new Date() > new Date(org.corporateLicense.validUntil)) {
      return { success: false, remaining: 0, message: 'La licencia de su institución hospitalaria está inactiva o vencida.' };
    }
    const orgRemaining = org.globalAiQuotaPool.totalTokensPurchased - org.globalAiQuotaPool.tokensUsed;
    if (orgRemaining < tokensToConsume) {
      return { success: false, remaining: orgRemaining, message: 'El bolsón global de IA de la institución ha sido agotado.' };
    }
    org.globalAiQuotaPool.tokensUsed += tokensToConsume;
    doctor.corporateAssignedQuota.usedTokens += tokensToConsume;
    await org.save();
    await doctor.save();
    return { success: true, remaining: org.globalAiQuotaPool.totalTokensPurchased - org.globalAiQuotaPool.tokensUsed };
  }

  return { success: false, remaining: 0, message: 'Tipo de cuenta no autorizado.' };
};

// -----------------------------------------------------------------------
// 2. SOLICITUD DE RESETEO DE CONTRASEÑA
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
        error: `Su cuenta pertenece al hospital/clínica. Restablezca su clave desde el portal SSO de su institución (${doctor.authMethod}).` 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    doctor.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    doctor.passwordResetExpires = new Date(Date.now() + 3600000); // 1 Hora de validez
    await doctor.save();

    return res.status(200).json({ 
      message: 'Enlace de restablecimiento generado con éxito.',
      resetUrl: `https://amie-clinical-analyzer-367911373284.us-central1.run.app/reset-password?token=${resetToken}` 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------------------------------
// 3. RECARGA DE BOLSÓN Y EXTENSIÓN MULTIANUAL (1, 2 O 3 AÑOS)
// -----------------------------------------------------------------------
export const refillQuotaAndLicense = async (req: Request, res: Response) => {
  try {
    const { targetId, isOrganization, addTokens, extensionYears } = req.body;

    if (isOrganization) {
      const org = await OrganizationModel.findById(targetId);
      if (!org) return res.status(404).json({ error: 'Organización no encontrada.' });

      org.globalAiQuotaPool.totalTokensPurchased += addTokens || 0;
      if (extensionYears && extensionYears > 0) {
        const baseDate = org.corporateLicense.validUntil > new Date() ? org.corporateLicense.validUntil : new Date();
        const newExp = new Date(baseDate);
        newExp.setFullYear(newExp.getFullYear() + extensionYears);
        org.corporateLicense.validUntil = newExp;
      }
      await org.save();
      return res.status(200).json({ message: 'Bolsón e extensión corporativa aplicados.', organization: org });
    } else {
      const doctor = await DoctorUserModel.findById(targetId);
      if (!doctor) return res.status(404).json({ error: 'Médico no encontrado.' });

      doctor.personalAiQuotaPool.totalTokensPurchased += addTokens || 0;
      doctor.personalAiQuotaPool.lastRefillDate = new Date();

      if (extensionYears && extensionYears > 0) {
        const baseDate = doctor.personalLicense.validUntil && doctor.personalLicense.validUntil > new Date() ? doctor.personalLicense.validUntil : new Date();
        const newExp = new Date(baseDate);
        newExp.setFullYear(newExp.getFullYear() + extensionYears);
        doctor.personalLicense.validUntil = newExp;
        doctor.personalLicense.isActive = true;
      }
      await doctor.save();
      return res.status(200).json({ message: 'Bolsón e extensión de licencia médica aplicados.', doctor });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
