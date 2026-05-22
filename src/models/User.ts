import mongoose, { type Document, Schema, type Model } from 'mongoose';
import type { UserRole } from '../types/auth.js';
import {
  comparePassword as comparePasswordHash,
  hashPassword,
} from '../utils/hash.js';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  refreshToken?: string | null;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['candidate', 'recruiter', 'admin'],
        message: 'Role must be candidate, recruiter, or admin',
      },
      required: [true, 'Role is required'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationToken: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
);

userSchema.pre('save', async function hashPasswordOnSave() {
  if (!this.isModified('password')) return;
  this.password = await hashPassword(this.password);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword: string,
): Promise<boolean> {
  return comparePasswordHash(candidatePassword, this.password);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
