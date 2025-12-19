import mongoose, { Schema, Document } from 'mongoose';

export interface IPrompt extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  content: string;
  voiceId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromptSchema = new Schema<IPrompt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    voiceId: {
      type: String,
      required: true,
      enum: ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'marin', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'cedar'],
      default: 'alloy'
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
PromptSchema.index({ userId: 1, name: 1 });
PromptSchema.index({ userId: 1, isDefault: 1 });

const Prompt = mongoose.model<IPrompt>('Prompt', PromptSchema);

export default Prompt;

