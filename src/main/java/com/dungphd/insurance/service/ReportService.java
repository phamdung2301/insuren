package com.dungphd.insurance.service;

import com.dungphd.insurance.dto.response.PolicyResponse;
import com.dungphd.insurance.dto.response.report.MonthlyPremiumReportDto;
import com.dungphd.insurance.dto.response.report.PolicyStatusCountReportDto;
import com.dungphd.insurance.dto.response.report.PolicyStatusPremiumReportDto;

import java.util.List;

public interface ReportService {

    // 1. Policy count grouped by status (P10 Report 1)
    List<PolicyStatusCountReportDto> getPolicyCountByStatus();

    // 2. Total premium grouped by status (P10 Report 2)
    List<PolicyStatusPremiumReportDto> getTotalPremiumByStatus();

    // 3. Top five Policies with highest total premium (P10 Report 3)
    List<PolicyResponse> getTopFivePoliciesByPremium();

    // 4. Total premium grouped by effective month (P10 Report 4)
    List<MonthlyPremiumReportDto> getTotalPremiumByEffectiveMonth();
}
