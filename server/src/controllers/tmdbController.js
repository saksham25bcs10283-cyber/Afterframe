import {
  getTrending,
  getTopRated,
  getPopular,
  getRegionalOriginTitles,
  getDiscover,
  getDetails,
  getPersonDetails,
  searchMulti,
  getGenres,
  getTrailer,
  getProvidersForRegion,
  getStreamingTitlesByProvider,
  isTmdbConfigured
} from '../services/tmdb.js';
import { CURATED_STREAMING_PROVIDERS, CURATED_POPULAR_INTERESTS } from '../services/tmdbCuratedFallback.js';

export const getTrendingMedia = async (req, res) => {
  try {
    const { mediaType = 'movie', timeWindow = 'week' } = req.query;
    const data = await getTrending(mediaType, timeWindow);
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending media', message: err.message });
  }
};

export const getTop10ThisWeek = async (req, res) => {
  try {
    const data = await getTrending('movie', 'week');
    const top10 = (data.results || []).slice(0, 10).map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
    res.json({
      configured: isTmdbConfigured(),
      isLive: data.isLive,
      results: top10
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Top 10', message: err.message });
  }
};

export const getPopularInRegion = async (req, res) => {
  try {
    const { region = 'IN', page = 1 } = req.query;
    const data = await getPopular('movie', page, region);
    res.json({
      configured: isTmdbConfigured(),
      region,
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch regional popularity', message: err.message });
  }
};

export const getRegionalDiscovery = async (req, res) => {
  try {
    const { mediaType = 'movie', region = 'IN', page = 1 } = req.query;
    const data = await getRegionalOriginTitles(mediaType, region, Number(page));
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch regional discovery', message: err.message });
  }
};

export const getTopRatedChart = async (req, res) => {
  try {
    const { mediaType = 'movie', page = 1 } = req.query;
    const data = await getTopRated(mediaType, Number(page));
    // Annotate ranks
    const startIndex = (Number(page) - 1) * 20;
    const rankedResults = (data.results || []).map((item, idx) => ({
      ...item,
      rank: startIndex + idx + 1
    }));
    res.json({
      configured: isTmdbConfigured(),
      ...data,
      results: rankedResults
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top rated charts', message: err.message });
  }
};

export const getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getDetails('movie', id);
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie details', message: err.message });
  }
};

export const getTvDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getDetails('tv', id);
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch TV details', message: err.message });
  }
};

export const getPersonDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getPersonDetails(id);
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch person details', message: err.message });
  }
};

export const searchCatalogue = async (req, res) => {
  try {
    const { q = '', page = 1 } = req.query;
    if (!q.trim()) {
      return res.json({ results: [], total_results: 0 });
    }
    const data = await searchMulti(q.trim(), Number(page));
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
};

export const discoverCatalogue = async (req, res) => {
  try {
    const { mediaType = 'movie', ...filters } = req.query;
    const data = await getDiscover(mediaType, filters);
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Discovery failed', message: err.message });
  }
};

export const getGenreList = async (req, res) => {
  try {
    const { mediaType = 'movie' } = req.query;
    const data = await getGenres(mediaType);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get genres', message: err.message });
  }
};

export const getStreamingProviders = async (req, res) => {
  try {
    const region = (req.query.region || 'IN').toUpperCase();
    const providers = getProvidersForRegion(region);
    res.json({
      region,
      providers
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get providers', message: err.message });
  }
};

export const getStreamingTitles = async (req, res) => {
  try {
    const { region = 'IN', providerId, page = 1 } = req.query;
    const data = await getStreamingTitlesByProvider(region, providerId, Number(page));
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch streaming titles', message: err.message });
  }
};

export const getTitleTrailer = async (req, res) => {
  try {
    const { mediaType = 'movie', id } = req.params;
    const data = await getTrailer(mediaType, id);
    res.json({
      configured: isTmdbConfigured(),
      ...data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trailer', message: err.message });
  }
};

export const getPopularInterests = async (req, res) => {
  res.json({
    interests: CURATED_POPULAR_INTERESTS
  });
};
