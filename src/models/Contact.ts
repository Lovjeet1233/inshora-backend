import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  apolloId: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  organization?: any;
  employmentHistory?: any[];
  departments?: string[];
  seniority?: string;
  rawData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    apolloId: {
      type: String,
      required: true,
      index: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    linkedinUrl: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    photoUrl: {
      type: String,
      trim: true
    },
    organization: {
      type: Schema.Types.Mixed
    },
    employmentHistory: {
      type: [Schema.Types.Mixed],
      default: []
    },
    departments: {
      type: [String],
      default: []
    },
    seniority: {
      type: String,
      trim: true
    },
    rawData: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate contacts per user
ContactSchema.index({ userId: 1, apolloId: 1 }, { unique: true });

const Contact = mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;

