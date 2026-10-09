package com.dungphd.insurance.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * ClaimDocument - Metadata chứng từ đính kèm yêu cầu bồi thường (embedded trong Claim).
 * Chỉ lưu metadata (tên file, URL); file thật do client upload lên dịch vụ lưu trữ ngoài.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimDocument {
    private String fileName;
    private String fileUrl;
    private Instant uploadedAt;
}
