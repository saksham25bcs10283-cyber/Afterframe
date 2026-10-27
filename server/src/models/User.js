import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: 'Film enthusiast & AfterFrame member',
      maxlength: 300,
    },
    favoriteGenres: {
      type: [String],
      default: [],
    },
    preferredRegion: {
      type: String,
      default: 'IN',
    },
    preferences: {
      genres: { type: [String], default: [] },
      languages: { type: [String], default: [] },
      viewingStyles: {
        era: { type: String, default: 'any' },
        length: { type: String, default: 'any' },
        mood: { type: String, default: 'any' }
      },
      favoriteTitles: [
        {
          id: { type: Number, required: true },
          title: { type: String, required: true },
          mediaType: { type: String, default: 'movie' },
          posterPath: { type: String, default: '' }
        }
      ],
      favoritePeople: [
        {
          id: { type: Number, required: true },
          name: { type: String, required: true },
          department: { type: String, default: 'Acting' },
          profilePath: { type: String, default: '' }
        }
      ]
    },
    followingPeople: [
      {
        personId: { type: Number, required: true },
        name: { type: String, required: true },
        department: { type: String, default: 'Acting' },
        profilePath: { type: String, default: '' },
        followedAt: { type: Date, default: Date.now }
      }
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    favoriteGenres: this.favoriteGenres,
    preferredRegion: this.preferredRegion,
    preferences: this.preferences || {
      genres: [],
      languages: [],
      viewingStyles: { era: 'any', length: 'any', mood: 'any' },
      favoriteTitles: [],
      favoritePeople: []
    },
    followingPeople: this.followingPeople || [],
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
