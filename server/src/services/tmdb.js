import {
  CURATED_TRENDING_MOVIES,
  CURATED_TRENDING_PEOPLE,
  CURATED_STREAMING_PROVIDERS,
  GENRE_MAP
} from './tmdbCuratedFallback.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const memoryCache = new Map();

export const isTmdbConfigured = () => {
  const key = process.env.TMDB_API_KEY?.trim();
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  const hasKey = key && key !== 'your_tmdb_v3_api_key_here';
  const hasToken = token && token !== 'your_tmdb_v4_read_access_token_here';
  return Boolean(hasKey || hasToken);
};

export const fetchTmdb = async (endpoint, queryParams = {}) => {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  const bearerToken = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  const configured = isTmdbConfigured();

  if (!configured) {
    return {
      configured: false,
      error: 'TMDB credentials are not configured in server/.env',
      data: null
    };
  }

  // Build URL and cache key
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.append(k, String(v));
    }
  });

  if (apiKey && apiKey !== 'your_tmdb_v3_api_key_here') {
    url.searchParams.append('api_key', apiKey);
  }

  const cacheKey = url.toString();
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { configured: true, cached: true, data: cached.data };
  }

  const headers = {
    'Accept': 'application/json',
  };

  if (bearerToken && bearerToken !== 'your_tmdb_v4_read_access_token_here') {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url.toString(), {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return {
        configured: true,
        error: `TMDB responded with HTTP ${res.status}: ${errText}`,
        status: res.status,
        data: null
      };
    }

    const data = await res.json();
    memoryCache.set(cacheKey, { timestamp: Date.now(), data });
    return { configured: true, cached: false, data };
  } catch (err) {
    return {
      configured: true,
      error: err.name === 'AbortError' ? 'TMDB request timed out' : err.message,
      data: null
    };
  }
};

// High-level service methods with fallback
export const getTrending = async (mediaType = 'movie', timeWindow = 'week') => {
  const result = await fetchTmdb(`/trending/${mediaType}/${timeWindow}`);
  if (result.data?.results) {
    return { isLive: true, results: result.data.results };
  }
  // Curated fallback
  if (mediaType === 'person') {
    return { isLive: false, results: CURATED_TRENDING_PEOPLE };
  }
  return { isLive: false, results: CURATED_TRENDING_MOVIES };
};

export const getTopRated = async (mediaType = 'movie', page = 1) => {
  const result = await fetchTmdb(`/${mediaType}/top_rated`, { page });
  if (result.data?.results) {
    return {
      isLive: true,
      page: result.data.page,
      total_pages: result.data.total_pages,
      total_results: result.data.total_results,
      results: result.data.results
    };
  }
  return {
    isLive: false,
    page: 1,
    total_pages: 1,
    total_results: CURATED_TRENDING_MOVIES.length,
    results: CURATED_TRENDING_MOVIES
  };
};

export const REGIONAL_LABELS = {
  IN: 'Popular from India',
  US: 'Popular from the US',
  GB: 'Popular from the UK'
};

export const getPopular = async (mediaType = 'movie', page = 1, region = 'IN') => {
  const result = await fetchTmdb(`/${mediaType}/popular`, { page, region });
  if (result.data?.results) {
    return { isLive: true, results: result.data.results };
  }
  return { isLive: false, results: CURATED_TRENDING_MOVIES };
};

export const getRegionalOriginTitles = async (mediaType = 'movie', region = 'IN', page = 1) => {
  const normRegion = (region || 'IN').toUpperCase();
  const label = REGIONAL_LABELS[normRegion] || `Popular from ${normRegion}`;

  // Query TMDB discover using country-of-origin filter
  const result = await fetchTmdb(`/discover/${mediaType}`, {
    with_origin_country: normRegion,
    sort_by: 'popularity.desc',
    page
  });

  if (result.data?.results?.length > 0) {
    return {
      isLive: true,
      region: normRegion,
      label,
      results: result.data.results
    };
  }

  // Fallback to TMDB popular with region parameter
  const popResult = await getPopular(mediaType, page, normRegion);
  return {
    isLive: popResult.isLive,
    region: normRegion,
    label,
    results: popResult.results
  };
};

export const getDiscover = async (mediaType = 'movie', params = {}) => {
  const result = await fetchTmdb(`/discover/${mediaType}`, params);
  if (result.data?.results) {
    return {
      isLive: true,
      page: result.data.page,
      total_pages: result.data.total_pages,
      total_results: result.data.total_results,
      results: result.data.results
    };
  }
  // Filter curated
  let list = [...CURATED_TRENDING_MOVIES];
  if (params.with_genres) {
    const targetGenre = Number(params.with_genres);
    list = list.filter(m => m.genre_ids?.includes(targetGenre));
  }
  return {
    isLive: false,
    page: 1,
    total_pages: 1,
    total_results: list.length,
    results: list.length ? list : CURATED_TRENDING_MOVIES
  };
};

export const getGenres = async (mediaType = 'movie') => {
  const result = await fetchTmdb(`/genre/${mediaType}/list`);
  if (result.data?.genres) {
    return {
      isLive: true,
      genres: result.data.genres
    };
  }
  const genres = Object.entries(GENRE_MAP).map(([id, name]) => ({
    id: Number(id),
    name
  }));
  return {
    isLive: false,
    genres
  };
};

export const getDetails = async (mediaType = 'movie', id) => {
  const append = mediaType === 'movie'
    ? 'credits,videos,watch/providers,reviews,recommendations,similar,release_dates'
    : 'credits,videos,watch/providers,reviews,recommendations,similar,content_ratings';

  const result = await fetchTmdb(`/${mediaType}/${id}`, { append_to_response: append });
  if (result.data) {
    return { isLive: true, data: result.data };
  }

  // Find in curated
  const fallback = CURATED_TRENDING_MOVIES.find(m => String(m.id) === String(id)) || CURATED_TRENDING_MOVIES[0];
  return {
    isLive: false,
    data: {
      ...fallback,
      genres: fallback.genre_ids?.map(gid => ({ id: gid, name: GENRE_MAP[gid] || 'Film' })) || [{ id: 18, name: 'Drama' }],
      credits: {
        cast: [
          { id: 101, name: 'Lead Performer', character: 'Main Protagonist', profile_path: null },
          { id: 102, name: 'Supporting Actor', character: 'Key Figure', profile_path: null },
        ],
        crew: [
          { id: 201, name: 'Visionary Director', job: 'Director', department: 'Directing' }
        ]
      },
      videos: {
        results: [
          { id: 'sample', key: 'dQw4w9WgXcQ', site: 'YouTube', type: 'Trailer', name: 'Official Trailer' }
        ]
      },
      'watch/providers': {
        results: {
          IN: {
            link: 'https://www.justwatch.com',
            flatrate: [{ provider_id: 119, provider_name: 'Amazon Prime Video', logo_path: '/emthp39XA2GUNqUwGpGh8PP909b.jpg' }],
            rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/q6tl6Ib6X5FT80TSuEjR1qWDueb.jpg' }]
          },
          US: {
            link: 'https://www.justwatch.com',
            flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/T2Jw592R9MV6MAe9UUhleA8W59b.jpg' }]
          }
        }
      },
      reviews: {
        results: [
          {
            id: 'rev1',
            author: 'CinematicJournalist',
            content: 'A thrilling, dense experience with remarkable sound design and razor-sharp cinematography.',
            created_at: '2026-10-18T12:00:00Z',
            author_details: { rating: 8 }
          }
        ]
      },
      recommendations: {
        results: CURATED_TRENDING_MOVIES.filter(m => String(m.id) !== String(id))
      }
    }
  };
};

export const getPersonDetails = async (id) => {
  const result = await fetchTmdb(`/person/${id}`, { append_to_response: 'combined_credits,external_ids' });
  if (result.data) {
    return { isLive: true, data: result.data };
  }

  const fallback = CURATED_TRENDING_PEOPLE.find(p => String(p.id) === String(id)) || CURATED_TRENDING_PEOPLE[0];
  return {
    isLive: false,
    data: {
      ...fallback,
      biography: `${fallback.name} is an accomplished artist recognized for memorable performances across film and television.`,
      place_of_birth: 'Los Angeles, California, USA',
      birthday: '1975-04-12',
      combined_credits: {
        cast: CURATED_TRENDING_MOVIES.slice(0, 5).map(m => ({
          id: m.id,
          title: m.title,
          character: 'Key Role',
          poster_path: m.poster_path,
          vote_average: m.vote_average,
          release_date: m.release_date || m.first_air_date,
          media_type: m.media_type
        }))
      }
    }
  };
};

export const searchMulti = async (query, page = 1) => {
  const result = await fetchTmdb('/search/multi', { query, page, include_adult: false });
  if (result.data?.results) {
    return {
      isLive: true,
      page: result.data.page,
      total_pages: result.data.total_pages,
      total_results: result.data.total_results,
      results: result.data.results
    };
  }

  // Fallback search filter
  const qLower = query.toLowerCase();
  const movieMatches = CURATED_TRENDING_MOVIES.filter(m => (m.title || m.name).toLowerCase().includes(qLower));
  const personMatches = CURATED_TRENDING_PEOPLE.filter(p => p.name.toLowerCase().includes(qLower)).map(p => ({
    ...p,
    media_type: 'person'
  }));

  const combined = [...movieMatches, ...personMatches];
  return {
    isLive: false,
    page: 1,
    total_pages: 1,
    total_results: combined.length,
    results: combined
  };
};

export const getTrailer = async (mediaType = 'movie', id) => {
  const result = await fetchTmdb(`/${mediaType}/${id}/videos`);
  if (result.data?.results?.length > 0) {
    const videos = result.data.results;
    // Prefer official YouTube Trailer
    const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || videos.find(v => v.site === 'YouTube' && v.type === 'Teaser')
      || videos.find(v => v.site === 'YouTube');

    if (trailer) {
      return {
        videoKey: trailer.key,
        name: trailer.name,
        site: trailer.site,
        type: trailer.type
      };
    }
  }
  return { videoKey: null, name: null, site: null };
};

// Regional streaming providers mapping
export const REGIONAL_PROVIDERS = {
  IN: [
    { id: 119, name: 'Prime Video', subtext: 'included with Prime', filter: '119' },
    { id: 122, name: 'JioHotstar', subtext: 'Stream on Hotstar', filter: '122' },
    { id: 8, name: 'Netflix', subtext: 'Watch on Netflix', filter: '8' },
    { id: 237, name: 'SonyLIV', subtext: 'Stream on SonyLIV', filter: '237' },
    { id: 350, name: 'Apple TV+', subtext: 'Watch on Apple TV+', filter: '350' },
    { id: 232, name: 'Zee5', subtext: 'Watch on Zee5', filter: '232' },
    { id: 309, name: 'SunNXT', subtext: 'Stream on SunNXT', filter: '309' }
  ],
  US: [
    { id: 8, name: 'Netflix', subtext: 'Watch on Netflix', filter: '8' },
    { id: 9, name: 'Prime Video', subtext: 'included with Prime', filter: '9' },
    { id: 337, name: 'Disney+', subtext: 'Stream on Disney+', filter: '337' },
    { id: 1899, name: 'Max', subtext: 'Stream on Max', filter: '1899' },
    { id: 350, name: 'Apple TV+', subtext: 'Watch on Apple TV+', filter: '350' },
    { id: 15, name: 'Hulu', subtext: 'Stream on Hulu', filter: '15' },
    { id: 531, name: 'Paramount+', subtext: 'Watch on Paramount+', filter: '531' },
    { id: 386, name: 'Peacock', subtext: 'Stream on Peacock', filter: '386' }
  ],
  GB: [
    { id: 8, name: 'Netflix', subtext: 'Watch on Netflix', filter: '8' },
    { id: 9, name: 'Prime Video', subtext: 'included with Prime', filter: '9' },
    { id: 337, name: 'Disney+', subtext: 'Stream on Disney+', filter: '337' },
    { id: 38, name: 'BBC iPlayer', subtext: 'Watch on BBC iPlayer', filter: '38' },
    { id: 350, name: 'Apple TV+', subtext: 'Watch on Apple TV+', filter: '350' },
    { id: 39, name: 'NOW', subtext: 'Stream on NOW', filter: '39' },
    { id: 103, name: 'Channel 4', subtext: 'Stream on Channel 4', filter: '103' },
    { id: 29, name: 'Sky Go', subtext: 'Watch on Sky Go', filter: '29' }
  ]
};

export const getProvidersForRegion = (region = 'IN') => {
  const norm = (region || 'IN').toUpperCase();
  return REGIONAL_PROVIDERS[norm] || REGIONAL_PROVIDERS['IN'];
};

export const getStreamingTitlesByProvider = async (region = 'IN', providerId, page = 1) => {
  const normRegion = (region || 'IN').toUpperCase();
  const providers = getProvidersForRegion(normRegion);
  const targetProviderId = providerId || providers[0].id;

  const result = await fetchTmdb('/discover/movie', {
    watch_region: normRegion,
    with_watch_providers: targetProviderId,
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
    page
  });

  if (result.data?.results?.length > 0) {
    return {
      isLive: true,
      region: normRegion,
      providerId: Number(targetProviderId),
      results: result.data.results
    };
  }

  // Fallback to regional popular if discover yields empty
  const popResult = await getPopular('movie', 1, normRegion);
  return {
    isLive: popResult.isLive,
    region: normRegion,
    providerId: Number(targetProviderId),
    results: popResult.results
  };
};

