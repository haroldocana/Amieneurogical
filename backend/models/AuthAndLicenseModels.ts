import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

// ============================================================================
// 0. SUB-ESQUEMA DE HISTORIAL Y AUDITORÍA DE PAGOS / CRÉDITOS
// ============================================================================
export interface IRechargeRecord {
  grantedAt?: Date;
  date?: Date;
  grantedBy?: string;
  paymentMethod?: string;
  bankReference?: string;
  referenceId?: string;
  notes?: string;
  packageType?: string;
  type?: string;
  tokensGranted?: number;
  tokensAdded?: number;
  yearsGranted?: number;
  demoDaysGranted?: number;
}

const RechargeRecordSchema = new Schema<IRechargeRecord>({
  grantedAt: { type: Date, default: Date.now },
  date: { type: Date, default: Date.now },
  grantedBy: { type: String, default: 'SISTEMA' },
  paymentMethod: { type: String, default: 'BANK_TRANSFER' },
  bankReference: { type: String, default: 'N/A' },
  referenceId: { type: String },
  notes: { type: String },
  packageType: { type: String, default: 'Recarga Estándar' },
  type: { type: String },
  tokensGranted: { type: Number, default: 0 },
  tokensAdded: { type: Number, default: 0 },
  yearsGranted: { type: Number, default: 0 },
  demoDaysGranted: { type: Number, default: 0 }
}, { _id: false });

// ============================================================================
// 1. ESQUEMA DE ORGANIZACIÓN / HOSPITAL (Multi-Tenant B2B)
// ============================================================================
export interface IOrganization extends Document {
  name: string;
  type: 'HOSPITAL' | 'CLINIC' | 'RESEARCH_CENTER';
  ssoConfig: {
    provider: 'NONE' | 'MICROSOFT_ENTRA' | 'GOOGLE_WORKSPACE' | 'LDAP';
    tenantId?: string;
    domain?: string;
  };
  globalAiQuotaPool: {
    totalTokensPurchased: number;
    tokensUsed: number;
    lastRefillDate?: Date;
  };
  corporateLicense: {
    planType: 'ENTERPRISE_PRO' | 'CLINICAL_NETWORK' | 'DEMO' | 'PRO_CLINICAL';
    validUntil: Date;
    maxAllowedSeats: number;
    isActive: boolean;
  };
  rechargeHistory: IRechargeRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['HOSPITAL', 'CLINIC', 'RESEARCH_CENTER'], default: 'HOSPITAL' },
  ssoConfig: {
    provider: { type: String, enum: ['NONE', 'MICROSOFT_ENTRA', 'GOOGLE_WORKSPACE', 'LDAP'], default: 'NONE' },
    tenantId: { type: String, trim: true },
    domain: { type: String, trim: true, lowercase: true }
  },
  globalAiQuotaPool: {
    totalTokensPurchased: { type: Number, default: 0 },
    tokensUsed: { type: Number, default: 0 },
    lastRefillDate: { type: Date, default: Date.now }
  },
  corporateLicense: {
    planType: { 
      type: String, 
      enum: ['ENTERPRISE_PRO', 'CLINICAL_NETWORK', 'DEMO', 'PRO_CLINICAL'], 
      default: 'ENTERPRISE_PRO' 
    },
    validUntil: { type: Date, required: true },
    maxAllowedSeats: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true }
  },
  rechargeHistory: [RechargeRecordSchema]
}, { timestamps: true });

// ============================================================================
// 2. ESQUEMA DE USUARIO MÉDICO (Independiente + Corporativo)
// ============================================================================
export interface IDoctorUser extends Document {
  username: string;
  email: string;
  doctorName: string;
  fullName?: string;
  colegiadoNumber: number;
  collegiateNumber?: string | number;
  hospitalName?: string;
  accountType: 'INDIVIDUAL' | 'CORPORATE_MEMBER' | 'SUPER_ADMIN';
  organizationId?: mongoose.Types.ObjectId;
  role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR';
  authMethod: 'LOCAL_PASSWORD' | 'LOCAL' | 'MICROSOFT_SSO' | 'GOOGLE_SSO' | 'LDAP';
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  // Bolsón y Licencia Personal (Médico Independiente)
  personalAiQuotaPool: {
    totalTokensPurchased: number;
    tokensUsed: number;
    lastRefillDate?: Date;
  };
  personalLicense: {
    planType: 'STARTER' | 'PROFESSIONAL' | 'EXPERT' | 'DEMO' | 'PRO_CLINICAL';
    tier?: string;
    licenseKey: string;
    validUntil: Date;
    isActive: boolean;
  };
  
  // Cuota asignada internamente por Hospital Corporativo
  corporateAssignedQuota: {
    maxTokens: number;
    usedTokens: number;
  };
  rechargeHistory: IRechargeRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const DoctorUserSchema = new Schema<IDoctorUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  doctorName: { type: String, required: true, trim: true, default: 'Dr. Alejandro Morales Rivera' },
  fullName: { type: String, trim: true },
  colegiadoNumber: { 
    type: Number, 
    required: true, 
    unique: true, 
    sparse: true, 
    default: () => Math.floor(100000 + Math.random() * 900000) 
  },
  collegiateNumber: { type: Schema.Types.Mixed },
  hospitalName: { type: String, default: 'Clínica de Neurociencia Avanzada' },
  accountType: { type: String, enum: ['INDIVIDUAL', 'CORPORATE_MEMBER', 'SUPER_ADMIN'], default: 'INDIVIDUAL' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  role: { type: String, enum: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR'], default: 'DOCTOR' },
  authMethod: { 
    type: String, 
    enum: ['LOCAL_PASSWORD', 'LOCAL', 'MICROSOFT_SSO', 'GOOGLE_SSO', 'LDAP'], 
    default: 'LOCAL_PASSWORD' 
  },
  passwordHash: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },

  personalAiQuotaPool: {
    totalTokensPurchased: { type: Number, default: 100 },
    tokensUsed: { type: Number, default: 0 },
    lastRefillDate: { type: Date, default: Date.now }
  },
  personalLicense: {
    planType: { 
      type: String, 
      enum: ['STARTER', 'PROFESSIONAL', 'EXPERT', 'DEMO', 'PRO_CLINICAL'], 
      default: 'PRO_CLINICAL' 
    },
    tier: { type: String, default: 'PRO_CLINICAL' },
    // 🟢 sparse: true evita colisiones de nulos y auto-genera una llave si no se especifica
    licenseKey: { 
      type: String, 
      unique: true, 
      sparse: true,
      default: () => `AMIE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    },
    validUntil: { 
      type: Date, 
      default: () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d;
      }
    },
    isActive: { type: Boolean, default: true }
  },
  corporateAssignedQuota: {
    maxTokens: { type: Number, default: 0 },
    usedTokens: { type: Number, default: 0 }
  },
  rechargeHistory: [RechargeRecordSchema]
}, { timestamps: true });

// Sincronizar doctorName con fullName antes de validar
DoctorUserSchema.pre('validate', function(next) {
  if (!this.fullName && this.doctorName) {
    this.fullName = this.doctorName;
  }
  if (!this.doctorName && this.fullName) {
    this.doctorName = this.fullName;
  }
  next();
});

// 🟢 Prevenir OverwriteModelError durante hot-reloads en Node/Render
export const OrganizationModel = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
export const DoctorUserModel = mongoose.models.DoctorUser || mongoose.model<IDoctorUser>('DoctorUser', DoctorUserSchema);
