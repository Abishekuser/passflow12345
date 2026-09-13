import { request } from './apiClient';

/**
 * Warden Endpoints
 * 1. GET /warden/students
 * 2. GET /warden/pending
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
  getPendingOutpasses: async () => {
    return request('/warden/pending', {
      method: 'GET',
    });
  },
};
