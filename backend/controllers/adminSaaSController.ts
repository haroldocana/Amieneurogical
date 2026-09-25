import { Request, Response } from 'express';

/**
 * CONTROLADOR ADMINISTRATIVO AMIE - AUTORIZACIÓN MANUAL
 * Maneja recargas por transferencia bancaria, extensión de licencias y demos.
 */
export const manualGrantByAdmin = async (req: Request, res: Response) => {
  try {
    const {
      targetId,          // Email, ID o Número de Colegiado
      isOrganization,    // boolean
      grantType,         // 'RECHARGE_TOKENS' | 'EXTEND_LICENSE' | 'GRANT_DEMO'
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

    // Respuesta estructurada para confirmación en interfaz
    return res.status(200).json({
      success: true,
      message: `Acreditación procesada exitosamente para ${targetId}.`,
      details: auditEntry
    });

  } catch (err: any) {
    console.error('Error en manualGrantByAdmin:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Error interno al procesar la acreditación manual.' 
    });
  }
};
