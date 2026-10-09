import axiosClient from './axiosClient';

export const claimApi = {
  // Tạo yêu cầu bồi thường mới
  createClaim: (data) => axiosClient.post('/claims', data),

  // Danh sách yêu cầu (lọc theo trạng thái / số HĐ / tìm kiếm)
  listClaims: (params) => axiosClient.get('/claims', { params }),

  // Chi tiết một yêu cầu
  getClaim: (claimNumber) => axiosClient.get(`/claims/${claimNumber}`),

  // Chuyển trạng thái (duyệt / từ chối / chi trả / hủy...)
  transitionStatus: (claimNumber, data) => axiosClient.patch(`/claims/${claimNumber}/status`, data),

  // Thêm chứng từ (metadata)
  addDocument: (claimNumber, fileName, fileUrl) =>
    axiosClient.post(`/claims/${claimNumber}/documents`, null, { params: { fileName, fileUrl } }),
};

export const claimStatusLabels = {
  SUBMITTED: 'Đã gửi',
  UNDER_REVIEW: 'Đang thẩm định',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PAID: 'Đã chi trả',
  CANCELLED: 'Đã hủy',
};

export default claimApi;
