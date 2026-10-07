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
public class PolicyStatusCountReportDto {
    private PolicyStatus status;
    private long count;
}
