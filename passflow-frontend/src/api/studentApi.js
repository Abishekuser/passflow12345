import { request } from './apiClient';

/**
 * Student Endpoints
 * 1. POST /student/outpasses
 * 2. GET /student/outpasses
 */

export const studentApi = {
  /**
   * Submit an outpass application
   * @param {Object} data { date: "YYYY-MM-DD", destination: string, departure_time: "HH:MM", expected_return_time: "HH:MM" }
   */
  createOutpass: async (data) => {
    return request('/student/outpasses', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Retrieve all outpasses of the current logged-in student
   */
  getMyOutpasses: async () => {
    return request('/student/outpasses', {
      method: 'GET',
    });
  },
};
