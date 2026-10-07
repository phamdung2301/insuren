package com.dungphd.insurance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyVersionResponse {
    private String id;
    private String policyNumber;
    private Integer version;
    private Double totalPremium;
    private String status;
    private PolicyResponse policySnapshot;
    private String createdBy;
    private Instant createdAt;
}
