import mongoose, { Schema, Document } from 'mongoose';

export interface IRechargeTransaction {
  tokensAdded: number;
  packageType: string;
  date: Date;
  referenceId: string;
}

export interface IUser extends Document {
  username: string;
  name: string;
  collegiateNumber: string;
  hospitalName: string;
  licenseDaysRemaining: number;
  aiTokensTotal: number;
  aiTokensUsed: number;
  rechargeHistory: IRechargeTransaction[];
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true, default: 'Dr. Morrison' },
  collegiateNumber: { type: String, required: true, default: '2000' },
  hospitalName: { type: String, required: true, default: 'Hospital Central' },
  licenseDaysRemaining: { type: Number, default: 365 },
  aiTokensTotal: { type: Number, default: 100 },
  aiTokensUsed: { type: Number, default: 0 },
  rechargeHistory: [
    {
      tokensAdded: { type: Number, required: true },
      packageType: { type: String, required: true },
      date: { type: Date, default: Date.now },
      referenceId: { type: String, required: true }
    }
  ]
});

export default mongoose.model<IUser>('User', UserSchema);
