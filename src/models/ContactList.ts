import mongoose, { Schema, Document } from 'mongoose';

export interface IContactList extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  contacts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ContactListSchema = new Schema<IContactList>(
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
    contacts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Contact'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Index for faster queries
ContactListSchema.index({ userId: 1, name: 1 });

const ContactList = mongoose.model<IContactList>('ContactList', ContactListSchema);

export default ContactList;

