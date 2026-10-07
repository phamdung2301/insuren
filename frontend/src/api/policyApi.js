import axiosClient from './axiosClient';

export const policyApi = {
  // Core CRUD
  getPolicies: (params) => axiosClient.get('/policies', { params }),
  getPolicyByNumber: (policyNumber) => axiosClient.get(`/policies/${policyNumber}`),
  createPolicy: (data) => axiosClient.post('/policies', data),
  updatePolicy: (policyNumber, data) => axiosClient.put(`/policies/${policyNumber}`, data),
  deletePolicy: (policyNumber) => axiosClient.delete(`/policies/${policyNumber}`),

  // Location Management
  addLocation: (policyNumber, data) => axiosClient.post(`/policies/${policyNumber}/locations`, data),
  updateLocation: (policyNumber, locationId, data) => axiosClient.put(`/policies/${policyNumber}/locations/${locationId}`, data),
  removeLocation: (policyNumber, locationId) => axiosClient.delete(`/policies/${policyNumber}/locations/${locationId}`),

  // Coverage Management
  addCoverage: (policyNumber, locationId, data) => axiosClient.post(`/policies/${policyNumber}/locations/${locationId}/coverages`, data),
  updateCoverage: (policyNumber, locationId, coverageCode, data) => axiosClient.put(`/policies/${policyNumber}/locations/${locationId}/coverages/${coverageCode}`, data),
  removeCoverage: (policyNumber, locationId, coverageCode) => axiosClient.delete(`/policies/${policyNumber}/locations/${locationId}/coverages/${coverageCode}`),

  // Lifecycle & Endorsement
  transitionStatus: (policyNumber, data) => axiosClient.post(`/policies/${policyNumber}/status-transitions`, data),
  endorsePolicy: (policyNumber, data) => axiosClient.post(`/policies/${policyNumber}/endorsements`, data),

  // History & Versioning
  getPolicyHistory: (policyNumber) => axiosClient.get(`/policies/${policyNumber}/history`),
  getPolicyVersions: (policyNumber) => axiosClient.get(`/policies/${policyNumber}/versions`),
  getPolicyVersion: (policyNumber, version) => axiosClient.get(`/policies/${policyNumber}/versions/${version}`),
};

export const excelApi = {
  // Calculate premiums without creating a policy (public)
  calculatePremiums: (coverages) => axiosClient.post('/excel/calculate', coverages),

  // Get current base rate table
  getCurrentRates: () => axiosClient.get('/excel/current-rates'),

  // Download Excel template (admin)
  downloadTemplate: () => axiosClient.get('/excel/template', { responseType: 'arraybuffer' }),

  // Upload Excel to update rates (admin)
  importRates: (formData) => axiosClient.post('/excel/import-rates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Download Excel for specific policy
  downloadPolicyExcel: (policyNumber) =>
    axiosClient.get(`/excel/policy/${policyNumber}/download`, { responseType: 'arraybuffer' }),
};

export default policyApi;
