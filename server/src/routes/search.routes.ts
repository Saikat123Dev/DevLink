import express from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const searchController = new SearchController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Universal search
router.get('/', searchController.search.bind(searchController));

// Get search suggestions
router.get('/suggestions', searchController.getSuggestions.bind(searchController));

// Get search filters
router.get('/filters', searchController.getFilters.bind(searchController));

// Save search query for analytics
router.post('/queries', searchController.saveSearchQuery.bind(searchController));

export default router;
