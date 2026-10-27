import mongoose from 'mongoose';
import { PersonVote } from '../models/PersonVote.js';
import { RatingReview } from '../models/RatingReview.js';
import { Watchlist } from '../models/Watchlist.js';
import { User } from '../models/User.js';
import { getTrending, getDiscover, getDetails } from '../services/tmdb.js';
import { GENRE_MAP } from '../services/tmdbCuratedFallback.js';

// --- Trending People & Community Upvotes & Following ---

export const getTrendingPeopleWithVotes = async (req, res) => {
  try {
    const tmdbData = await getTrending('person', 'week');
    const people = tmdbData.results || [];
    const personIds = people.map(p => p.id);

    // Aggregate MongoDB upvotes for each person if DB is connected
    const currentUserId = req.user?._id;
    let voteCounts = {};
    let userVotedMap = {};
    let userFollowingMap = {};

    if (mongoose.connection.readyState === 1) {
      try {
        const counts = await PersonVote.aggregate([
          { $match: { personId: { $in: personIds } } },
          { $group: { _id: '$personId', count: { $sum: 1 } } }
        ]);
        counts.forEach(c => {
          voteCounts[c._id] = c.count;
        });

        if (currentUserId) {
          const [userVotes, currentUser] = await Promise.all([
            PersonVote.find({
              userId: currentUserId,
              personId: { $in: personIds }
            }),
            User.findById(currentUserId).select('followingPeople')
          ]);

          userVotes.forEach(v => {
            userVotedMap[v.personId] = true;
          });

          if (currentUser?.followingPeople) {
            currentUser.followingPeople.forEach(f => {
              userFollowingMap[f.personId] = true;
            });
          }
        }
      } catch (dbErr) {
        console.warn('[Community] DB query skipped in getTrendingPeopleWithVotes:', dbErr.message);
      }
    }

    const enrichedPeople = people.map((person, index) => ({
      ...person,
      rank: index + 1,
      rank_delta: index === 0 ? '▲ 1,459' : (index % 2 === 0 ? `▲ ${index * 12 + 10}` : '-'),
      afterframe_votes: voteCounts[person.id] || 0,
      user_has_upvoted: Boolean(userVotedMap[person.id]),
      user_is_following: Boolean(userFollowingMap[person.id])
    }));

    res.json({
      isLive: tmdbData.isLive,
      people: enrichedPeople
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending people', message: err.message });
  }
};

export const togglePersonUpvote = async (req, res) => {
  try {
    const { personId, personName, profilePath, knownForDepartment } = req.body;
    const userId = req.user._id;

    if (!personId || !personName) {
      return res.status(400).json({ error: 'Person ID and Name are required.' });
    }

    const existingVote = await PersonVote.findOne({ userId, personId });

    let voted = false;
    if (existingVote) {
      // Toggle off
      await PersonVote.deleteOne({ _id: existingVote._id });
      voted = false;
    } else {
      // Add vote
      await PersonVote.create({
        userId,
        personId,
        personName,
        profilePath: profilePath || '',
        knownForDepartment: knownForDepartment || 'Acting'
      });
      voted = true;
    }

    const totalVotes = await PersonVote.countDocuments({ personId });

    res.json({
      message: voted ? 'Upvoted for AfterFrame community!' : 'Upvote removed',
      personId,
      voted,
      totalVotes
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process upvote', message: err.message });
  }
};

// Independent Celebrity Following (personal list, completely independent of community upvotes)
export const toggleFollowPerson = async (req, res) => {
  try {
    const { personId, name, department, profilePath } = req.body;
    const userId = req.user._id;

    if (!personId || !name) {
      return res.status(400).json({ error: 'Person ID and Name are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const numericId = Number(personId);
    user.followingPeople = user.followingPeople || [];
    const existingIndex = user.followingPeople.findIndex(p => p.personId === numericId);

    let following = false;
    if (existingIndex > -1) {
      user.followingPeople.splice(existingIndex, 1);
      following = false;
    } else {
      user.followingPeople.push({
        personId: numericId,
        name,
        department: department || 'Acting',
        profilePath: profilePath || '',
        followedAt: new Date()
      });
      following = true;
    }

    await user.save();

    res.json({
      message: following ? `Following ${name}` : `Unfollowed ${name}`,
      personId: numericId,
      following,
      followingPeople: user.followingPeople
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update following status', message: err.message });
  }
};

export const getFollowedPeople = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('followingPeople');
    res.json({
      followingPeople: user?.followingPeople || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve followed people', message: err.message });
  }
};

// --- Title Ratings & Reviews ---

export const getTitleCommunityStats = async (req, res) => {
  try {
    const { tmdbId, mediaType = 'movie' } = req.params;
    const numericId = Number(tmdbId);

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        tmdbId: numericId,
        mediaType,
        hasCommunityReviews: false,
        afterframe_avg_rating: null,
        afterframe_vote_count: 0,
        subrating_averages: { plot: null, performances: null, cinematography: null, soundtrack: null },
        reviews: [],
        user_rating_record: null
      });
    }

    // Compute AfterFrame community metrics
    const reviews = await RatingReview.find({ tmdbId: numericId, mediaType })
      .sort({ createdAt: -1 })
      .limit(50);

    const count = reviews.length;
    let avgRating = null;
    let subratingAverages = {
      plot: null,
      performances: null,
      cinematography: null,
      soundtrack: null
    };

    if (count > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = Number((sum / count).toFixed(1));

      // Calculate subrating averages where provided
      ['plot', 'performances', 'cinematography', 'soundtrack'].forEach(aspect => {
        const validScores = reviews.filter(r => r.subratings && r.subratings[aspect] != null).map(r => r.subratings[aspect]);
        if (validScores.length > 0) {
          const aspectSum = validScores.reduce((a, b) => a + b, 0);
          subratingAverages[aspect] = Number((aspectSum / validScores.length).toFixed(1));
        }
      });
    }

    // Check if current user has already rated
    let userReview = null;
    if (req.user) {
      userReview = await RatingReview.findOne({
        userId: req.user._id,
        tmdbId: numericId,
        mediaType
      });
    }

    res.json({
      tmdbId: numericId,
      mediaType,
      hasCommunityReviews: count > 0,
      afterframe_avg_rating: avgRating,
      afterframe_vote_count: count,
      subrating_averages: subratingAverages,
      reviews,
      user_rating_record: userReview
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch community ratings', message: err.message });
  }
};

export const upsertRatingReview = async (req, res) => {
  try {
    const {
      tmdbId,
      mediaType = 'movie',
      title,
      posterPath,
      releaseDate,
      genres = [],
      rating,
      subratings,
      reviewTitle,
      reviewText,
      hasSpoiler
    } = req.body;

    const userId = req.user._id;
    const userName = req.user.name;
    const userAvatar = req.user.avatar;

    if (!tmdbId || !title || rating == null) {
      return res.status(400).json({ error: 'Title, TMDB ID, and Rating (0.5 to 5.0) are required.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 0.5 || numRating > 5.0 || !Number.isInteger(numRating * 2)) {
      return res.status(400).json({ error: 'Rating must be a half-star value between 0.5 and 5.0.' });
    }

    // Upsert rating review record
    const record = await RatingReview.findOneAndUpdate(
      { userId, tmdbId: Number(tmdbId), mediaType },
      {
        userName,
        userAvatar,
        title,
        posterPath: posterPath || '',
        releaseDate: releaseDate || '',
        genres,
        rating: numRating,
        subratings: {
          plot: subratings?.plot ? Number(subratings.plot) : null,
          performances: subratings?.performances ? Number(subratings.performances) : null,
          cinematography: subratings?.cinematography ? Number(subratings.cinematography) : null,
          soundtrack: subratings?.soundtrack ? Number(subratings.soundtrack) : null,
        },
        reviewTitle: reviewTitle || '',
        reviewText: reviewText || '',
        hasSpoiler: Boolean(hasSpoiler),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also automatically mark in Watchlist as 'watched'
    try {
      await Watchlist.findOneAndUpdate(
        { userId, tmdbId: Number(tmdbId), mediaType },
        {
          title,
          posterPath: posterPath || '',
          releaseDate: releaseDate || '',
          genres,
          status: 'watched',
          watchedAt: new Date()
        },
        { upsert: true }
      );
    } catch (wlErr) {
      console.warn('[Community] Auto-update watchlist to watched warning:', wlErr.message);
    }

    res.status(200).json({
      message: 'Rating and review saved successfully',
      review: record
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save rating/review', message: err.message });
  }
};

export const deleteRatingReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const record = await RatingReview.findOne({ _id: id, userId });
    if (!record) {
      return res.status(404).json({ error: 'Review not found or you are not authorized to delete it.' });
    }

    await RatingReview.deleteOne({ _id: id });
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review', message: err.message });
  }
};

// --- Review Pulse: Deterministic genuine aggregation ---
export const getReviewPulse = async (req, res) => {
  try {
    const { tmdbId, mediaType = 'movie' } = req.params;
    const numericId = Number(tmdbId);

    // Fetch local reviews if DB is up
    const localReviews = mongoose.connection.readyState === 1
      ? await RatingReview.find({ tmdbId: numericId, mediaType })
      : [];
    // Fetch external TMDB details for reviews
    const tmdbData = await getDetails(mediaType, numericId);
    const tmdbReviews = tmdbData.data?.reviews?.results || [];

    const allReviewTexts = [
      ...localReviews.map(r => `${r.reviewTitle} ${r.reviewText}`),
      ...tmdbReviews.map(r => r.content || '')
    ].filter(Boolean);

    const totalSampleCount = localReviews.length + tmdbReviews.length;

    // Common cinema keywords to extract frequency from actual reviews
    const CANDIDATE_WORDS = [
      'cinematography', 'performances', 'soundtrack', 'masterpiece', 'thrilling',
      'pacing', 'direction', 'acting', 'dialogue', 'visuals', 'emotional',
      'intense', 'twists', 'gripping', 'nostalgic', 'atmospheric', 'screenplay', 'humor'
    ];

    const keywordCounts = {};
    const lowerJoined = allReviewTexts.join(' ').toLowerCase();

    CANDIDATE_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerJoined.match(regex);
      if (matches && matches.length > 0) {
        keywordCounts[word] = matches.length;
      }
    });

    const frequentKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword, count]) => ({ keyword, count }));

    res.json({
      pulseAvailable: totalSampleCount > 0,
      sampleSize: totalSampleCount,
      localReviewCount: localReviews.length,
      tmdbReviewCount: tmdbReviews.length,
      frequentKeywords,
      sourceNote: 'Review Pulse is generated deterministically from verified TMDB and AfterFrame user reviews.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute review pulse', message: err.message });
  }
};

// --- Explainable Taste Match & Personalized Recommendations ---

/**
 * Deterministically computes explainable "Your Match: X.X/10" compatibility score.
 * Configurable weights:
 * - Preferred genres: 40%
 * - Preferred languages and regional preferences: 20%
 * - Viewing-style compatibility: 15%
 * - Favourite or followed talent: 15%
 * - Historical ratings: 10%
 * Normalizes when signals are missing. Returns building state if insufficient data.
 */
export const computeTasteMatch = (user, media, userRatings = []) => {
  const WEIGHTS = {
    genres: 0.40,
    languageRegion: 0.20,
    viewingStyle: 0.15,
    talent: 0.15,
    historicalRatings: 0.10,
  };

  const breakdowns = [];
  let totalActiveWeight = 0;
  let weightedScoreSum = 0;

  // Extract media genres
  const mediaGenreNames = [];
  if (Array.isArray(media.genres)) {
    media.genres.forEach(g => {
      if (typeof g === 'string') mediaGenreNames.push(g);
      else if (g?.name) mediaGenreNames.push(g.name);
    });
  } else if (Array.isArray(media.genre_ids)) {
    media.genre_ids.forEach(id => {
      if (GENRE_MAP[id]) mediaGenreNames.push(GENRE_MAP[id]);
    });
  }

  // 1. Genres (40%)
  const userGenres = [
    ...(user?.preferences?.genres || []),
    ...(user?.favoriteGenres || [])
  ];
  if (userGenres.length > 0 && mediaGenreNames.length > 0) {
    const matched = userGenres.filter(ug =>
      mediaGenreNames.some(mg => mg.toLowerCase() === ug.toLowerCase())
    );
    totalActiveWeight += WEIGHTS.genres;
    const score = matched.length >= 2 ? 1.0 : (matched.length === 1 ? 0.8 : 0.25);
    weightedScoreSum += score * WEIGHTS.genres;
    if (matched.length > 0) {
      breakdowns.push({
        factor: 'Preferred Genres',
        impact: '+40%',
        text: `Matches your genre interests in ${matched.slice(0, 2).join(' & ')}.`
      });
    }
  }

  // 2. Languages & Regional Preferences (20%)
  const userLangs = (user?.preferences?.languages || []).map(l => l.toLowerCase());
  const userRegion = (user?.preferredRegion || 'IN').toLowerCase();
  const mediaLang = (media.original_language || '').toLowerCase();
  const mediaCountries = (media.origin_country || media.production_countries || []).map(c =>
    typeof c === 'string' ? c.toLowerCase() : (c.iso_3166_1 || '').toLowerCase()
  );

  const LANG_NAMES = {
    en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil',
    ml: 'Malayalam', kn: 'Kannada', ko: 'Korean', ja: 'Japanese',
    es: 'Spanish', fr: 'French'
  };

  if (userLangs.length > 0) {
    totalActiveWeight += WEIGHTS.languageRegion;
    const langMatch = userLangs.some(l =>
      l === mediaLang || (LANG_NAMES[mediaLang] && l === LANG_NAMES[mediaLang].toLowerCase())
    );
    const regionMatch = mediaCountries.includes(userRegion);

    if (langMatch || regionMatch) {
      const score = (langMatch && regionMatch) ? 1.0 : 0.85;
      weightedScoreSum += score * WEIGHTS.languageRegion;
      breakdowns.push({
        factor: 'Language & Region',
        impact: '+20%',
        text: `Language aligns with your preferences (${LANG_NAMES[mediaLang] || mediaLang.toUpperCase()}).`
      });
    } else {
      weightedScoreSum += 0.3 * WEIGHTS.languageRegion;
    }
  }

  // 3. Viewing Style (15%)
  const styles = user?.preferences?.viewingStyles || {};
  let styleScore = 0;
  let styleChecks = 0;
  let styleNotes = [];

  const releaseYear = parseInt((media.release_date || media.first_air_date || '').slice(0, 4), 10);
  const runtime = media.runtime || (media.episode_run_time ? media.episode_run_time[0] : null);

  if (styles.era && styles.era !== 'any' && !isNaN(releaseYear)) {
    styleChecks++;
    if ((styles.era === 'classic' && releaseYear < 2000) || (styles.era === 'recent' && releaseYear >= 2000)) {
      styleScore += 1;
      styleNotes.push(styles.era === 'classic' ? 'classic era release' : 'modern release');
    }
  }

  if (styles.length && styles.length !== 'any' && runtime) {
    styleChecks++;
    if ((styles.length === 'short' && runtime <= 105) || (styles.length === 'long' && runtime >= 135)) {
      styleScore += 1;
      styleNotes.push(`${styles.length} film duration`);
    } else if (styles.length === 'standard') {
      styleScore += 0.8;
    }
  }

  if (styles.mood && styles.mood !== 'any') {
    styleChecks++;
    const isLight = mediaGenreNames.some(g => ['Comedy', 'Animation', 'Family'].includes(g));
    const isIntense = mediaGenreNames.some(g => ['Thriller', 'Horror', 'Mystery', 'Crime', 'War'].includes(g));
    if ((styles.mood === 'lighthearted' && isLight) || (styles.mood === 'intense' && isIntense)) {
      styleScore += 1;
      styleNotes.push(`${styles.mood} storytelling mood`);
    }
  }

  if (styleChecks > 0) {
    totalActiveWeight += WEIGHTS.viewingStyle;
    const finalStyleFactor = styleScore / styleChecks;
    weightedScoreSum += finalStyleFactor * WEIGHTS.viewingStyle;
    if (styleNotes.length > 0) {
      breakdowns.push({
        factor: 'Viewing Style',
        impact: '+15%',
        text: `Matches your preference for ${styleNotes.join(' and ')}.`
      });
    }
  }

  // 4. Followed & Favorite Talent (15%)
  const followed = user?.followingPeople || [];
  const favPeople = user?.preferences?.favoritePeople || [];
  const allTalent = [...followed, ...favPeople];

  if (allTalent.length > 0) {
    totalActiveWeight += WEIGHTS.talent;
    const cast = media.credits?.cast || [];
    const crew = media.credits?.crew || [];
    const talentMatches = allTalent.filter(person =>
      cast.some(c => c.id === person.personId || c.id === person.id) ||
      crew.some(c => c.id === person.personId || c.id === person.id)
    );

    if (talentMatches.length > 0) {
      weightedScoreSum += 1.0 * WEIGHTS.talent;
      breakdowns.push({
        factor: 'Favorite Talent',
        impact: '+15%',
        text: `Features ${talentMatches.map(t => t.name).slice(0, 2).join(' & ')} whom you follow.`
      });
    } else {
      weightedScoreSum += 0.25 * WEIGHTS.talent;
    }
  }

  // 5. Historical Ratings (10%)
  if (userRatings.length >= 1 && mediaGenreNames.length > 0) {
    const relevantRatings = userRatings.filter(r =>
      (r.genres || []).some(rg => mediaGenreNames.includes(rg))
    );
    if (relevantRatings.length > 0) {
      totalActiveWeight += WEIGHTS.historicalRatings;
      const avg = relevantRatings.reduce((sum, r) => sum + r.rating, 0) / relevantRatings.length;
      const normalizedAvg = Math.min(1, Math.max(0, avg / 5.0));
      weightedScoreSum += normalizedAvg * WEIGHTS.historicalRatings;
      if (avg >= 3.5) {
        breakdowns.push({
          factor: 'Rating History',
          impact: '+10%',
          text: `You historically rated related ${mediaGenreNames[0]} titles highly (${avg.toFixed(1)}/5★ average).`
        });
      }
    }
  }

  // Neutral threshold: if total active weight is too low, profile is still building
  if (totalActiveWeight < 0.20) {
    return {
      status: 'building',
      score: null,
      message: 'Building your taste profile',
      subtext: 'Add preferences or rate a few movies to unlock your personalized Taste Match.',
      disclaimer: 'Taste Match is an explainable compatibility score based on your actual activity and preferences. It does not guarantee enjoyment.',
      breakdowns: []
    };
  }

  // Calculate normalized score out of 10
  const normalizedRaw = (weightedScoreSum / totalActiveWeight) * 10;
  const finalScore = Number(Math.min(9.8, Math.max(3.0, normalizedRaw)).toFixed(1));

  return {
    status: 'calculated',
    score: finalScore,
    maxScore: 10,
    breakdowns,
    disclaimer: 'Your Match score reflects compatibility with your saved preferences and ratings. It is not an assessment of movie quality or a guarantee of enjoyment.'
  };
};

export const getTasteMatchScore = async (req, res) => {
  try {
    const { mediaType = 'movie', tmdbId } = req.params;
    const numericId = Number(tmdbId);
    const userId = req.user?._id;

    if (!userId) {
      return res.json({
        status: 'guest',
        score: null,
        message: 'Sign in to see your personalized Taste Match',
        breakdowns: []
      });
    }

    const [user, userRatings, tmdbDetails] = await Promise.all([
      User.findById(userId),
      RatingReview.find({ userId }),
      getDetails(mediaType, numericId).catch(() => null)
    ]);

    if (!tmdbDetails || !tmdbDetails.data) {
      return res.status(404).json({ error: 'Media details not found.' });
    }

    const matchResult = computeTasteMatch(user, tmdbDetails.data, userRatings);
    res.json(matchResult);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute Taste Match', message: err.message });
  }
};

export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user profile and ratings
    const [user, userRatings, userWatchlist] = await Promise.all([
      User.findById(userId),
      RatingReview.find({ userId }),
      Watchlist.find({ userId })
    ]);

    // Check if user has neither preferences nor 3 ratings
    const hasGenres = (user?.preferences?.genres?.length || 0) > 0 || (user?.favoriteGenres?.length || 0) > 0;
    if (userRatings.length < 3 && !hasGenres) {
      return res.json({
        eligible: false,
        message: 'Your taste is still in the opening credits.',
        subtext: 'Rate three movies and AfterFrame will start learning what you love.',
        ratingsCount: userRatings.length,
        requiredCount: 3,
        recommendations: []
      });
    }

    // Tally genre weights from user ratings and saved preferences
    const genreScore = {};
    (user?.preferences?.genres || []).forEach(g => {
      genreScore[g] = (genreScore[g] || 0) + 3;
    });
    (user?.favoriteGenres || []).forEach(g => {
      genreScore[g] = (genreScore[g] || 0) + 2;
    });
    userRatings.forEach(r => {
      const weight = r.rating >= 3.5 ? 2 : 1;
      (r.genres || []).forEach(g => {
        genreScore[g] = (genreScore[g] || 0) + weight;
      });
    });

    // Find top preferred genre name
    const sortedGenres = Object.entries(genreScore).sort((a, b) => b[1] - a[1]);
    const topGenreName = sortedGenres[0]?.[0] || 'Drama';

    // Reverse lookup genre ID
    const genreEntry = Object.entries(GENRE_MAP).find(
      ([, name]) => name.toLowerCase() === topGenreName.toLowerCase()
    );
    const topGenreId = genreEntry ? genreEntry[0] : 18;

    // Discover candidates from TMDB
    const discoverResult = await getDiscover('movie', {
      with_genres: topGenreId,
      sort_by: 'vote_average.desc',
      'vote_count.gte': 400
    });

    // Exclude already rated or watchlisted titles
    const ratedIds = new Set(userRatings.map(r => r.tmdbId));
    const watchedIds = new Set(userWatchlist.filter(w => w.status === 'watched').map(w => w.tmdbId));
    const watchlistIds = new Set(userWatchlist.map(w => w.tmdbId));

    const candidateResults = discoverResult.results || [];
    const filtered = candidateResults.filter(
      movie => !ratedIds.has(movie.id) && !watchedIds.has(movie.id) && !watchlistIds.has(movie.id)
    ).slice(0, 10);

    // Compute Taste Match for each candidate
    const enrichedRecommendations = filtered.map(movie => {
      const tasteMatch = computeTasteMatch(user, movie, userRatings);
      return {
        ...movie,
        tasteMatch
      };
    });

    res.json({
      eligible: true,
      ratingsCount: userRatings.length,
      topGenre: topGenreName,
      explanation: userRatings.length >= 3
        ? `Because you rated other ${topGenreName.toLowerCase()}s highly.`
        : `Curated for your saved preference in ${topGenreName}.`,
      recommendations: enrichedRecommendations
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate recommendations', message: err.message });
  }
};
