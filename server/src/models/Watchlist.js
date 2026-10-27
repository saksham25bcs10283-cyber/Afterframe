import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tmdbId: {
      type: Number,
      required: true,
      index: true,
    },
    mediaType: {
      type: String,
      enum: ['movie', 'tv'],
      default: 'movie',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    posterPath: {
      type: String,
      default: '',
    },
    backdropPath: {
      type: String,
      default: '',
    },
    releaseDate: {
      type: String,
      default: '',
    },
    voteAverage: {
      type: Number,
      default: 0,
    },
    genres: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['plan_to_watch', 'watching', 'watched'],
      default: 'plan_to_watch',
      index: true,
    },
    watchedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries for the same user and title
watchlistSchema.index({ userId: 1, tmdbId: 1, mediaType: 1 }, { unique: true });

export const Watchlist = mongoose.model('Watchlist', watchlistSchema);
