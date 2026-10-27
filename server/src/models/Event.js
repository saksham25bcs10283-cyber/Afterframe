import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    movie: {
      tmdbId: { type: Number, required: true },
      mediaType: { type: String, default: 'movie' },
      title: { type: String, required: true },
      posterPath: { type: String, default: '' },
      releaseDate: { type: String, default: '' },
    },
    eventType: {
      type: String,
      enum: ['watch_party', 'theatre_outing'],
      default: 'theatre_outing',
    },
    dateTime: {
      type: Date,
      required: [true, 'Date and time are required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue or stream platform is required'],
      trim: true,
      maxlength: 200,
    },
    city: {
      type: String,
      default: 'Mumbai, India',
      trim: true,
    },
    maxAttendees: {
      type: Number,
      required: true,
      default: 10,
      min: [2, 'Event must accommodate at least 2 people'],
      max: [100, 'Maximum capacity is 100 people'],
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organizerName: {
      type: String,
      required: true,
    },
    organizerAvatar: {
      type: String,
      default: '',
    },
    attendees: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        userAvatar: {
          type: String,
          default: '',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Event = mongoose.model('Event', eventSchema);
