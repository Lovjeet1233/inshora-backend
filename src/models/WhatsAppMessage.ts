import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppMessage extends Document {
  userId: mongoose.Types.ObjectId;
  from: string;
  to: string;
  message: string;
  threadId: string;
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  messageId?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: any;
}

const WhatsAppMessageSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  threadId: {
    type: String,
    required: true,
    index: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  messageId: {
    type: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create compound indexes for better query performance
WhatsAppMessageSchema.index({ userId: 1, threadId: 1, timestamp: -1 });
WhatsAppMessageSchema.index({ userId: 1, direction: 1, timestamp: -1 });
WhatsAppMessageSchema.index({ threadId: 1, timestamp: -1 });
WhatsAppMessageSchema.index({ from: 1, to: 1 });

export default mongoose.model<IWhatsAppMessage>('WhatsAppMessage', WhatsAppMessageSchema);
