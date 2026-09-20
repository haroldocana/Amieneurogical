import mongoose, { Schema, Document } from 'mongoose';

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
  };
  corporateLicense: {
    planType: 'ENTERPRISE_PRO' | 'CLINICAL_NETWORK';
    validUntil: Date;
    maxAllowedSeats: number;
    isActive: boolean;
  };
  createdAt: Date;
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
    tokensUsed: { type: Number, default: 0 }
  },
  corporateLicense: {
    planType: { type: String, enum: ['ENTERPRISE_PRO', 'CLINICAL_NETWORK'], default: 'ENTERPRISE_PRO' },
    validUntil: { type: Date, required: true },
    maxAllowedSeats: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true }
  }
}, { timestamps: true });

// ============================================================================
// 2. ESQUEMA DE USUARIO MÉDICO (Independiente + Corporativo)
// ============================================================================
export interface IDoctorUser extends Document {
  username: string;
  email: string;
  doctorName: string;
  colegiadoNumber: number;
  accountType: 'INDIVIDUAL' | 'CORPORATE_MEMBER' | 'SUPER_ADMIN';
  organizationId?: mongoose.Types.ObjectId;
  role: 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR';
  authMethod: 'LOCAL_PASSWORD' | 'MICROSOFT_SSO' | 'GOOGLE_SSO' | 'LDAP';
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  // Bolsón y Licencia Personal (Médico Independiente: 1, 2 o 3 Años)
  personalAiQuotaPool: {
    totalTokensPurchased: number;
    tokensUsed: number;
    lastRefillDate?: Date;
  };
  personalLicense: {
    planType: 'STARTER' | 'PROFESSIONAL' | 'EXPERT';
    licenseKey: string;
    validUntil: Date;
    isActive: boolean;
  };
  
  // Cuota asignada internamente por Hospital Corporativo
  corporateAssignedQuota: {
    maxTokens: number;
    usedTokens: number;
  };
  createdAt: Date;
}

const DoctorUserSchema = new Schema<IDoctorUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  doctorName: { type: String, required: true, trim: true },
  colegiadoNumber: { type: Number, required: true, unique: true },
  accountType: { type: String, enum: ['INDIVIDUAL', 'CORPORATE_MEMBER', 'SUPER_ADMIN'], default: 'INDIVIDUAL' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  role: { type: String, enum: ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR'], default: 'DOCTOR' },
  authMethod: { type: String, enum: ['LOCAL_PASSWORD', 'MICROSOFT_SSO', 'GOOGLE_SSO', 'LDAP'], default: 'LOCAL_PASSWORD' },
  passwordHash: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },

  personalAiQuotaPool: {
    totalTokensPurchased: { type: Number, default: 100 },
    tokensUsed: { type: Number, default: 0 },
    lastRefillDate: { type: Date }
  },
  personalLicense: {
    planType: { type: String, enum: ['STARTER', 'PROFESSIONAL', 'EXPERT'], default: 'STARTER' },
    licenseKey: { type: String, unique: true },
    validUntil: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  corporateAssignedQuota: {
    maxTokens: { type: Number, default: 0 },
    usedTokens: { type: Number, default: 0 }
  }
}, { timestamps: true });

export const OrganizationModel = mongoose.model<IOrganization>('Organization', OrganizationSchema);
export const DoctorUserModel = mongoose.model<IDoctorUser>('DoctorUser', DoctorUserSchema);
