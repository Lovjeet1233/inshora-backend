import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscript extends Document {
  caller_id: string;
  name: string;
  contact_number: string;
  transcript: {
    items?: any[];
    [key: string]: any;
  };
  timestamp: Date;
  metadata: {
    room_name?: string;
    duration_seconds?: number;
    duration_formatted?: string;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const TranscriptSchema: Schema = new Schema({
  caller_id: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: false
  },
  contact_number: {
    type: String,
    required: false
  },
  transcript: {
    type: Schema.Types.Mixed, // Object with items array
    required: false
  },
  timestamp: {
    type: Date,
    required: false
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false, // Don't auto-generate timestamps, use 'timestamp' field from data
  collection: 'transcripts', // MongoDB collection name
  strict: false // Allow additional fields from existing data
});

// Indexes
TranscriptSchema.index({ contact_number: 1 });
TranscriptSchema.index({ timestamp: -1 }); // Index on timestamp instead of createdAt

export default mongoose.model<ITranscript>('Transcript', TranscriptSchema);
