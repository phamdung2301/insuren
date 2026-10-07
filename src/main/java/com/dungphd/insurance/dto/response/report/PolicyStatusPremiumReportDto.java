package com.dungphd.insurance.dto.response.report;

import com.dungphd.insurance.model.PolicyStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyStatusPremiumReportDto {
    private PolicyStatus status;
    private double totalPremium;
    private long count;
}
