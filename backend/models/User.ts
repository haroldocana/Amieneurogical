import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// Sub-interfaz flexible para transacciones, auditoría y recargas
export interface IRechargeTransaction {
  tokensAdded?: number;
  tokensGranted?: number;
  packageType?: string;
  type?: string;
  date?: Date;
  grantedAt?: Date;
  referenceId?: string;
  grantedBy?: string;
  paymentMethod?: string;
  bankReference?: string;
  notes?: string;
  yearsGranted?: number;
  demoDaysGranted?: number;
}

export interface IUser extends Document {
  username: string;
  email?: string;
  name: string;
  collegiateNumber: string;
  hospitalName: string;
  licenseDaysRemaining: number;
  aiTokensTotal: number;
  aiTokensUsed: number;
  role?: string;
  rechargeHistory: IRechargeTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const RechargeTransactionSchema = new Schema<IRechargeTransaction>({
  tokensAdded: { type: Number, default: 0 },
  tokensGranted: { type: Number, default: 0 },
  packageType: { type: String, default: 'Recarga Estándar' },
  type: { type: String, default: 'RECHARGE_TOKENS' },
  date: { type: Date, default: Date.now },
  grantedAt: { type: Date, default: Date.now },
  referenceId: { 
    type: String, 
    default: () => `RCG-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}` 
  },
  grantedBy: { type: String, default: 'SISTEMA' },
  paymentMethod: { type: String, default: 'BANK_TRANSFER' },
  bankReference: { type: String, default: 'N/A' },
  notes: { type: String, default: 'Transacción registrada en el sistema' },
  yearsGranted: { type: Number, default: 0 },
  demoDaysGranted: { type: Number, default: 0 }
}, { _id: false });

const UserSchema: Schema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true 
  },
  email: { 
    type: String, 
    sparse: true, 
    lowercase: true, 
    trim: true 
  },
  name: { 
    type: String, 
    required: true, 
    default: 'Dr. Alejandro Morales Rivera',
    trim: true 
  },
  collegiateNumber: { 
    type: String, 
    required: true, 
    default: '749210',
    trim: true 
  },
  hospitalName: { 
    type: String, 
    required: true, 
    default: 'Clínica de Neurociencia Avanzada',
    trim: true 
  },
  licenseDaysRemaining: { 
    type: Number, 
    default: 365 
  },
  aiTokensTotal: { 
    type: Number, 
    default: 100 
  },
  aiTokensUsed: { 
    type: Number, 
    default: 0 
  },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'THERAPIST'], 
    default: 'DOCTOR' 
  },
  rechargeHistory: [RechargeTransactionSchema]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Campo virtual para calcular saldo disponible en consultas sin cálculo manual
UserSchema.virtual('aiTokensAvailable').get(function(this: IUser) {
  const total = this.aiTokensTotal ?? 0;
  const used = this.aiTokensUsed ?? 0;
  return Math.max(0, total - used);
});

// Prevenir OverwriteModelError durante hot-reloads en Node.js y Render
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
