import { Watchlist } from '../models/Watchlist.js';
import { RatingReview } from '../models/RatingReview.js';

export const getWatchlist = async (req, res) => {
  try {
    const { status, mediaType, search, genre } = req.query;
    const query = { userId: req.user._id };

    if (status && ['plan_to_watch', 'watching', 'watched'].includes(status)) {
      query.status = status;
    }
    if (mediaType && ['movie', 'tv'].includes(mediaType)) {
      query.mediaType = mediaType;
    }
    if (search) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }
    if (genre) {
      query.genres = genre;
    }

    const items = await Watchlist.find(query).sort({ updatedAt: -1 });
    res.json({
      count: items.length,
      items
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist', message: err.message });
  }
};

export const addToWatchlist = async (req, res) => {
  try {
    const {
      tmdbId,
      mediaType = 'movie',
      title,
      posterPath,
      backdropPath,
      releaseDate,
      voteAverage,
      genres = [],
      status = 'plan_to_watch',
      notes
    } = req.body;

    const userId = req.user._id;

    if (!tmdbId || !title) {
      return res.status(400).json({ error: 'tmdbId and title are required.' });
    }

    const item = await Watchlist.findOneAndUpdate(
      { userId, tmdbId: Number(tmdbId), mediaType },
      {
        title,
        posterPath: posterPath || '',
        backdropPath: backdropPath || '',
        releaseDate: releaseDate || '',
        voteAverage: voteAverage || 0,
        genres: Array.isArray(genres) ? genres : [],
        status,
        watchedAt: status === 'watched' ? new Date() : null,
        notes: notes || ''
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: status === 'watched' ? 'Marked as watched' : 'Added to watchlist',
      item
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update watchlist', message: err.message });
  }
};

export const updateWatchlistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user._id;

    const updateFields = {};
    if (status) {
      updateFields.status = status;
      if (status === 'watched') {
        updateFields.watchedAt = new Date();
      }
    }
    if (notes !== undefined) {
      updateFields.notes = notes;
    }

    const item = await Watchlist.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateFields },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Watchlist item not found.' });
    }

    res.json({ message: 'Watchlist item updated', item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status', message: err.message });
  }
};

export const removeFromWatchlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deleted = await Watchlist.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ error: 'Watchlist entry not found.' });
    }

    res.json({ message: 'Removed from watchlist', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete watchlist entry', message: err.message });
  }
};

export const syncGuestWatchlist = async (req, res) => {
  try {
    const { items = [] } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ synced: 0 });
    }

    let synced = 0;
    for (const item of items) {
      if (item.tmdbId && item.title) {
        await Watchlist.findOneAndUpdate(
          { userId, tmdbId: Number(item.tmdbId), mediaType: item.mediaType || 'movie' },
          {
            title: item.title,
            posterPath: item.posterPath || '',
            releaseDate: item.releaseDate || '',
            voteAverage: item.voteAverage || 0,
            genres: item.genres || [],
            status: item.status || 'plan_to_watch',
            watchedAt: item.status === 'watched' ? new Date() : null
          },
          { upsert: true }
        );
        synced++;
      }
    }

    res.json({ message: `Synced ${synced} items to your account`, synced });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync guest watchlist', message: err.message });
  }
};

// --- Personal Statistics for My Cinema ---
export const getMyCinemaStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const watchedItems = await Watchlist.find({ userId, status: 'watched' });
    const userRatings = await RatingReview.find({ userId });

    const totalWatched = watchedItems.length;
    const totalRated = userRatings.length;

    // Average rating
    let averageRating = 0;
    if (totalRated > 0) {
      const sum = userRatings.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Number((sum / totalRated).toFixed(1));
    }

    // Most-watched genres
    const genreCounts = {};
    watchedItems.forEach(item => {
      (item.genres || []).forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));

    // Yearly / Monthly activity breakdown
    const activityMap = {};
    watchedItems.forEach(item => {
      const date = item.watchedAt || item.updatedAt;
      if (date) {
        const yearMonth = new Date(date).toISOString().slice(0, 7); // YYYY-MM
        activityMap[yearMonth] = (activityMap[yearMonth] || 0) + 1;
      }
    });

    const monthlyActivity = Object.entries(activityMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, count]) => ({ period, count }));

    res.json({
      totalWatched,
      totalRated,
      averageRating,
      topGenres,
      monthlyActivity
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute cinema stats', message: err.message });
  }
};
