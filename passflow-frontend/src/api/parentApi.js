import { request } from './apiClient';

/**
 * Parent Endpoints
 * 1. POST /parent/approve/{token}
 * 2. POST /parent/reject/{token}
 */

export const parentApi = {
  /**
   * Approve an outpass request via parent token
   * @param {string} token
   */
  approveOutpass: async (token) => {
    return request(`/parent/approve/${encodeURIComponent(token)}`, {
      method: 'POST',
      skipAuth: true,
    });
  },

  /**
   * Reject an outpass request via parent token
   * @param {string} token
   */
  rejectOutpass: async (token) => {
    return request(`/parent/reject/${encodeURIComponent(token)}`, {
      method: 'POST',
      skipAuth: true,
    });
  },
};
