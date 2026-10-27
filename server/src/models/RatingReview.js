import mongoose from 'mongoose';

const ratingReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userAvatar: {
      type: String,
      default: '',
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
    releaseDate: {
      type: String,
      default: '',
    },
    genres: {
      type: [String],
      default: [],
    },
    // Half-star rating: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [0.5, 'Rating must be at least 0.5 stars'],
      max: [5.0, 'Rating cannot exceed 5.0 stars'],
      validate: {
        validator: function (v) {
          return Number.isInteger(v * 2);
        },
        message: 'Rating must be a half-star increment (e.g. 0.5, 1, 1.5 ... 5.0)',
      },
    },
    // Optional 1-10 subratings
    subratings: {
      plot: { type: Number, min: 1, max: 10, default: null },
      performances: { type: Number, min: 1, max: 10, default: null },
      cinematography: { type: Number, min: 1, max: 10, default: null },
      soundtrack: { type: Number, min: 1, max: 10, default: null },
    },
    reviewTitle: {
      type: String,
      default: '',
      maxlength: 120,
      trim: true,
    },
    reviewText: {
      type: String,
      default: '',
      maxlength: 3000,
      trim: true,
    },
    hasSpoiler: {
      type: Boolean,
      default: false,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate user/title ratings
ratingReviewSchema.index({ userId: 1, tmdbId: 1, mediaType: 1 }, { unique: true });

export const RatingReview = mongoose.model('RatingReview', ratingReviewSchema);
