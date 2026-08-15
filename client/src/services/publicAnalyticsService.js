import api from '../lib/axios';

/**
 * Public Analytics API Service
 * Interacts with unauthenticated public endpoints for dashboard analytics.
 */
export const publicAnalyticsService = {
  /**
   * Get high-level summary stats (KPIs, total accomplishments, completion rate)
   * @param {Object} params - { reportingYear, regionId }
   */
  getSummary: async (params = {}) => {
    const response = await api.get('/public/analytics/summary', { params });
    return response.data;
  },

  /**
   * Get regional accomplishments breakdown and rankings
   * @param {Object} params - { reportingYear, categoryId }
   */
  getRegions: async (params = {}) => {
    const response = await api.get('/public/analytics/regions', { params });
    return response.data;
  },

  /**
   * Get accomplishments breakdown across 7 official IAS categories
   * @param {Object} params - { reportingYear, regionId }
   */
  getCategories: async (params = {}) => {
    const response = await api.get('/public/analytics/categories', { params });
    return response.data;
  },

  /**
   * Get time-series trends (monthly and quarterly)
   * @param {Object} params - { reportingYear, regionId, categoryId }
   */
  getTrends: async (params = {}) => {
    const response = await api.get('/public/analytics/trends', { params });
    return response.data;
  },

  /**
   * Get accomplishment metrics by indicator
   * @param {Object} params - { reportingYear, regionId, categoryId }
   */
  getIndicators: async (params = {}) => {
    const response = await api.get('/public/analytics/indicators', { params });
    return response.data;
  },

  /**
   * Get 17-Region x 7-Category matrix dataset
   * @param {Object} params - { reportingYear }
   */
  getMatrix: async (params = {}) => {
    const response = await api.get('/public/analytics/matrix', { params });
    return response.data;
  },

  /**
   * Get paginated public activity accomplishments
   * @param {Object} params - { reportingYear, regionId, categoryId, page, limit, search }
   */
  getActivities: async (params = {}) => {
    const response = await api.get('/public/analytics/activities', { params });
    return response.data;
  },

  /**
   * Export full analytics snapshot JSON payload
   * @param {Object} params - { reportingYear }
   */
  exportSnapshot: async (params = {}) => {
    const response = await api.get('/public/analytics/export', { params });
    return response.data;
  }
};

export default publicAnalyticsService;
