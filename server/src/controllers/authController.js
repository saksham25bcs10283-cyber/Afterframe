import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'afterframe_secure_jwt_secret_key_cinema_2026';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, preferences } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Validate and sanitize onboarding preferences
    const sanitizedPreferences = {
      genres: Array.isArray(preferences?.genres) ? preferences.genres.map(String) : [],
      languages: Array.isArray(preferences?.languages) ? preferences.languages.map(String) : [],
      viewingStyles: {
        era: preferences?.viewingStyles?.era || 'any',
        length: preferences?.viewingStyles?.length || 'any',
        mood: preferences?.viewingStyles?.mood || 'any'
      },
      favoriteTitles: Array.isArray(preferences?.favoriteTitles)
        ? preferences.favoriteTitles.map(t => ({
            id: Number(t.id),
            title: String(t.title || ''),
            mediaType: t.mediaType || 'movie',
            posterPath: t.posterPath || ''
          }))
        : [],
      favoritePeople: Array.isArray(preferences?.favoritePeople)
        ? preferences.favoritePeople.map(p => ({
            id: Number(p.id),
            name: String(p.name || ''),
            department: p.department || 'Acting',
            profilePath: p.profilePath || ''
          }))
        : []
    };

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`,
      favoriteGenres: sanitizedPreferences.genres,
      preferences: sanitizedPreferences
    });

    // CRITICAL: Signup must NOT automatically log user in or issue an authenticated session.
    // User must explicitly sign in before their personalized experience loads.
    res.status(201).json({
      message: 'Account created successfully! Please sign in with your credentials to access your personalized cinema experience.',
      requiresLogin: true,
      user: user.toSafeObject()
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Signed in successfully',
      user: user.toSafeObject(),
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
};

export const getMe = async (req, res) => {
  res.json({
    user: req.user.toSafeObject()
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, preferredRegion, favoriteGenres, preferences } = req.body;
    const user = req.user;

    if (name) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (preferredRegion) user.preferredRegion = preferredRegion;
    if (favoriteGenres) user.favoriteGenres = favoriteGenres;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
      if (preferences.genres) {
        user.favoriteGenres = preferences.genres;
      }
    }

    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: user.toSafeObject()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', message: err.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    if (!preferences) {
      return res.status(400).json({ error: 'Preferences object is required.' });
    }

    const user = req.user;
    user.preferences = {
      genres: Array.isArray(preferences.genres) ? preferences.genres : user.preferences?.genres || [],
      languages: Array.isArray(preferences.languages) ? preferences.languages : user.preferences?.languages || [],
      viewingStyles: {
        ...(user.preferences?.viewingStyles || {}),
        ...(preferences.viewingStyles || {})
      },
      favoriteTitles: Array.isArray(preferences.favoriteTitles) ? preferences.favoriteTitles : user.preferences?.favoriteTitles || [],
      favoritePeople: Array.isArray(preferences.favoritePeople) ? preferences.favoritePeople : user.preferences?.favoritePeople || []
    };

    if (preferences.genres) {
      user.favoriteGenres = preferences.genres;
    }

    await user.save();
    res.json({
      message: 'Movie preferences updated successfully',
      preferences: user.preferences,
      user: user.toSafeObject()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences', message: err.message });
  }
};
