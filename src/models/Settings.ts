import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  whatsapp: {
    token: string;
    phoneNumberId: string;
    verifyToken: string;
  };
  facebook: {
    accessToken: string;
    pageId: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
  };
  sms: {
    provider: string;
    apiKey: string;
    fromNumber: string;
  };
  voiceCall: {
    dynamicInstruction: string;
    sipTrunkId: string;
    transferTo: string;
    apiKey: string;
    voiceId: string;
    provider: string;
    language: string;
    escalationCondition: string;
  };
  leadGeneratorEndpoint: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  whatsapp: {
    token: { type: String, default: '' },
    phoneNumberId: { type: String, default: '' },
    verifyToken: { type: String, default: '' }
  },
  facebook: {
    accessToken: { type: String, default: '' },
    pageId: { type: String, default: '' }
  },
  email: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPassword: { type: String, default: '' }
  },
  sms: {
    provider: { type: String, default: '' },
    apiKey: { type: String, default: '' },
    fromNumber: { type: String, default: '' }
  },
  voiceCall: {
    dynamicInstruction: { type: String, default: '' },
    sipTrunkId: { type: String, default: '' },
    transferTo: { type: String, default: '' },
    apiKey: { type: String, default: '' },
    voiceId: { type: String, default: '21m00Tcm4TlvDq8ikWAM' },
    provider: { type: String, default: 'openai' },
    language: { type: String, default: 'en' },
    escalationCondition: { type: String, default: '' }
  },
  leadGeneratorEndpoint: {
    type: String,
    default: 'https://inshora-lead-generator.onrender.com'
  }
}, {
  timestamps: true
});

// Indexes (userId index is created by unique: true)

export default mongoose.model<ISettings>('Settings', SettingsSchema);
