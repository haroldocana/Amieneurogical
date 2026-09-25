import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

/**
 * Obtener perfil de licencia y estado del bolsón de IA desde MongoDB
 */
export const getSaasProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id || req.user?.username;

    let user = await User.findOne({ $or: [{ _id: userId }, { username: userId }] });

    // Si el usuario no existe aún en MongoDB, se crea un perfil base
    if (!user) {
      user = await User.create({
        username: userId || 'PAC-8104',
        name: 'Dr. Morrison',
        collegiateNumber: '2000',
        hospitalName: 'Clínica de Neurociencia Avanzada',
        licenseDaysRemaining: 365,
        aiTokensTotal: 100,
        aiTokensUsed: 0,
        rechargeHistory: []
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: user.name,
        collegiateNumber: user.collegiateNumber,
        hospitalName: user.hospitalName,
        licenseDaysRemaining: user.licenseDaysRemaining,
        aiTokensTotal: user.aiTokensTotal,
        aiTokensUsed: user.aiTokensUsed,
        aiTokensAvailable: user.aiTokensTotal - user.aiTokensUsed,
        rechargeHistory: user.rechargeHistory
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return res.status(500).json({ success: false, error: message });
  }
};

/**
 * Recargar paquete de tokens de IA y persistir en MongoDB
 */
export const rechargeAiTokens = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id || req.user?.username;
    const { amount, packageType } = req.body; // Ej: amount: 50, 100, 500

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Monto de recarga inválido.' });
    }

    const user = await User.findOne({ $or: [{ _id: userId }, { username: userId }] });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado en MongoDB.' });
    }

    // Incrementar el bolsón total en MongoDB
    user.aiTokensTotal += Number(amount);
    user.rechargeHistory.push({
      tokensAdded: Number(amount),
      packageType: packageType || 'Recarga Estándar',
      date: new Date(),
      referenceId: `RCG-${Date.now()}`
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: `¡Recarga de ${amount} tokens realizada con éxito en MongoDB!`,
      data: {
        aiTokensTotal: user.aiTokensTotal,
        aiTokensUsed: user.aiTokensUsed,
        aiTokensAvailable: user.aiTokensTotal - user.aiTokensUsed,
        rechargeHistory: user.rechargeHistory
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return res.status(500).json({ success: false, error: message });
  }
};
