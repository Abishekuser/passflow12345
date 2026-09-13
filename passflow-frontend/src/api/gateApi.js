import { request } from './apiClient';

/**
 * Gate / Security Endpoints
 * 1. POST /gate/scan (Query param: token)
 */

export const gateApi = {
  /**
   * Scan student QR token at gate (Marks OUT on 1st scan, IN on 2nd scan)
   * @param {string} qrToken
   */
  scanQr: async (qrToken) => {
    const trimmed = (qrToken || '').trim();
    return request(`/gate/scan?token=${encodeURIComponent(trimmed)}`, {
      method: 'POST',
    });
  },
};
