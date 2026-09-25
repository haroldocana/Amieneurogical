import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

/**
 * Auxiliar para construir una consulta segura en MongoDB
 * Previene errores de conversión (CastError) cuando userId no es un ObjectId
 */
const buildUserQuery = (userId: string) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(userId);
  return isObjectId 
    ? { $or: [{ _id: userId }, { username: userId }] }
    : { username: userId };
};

/**
 * Obtener perfil de licencia y estado del bolsón de IA desde MongoDB
 */
export const getSaasProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id || req.user?.username;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Sesión no válida. No se identificó el usuario en la petición.'
      });
    }

    const query = buildUserQuery(String(userId));
    let user = await User.findOne(query);

    // Si el usuario no existe aún en MongoDB, se genera la estructura base
    if (!user) {
      user = await User.create({
        username: userId,
        name: req.user?.name || 'Dr. Harold',
        collegiateNumber: req.user?.collegiateNumber || '2001',
        hospitalName: req.user?.hospitalName || 'Clínica de Neurociencia Avanzada',
        licenseDaysRemaining: 365,
        aiTokensTotal: 100,
        aiTokensUsed: 0,
        rechargeHistory: []
      });
    }

    const tokensTotal = user.aiTokensTotal ?? 100;
    const tokensUsed = user.aiTokensUsed ?? 0;
    const tokensAvailable = Math.max(0, tokensTotal - tokensUsed);

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        name: user.name || 'Dr. Harold',
        collegiateNumber: user.collegiateNumber || '2001',
        hospitalName: user.hospitalName || 'Clínica de Neurociencia Avanzada',
        licenseDaysRemaining: user.licenseDaysRemaining ?? 365,
        aiTokensTotal: tokensTotal,
        aiTokensUsed: tokensUsed,
        aiTokensAvailable: tokensAvailable,
        rechargeHistory: user.rechargeHistory || []
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return res.status(500).json({ success: false, error: message });
  }
};

/**
 * Recargar paquete de tokens de IA y persistir de forma atómica en MongoDB
 */
export const rechargeAiTokens = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id || req.user?.username;
    const { amount, packageType } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado.'
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El monto de recarga debe ser un número entero mayor a 0.'
      });
    }

    const query = buildUserQuery(String(userId));

    // Entrada de historial para auditoría
    const rechargeEntry = {
      tokensAdded: numericAmount,
      packageType: packageType || 'Recarga Estándar',
      date: new Date(),
      referenceId: `RCG-${Date.now()}`
    };

    // Actualización atómica en MongoDB ($inc y$push)
    const updatedUser = await User.findOneAndUpdate(
      query,
      {
        $inc: { aiTokensTotal: numericAmount },$push: { rechargeHistory: rechargeEntry }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado en la base de datos MongoDB.'
      });
    }

    const tokensTotal = updatedUser.aiTokensTotal ?? 0;
    const tokensUsed = updatedUser.aiTokensUsed ?? 0;
    const tokensAvailable = Math.max(0, tokensTotal - tokensUsed);

    return res.status(200).json({
      success: true,
      message: `¡Recarga de ${numericAmount} tokens aplicada exitosamente en MongoDB!`,
      data: {
        aiTokensTotal: tokensTotal,
        aiTokensUsed: tokensUsed,
        aiTokensAvailable: tokensAvailable,
        rechargeHistory: updatedUser.rechargeHistory
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return res.status(500).json({ success: false, error: message });
  }
};
