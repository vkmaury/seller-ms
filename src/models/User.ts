import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  googleAuthSecret: string;
  username: string;
  email: string;
  countryCode?: string;
  phoneNumber: string;
  password: string;
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role: 'user' | 'seller';
  dob: Date;
  address: {
    houseNumber: string;
    locality: string;
    nearBy: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  name: string;
  sellerId: Schema.Types.ObjectId;
  is2FAEnabled: boolean;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, unique: true }, // Ensure this index is necessary
  countryCode: { type: String },
  phoneNumber: { type: String, unique: true }, // Ensure this index is necessary
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ['user', 'seller'],
    required: true,
    default: 'user',
  },
  resetPasswordToken: { type: String },
  
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resetPasswordExpires: { type: Date },
  googleAuthSecret: { type: String },
  dob: { type: Date, required: true },
  address: {
    houseNumber: { type: String, required: true },
    locality: { type: String, required: true },
    nearBy: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  name: { type: String, required: true },
  is2FAEnabled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  
}, { timestamps: true });

export default model<IUser>('Auth-ms', userSchema);
