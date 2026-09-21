import { request } from './apiClient';

/**
 * Warden Endpoints
 * 1. GET /warden/students
 * 2. GET /warden/pending?year=2
 * 3. POST /warden/approve/{outpass_id}
 * 4. POST /warden/approve-selected
 * 5. POST /warden/reject/{outpass_id}
 */

export const wardenApi = {
  /**
   * Get hostel student status list (IN, OUT, LATE, RETURNED)
   */
  getStudents: async () => {
    return request('/warden/students', {
      method: 'GET',
    });
  },

  /**
   * Get all pending outpass requests across the hostel
   */
  getPendingOutpasses: async (year = 'ALL') => {
    const query = year !== 'ALL' ? `?year=${encodeURIComponent(year)}` : '';
    return request(`/warden/pending${query}`, {
      method: 'GET',
    });
  },

  approveOutpass: async (outpassId) => {
    return request(`/warden/approve/${outpassId}`, {
      method: 'POST',
    });
  },

  approveSelected: async (outpassIds) => {
    return request('/warden/approve-selected', {
      method: 'POST',
      body: outpassIds,
    });
  },

  rejectOutpass: async (outpassId) => {
    return request(`/warden/reject/${outpassId}`, {
      method: 'POST',
    });
  },
};
