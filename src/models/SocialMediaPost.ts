import mongoose, { Document, Schema } from 'mongoose';

export interface IInsights {
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  lastFetched?: Date;
}

export interface ISocialMediaPost extends Document {
  userId: mongoose.Types.ObjectId;
  platform: 'facebook' | 'instagram';
  postId: string;
  imageUrl: string;
  caption: string;
  status: 'draft' | 'published' | 'deleted';
  insights: IInsights;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SocialMediaPostSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram'],
    required: true,
    default: 'facebook'
  },
  postId: {
    type: String,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'deleted'],
    default: 'published'
  },
  insights: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    lastFetched: { type: Date }
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create compound indexes for better query performance
// (postId unique index is created by unique: true)
SocialMediaPostSchema.index({ userId: 1, status: 1, createdAt: -1 });
SocialMediaPostSchema.index({ userId: 1, platform: 1, publishedAt: -1 });
SocialMediaPostSchema.index({ 'insights.engagement': -1 });

export default mongoose.model<ISocialMediaPost>('SocialMediaPost', SocialMediaPostSchema);
