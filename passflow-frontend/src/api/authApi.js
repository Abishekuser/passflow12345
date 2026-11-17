import { request } from './apiClient';

/**
 * Authentication Endpoints
 * 1. POST /auth/signup
 * 2. POST /auth/login
 */

export const authApi = {
  /**
   * Register a new student
   * @param {FormData} formData (contains username, password, name, roll_number, department, year, room_number, parent_name, parent_phone, parent_email, parent_language, photo)
   */
  signup: async (formData) => {
    return request('/auth/signup', {
      method: 'POST',
      body: formData,
      skipAuth: true,
    });
  },

  /**
   * Login user (Student, Warden, or Security)
   * @param {Object} credentials { username, password }
   */
  login: async ({ username, password }) => {
    return request('/auth/login', {
      method: 'POST',
      body: { username, password },
      skipAuth: true,
    });
  },
};
