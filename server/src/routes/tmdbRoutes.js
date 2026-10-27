import express from 'express';
import {
  getTrendingMedia,
  getTop10ThisWeek,
  getPopularInRegion,
  getRegionalDiscovery,
  getTopRatedChart,
  getMovieDetails,
  getTvDetails,
  getPersonDetail,
  searchCatalogue,
  discoverCatalogue,
  getGenreList,
  getStreamingProviders,
  getStreamingTitles,
  getTitleTrailer,
  getPopularInterests
} from '../controllers/tmdbController.js';

const router = express.Router();

// Movies & TV catalogue
router.get('/trending', getTrendingMedia);
router.get('/top-10', getTop10ThisWeek);
router.get('/popular', getPopularInRegion);
router.get('/regional-discovery', getRegionalDiscovery);
router.get('/top-rated', getTopRatedChart);
router.get('/movie/:id', getMovieDetails);
router.get('/tv/:id', getTvDetails);
router.get('/person/:id', getPersonDetail);
router.get('/search', searchCatalogue);
router.get('/discover', discoverCatalogue);
router.get('/genres', getGenreList);
router.get('/providers', getStreamingProviders);
router.get('/streaming-titles', getStreamingTitles);
router.get('/:mediaType/:id/trailer', getTitleTrailer);
router.get('/interests', getPopularInterests);

export default router;
