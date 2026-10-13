import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { DoctorUserModel, OrganizationModel } from '../models/AuthAndLicenseModels';

/**
 * Auxiliar para construir una consulta segura en MongoDB
 * Busca por _id, email, username o número de colegiado.
 */
const buildAdminSearchQuery = (identifier: string) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  if (isObjectId) {
    return { _id: identifier };
  }
  const cleanId = identifier.toLowerCase().trim();
  return {
    $or: [
      { email: cleanId },
      { username: identifier },
      { collegiateNumber: identifier }
    ]
  };
};

/**
 * CONTROLADOR ADMINISTRATIVO AMIE - AUTORIZACIÓN MANUAL
 * Maneja recargas por transferencia bancaria, extensión de licencias y demos directamente en MongoDB.
 */
export const manualGrantByAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      targetId,          // Email, ID o Número de Colegiado
      isOrganization,    // boolean
      grantType,         // 'RECHARGE_TOKENS' | 'EXTEND_LICENSE' | 'GRANT_DEMO' | 'FULL_BUNDLE'
      tokensToAdd,       // Número
      extensionYears,    // Número
      demoDays,          // Número
      paymentMethod,     // 'BANK_TRANSFER' | 'BANK_DEPOSIT' | 'PURCHASE_ORDER' | 'CASH' | 'FREE_DEMO'
      bankReference,     // Número de comprobante o boleta
      adminNotes,        // Notas internas
      adminUserId        // ID del operador que autoriza
    } = req.body;

    if (!targetId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Debe proporcionar un identificador (correo, ID o número de colegiado).' 
      });
    }

    const searchQuery = buildAdminSearchQuery(targetId);
    let targetEntity: any;

    if (isOrganization) {
      targetEntity = await OrganizationModel.findOne(searchQuery);
    } else {
      targetEntity = await DoctorUserModel.findOne(searchQuery);
    }

    if (!targetEntity) {
      return res.status(404).json({
        success: false,
        error: `No se encontró ${isOrganization ? 'una organización' : 'un médico'} con el identificador proporcionado.`
      });
    }

    // 1. REGISTRO DE AUDITORÍA
    const auditEntry = {
      grantedAt: new Date(),
      grantedBy: adminUserId || 'ADMIN_SISTEMA',
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      bankReference: bankReference || 'N/A (Cortesía/Manual)',
      notes: adminNotes || 'Procesado desde el panel administrativo AMIE',
      type: grantType,
      tokensGranted: Number(tokensToAdd) || 0,
      yearsGranted: Number(extensionYears) || 0,
      demoDaysGranted: Number(demoDays) || 0
    };

    // Referencias dinámicas según el tipo de cuenta
    const license = isOrganization ? targetEntity.corporateLicense : targetEntity.personalLicense;
    const quotaPool = isOrganization ? targetEntity.globalAiQuotaPool : targetEntity.personalAiQuotaPool;
    
    // Iniciar array de historial si no existe
    if (!targetEntity.rechargeHistory) {
      targetEntity.rechargeHistory = [];
    }

    // 2. APLICAR LÓGICA SEGÚN EL TIPO DE ACREDITACIÓN
    const now = new Date();

    if (grantType === 'RECHARGE_TOKENS') {
      quotaPool.totalTokensPurchased = (quotaPool.totalTokensPurchased || 0) + (Number(tokensToAdd) || 0);
      quotaPool.lastRefillDate = now;

    } else if (grantType === 'EXTEND_LICENSE') {
      const baseDate = (license.validUntil && new Date(license.validUntil) > now) 
        ? new Date(license.validUntil) 
        : now;
      baseDate.setFullYear(baseDate.getFullYear() + (Number(extensionYears) || 1));
      
      license.validUntil = baseDate;
      license.isActive = true;

    } else if (grantType === 'GRANT_DEMO') {
      const demoExpDate = new Date(now);
      demoExpDate.setDate(demoExpDate.getDate() + (Number(demoDays) || 14));
      
      license.validUntil = demoExpDate;
      license.isActive = true;
      license.tier = 'DEMO';
      
      quotaPool.totalTokensPurchased = (quotaPool.totalTokensPurchased || 0) + (Number(tokensToAdd) || 10);
      quotaPool.lastRefillDate = now;

    } else if (grantType === 'FULL_BUNDLE') {
      // Recarga de Tokens + Extensión de Licencia (Compra completa)
      quotaPool.totalTokensPurchased = (quotaPool.totalTokensPurchased || 0) + (Number(tokensToAdd) || 0);
      quotaPool.lastRefillDate = now;

      const baseDate = (license.validUntil && new Date(license.validUntil) > now) 
        ? new Date(license.validUntil) 
        : now;
      baseDate.setFullYear(baseDate.getFullYear() + (Number(extensionYears) || 1));
      
      license.validUntil = baseDate;
      license.isActive = true;
      license.tier = 'PRO_CLINICAL';
    }

    // Insertar auditoría en el historial
    targetEntity.rechargeHistory.push(auditEntry);

    // 3. GUARDAR CAMBIOS EN MONGODB
    await targetEntity.save();

    // Determinar saldos finales para confirmación
    const finalTokens = (quotaPool.totalTokensPurchased || 0) - (quotaPool.tokensUsed || 0);

    return res.status(200).json({
      success: true,
      message: `Acreditación procesada exitosamente en MongoDB para ${targetEntity.email || targetEntity.name}.`,
      data: {
        entityName: targetEntity.fullName || targetEntity.name,
        newExpirationDate: license.validUntil,
        isLicenseActive: license.isActive,
        tokensAvailable: Math.max(0, finalTokens),
        auditDetails: auditEntry
      }
    });

  } catch (err: any) {
    console.error('[Admin SaaS] Error en manualGrantByAdmin:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno al procesar la acreditación manual: ' + (err.message || err)
    });
  }
};
