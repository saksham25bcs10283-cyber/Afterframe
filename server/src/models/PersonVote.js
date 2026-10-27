import mongoose from 'mongoose';

const personVoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    personId: {
      type: Number,
      required: true,
      index: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    profilePath: {
      type: String,
      default: '',
    },
    knownForDepartment: {
      type: String,
      default: 'Acting',
    },
  },
  {
    timestamps: true,
  }
);

// One active vote per user per celebrity
personVoteSchema.index({ userId: 1, personId: 1 }, { unique: true });

export const PersonVote = mongoose.model('PersonVote', personVoteSchema);
