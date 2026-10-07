import axiosClient from './axiosClient';

export const reportApi = {
  getPolicyCountByStatus: () => axiosClient.get('/reports/policy-count-by-status'),
  getTotalPremiumByStatus: () => axiosClient.get('/reports/total-premium-by-status'),
  getTopFivePoliciesByPremium: () => axiosClient.get('/reports/top-premium-policies'),
  getTotalPremiumByEffectiveMonth: () => axiosClient.get('/reports/premium-by-effective-month'),

  // Benchmark APIs
  generate50k: () => axiosClient.post('/benchmark/generate-50k'),
  runBenchmark: () => axiosClient.get('/benchmark/run'),
};

export default reportApi;
