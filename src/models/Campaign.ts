import mongoose, { Document, Schema } from 'mongoose';

export interface IContact {
  name: string;
  phone?: string;
  email?: string;
}

export interface IMessageTemplate {
  subject?: string;
  body: string;
  isHtml?: boolean;
}

export interface IMethodResult {
  method: 'sms' | 'email' | 'call';
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  timestamp: Date;
  response?: string;
  error?: string;
}

export interface ICampaignResult {
  contactId: string;
  contactName: string;
  methods: IMethodResult[];
  overallStatus: 'pending' | 'partial' | 'success' | 'failed';
  timestamp: Date;
}

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'sms' | 'email' | 'call' | 'all';
  status: 'draft' | 'running' | 'paused' | 'completed';
  contacts: IContact[];
  messageTemplate: IMessageTemplate;
  schedule: Date;
  results: ICampaignResult[];
  totalContacts: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['sms', 'email', 'call', 'all'],
    required: [true, 'Campaign type is required']
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed'],
    default: 'draft'
  },
  contacts: [{
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String }
  }],
  messageTemplate: {
    subject: { type: String },
    body: { type: String, required: true },
    isHtml: { type: Boolean, default: false }
  },
  schedule: {
    type: Date,
    default: Date.now
  },
  results: [{
    contactId: { type: String, required: true },
    contactName: { type: String, required: true },
    methods: [{
      method: { 
        type: String, 
        enum: ['sms', 'email', 'call'], 
        required: true 
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'delivered'],
        default: 'pending'
      },
      timestamp: { type: Date, default: Date.now },
      response: { type: String },
      error: { type: String }
    }],
    overallStatus: {
      type: String,
      enum: ['pending', 'partial', 'success', 'failed'],
      default: 'pending'
    },
    timestamp: { type: Date, default: Date.now }
  }],
  totalContacts: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update totalContacts before saving
CampaignSchema.pre<ICampaign>('save', function(next) {
  this.totalContacts = this.contacts.length;
  next();
});

// Create compound indexes for better query performance
CampaignSchema.index({ userId: 1, status: 1, createdAt: -1 });
CampaignSchema.index({ userId: 1, type: 1 });
CampaignSchema.index({ schedule: 1, status: 1 });

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
