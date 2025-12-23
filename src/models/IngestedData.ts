import mongoose, { Document, Schema } from 'mongoose';

export interface IIngestedData extends Document {
  collectionName: string;
  type: 'url' | 'pdf' | 'csv';
  source: string; // GCS URL for files, or actual URL for web pages
  filename?: string;
  url?: string; // Original URL if type is 'url'
  ingestedAt: Date;
  status: 'success' | 'failed';
  error?: string;
}

const IngestedDataSchema = new Schema<IIngestedData>({
  collectionName: { type: String, required: true, default: 'inshora' },
  type: { type: String, enum: ['url', 'pdf', 'csv'], required: true },
  source: { type: String, required: true },
  filename: { type: String },
  url: { type: String },
  ingestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  error: { type: String },
});

export default mongoose.model<IIngestedData>('IngestedData', IngestedDataSchema);

