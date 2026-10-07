package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.response.ApiResponse;
import com.dungphd.insurance.dto.response.PolicyResponse;
import com.dungphd.insurance.dto.response.report.MonthlyPremiumReportDto;
import com.dungphd.insurance.dto.response.report.PolicyStatusCountReportDto;
import com.dungphd.insurance.dto.response.report.PolicyStatusPremiumReportDto;
import com.dungphd.insurance.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/policy-count-by-status")
    public ResponseEntity<ApiResponse<List<PolicyStatusCountReportDto>>> getPolicyCountByStatus() {
        List<PolicyStatusCountReportDto> result = reportService.getPolicyCountByStatus();
        return ResponseEntity.ok(ApiResponse.success(result, "Policy count by status retrieved successfully"));
    }

    @GetMapping("/total-premium-by-status")
    public ResponseEntity<ApiResponse<List<PolicyStatusPremiumReportDto>>> getTotalPremiumByStatus() {
        List<PolicyStatusPremiumReportDto> result = reportService.getTotalPremiumByStatus();
        return ResponseEntity.ok(ApiResponse.success(result, "Total premium by status retrieved successfully"));
    }

    @GetMapping("/top-premium-policies")
    public ResponseEntity<ApiResponse<List<PolicyResponse>>> getTopFivePoliciesByPremium() {
        List<PolicyResponse> result = reportService.getTopFivePoliciesByPremium();
        return ResponseEntity.ok(ApiResponse.success(result, "Top 5 policies with highest premium retrieved successfully"));
    }

    @GetMapping("/premium-by-effective-month")
    public ResponseEntity<ApiResponse<List<MonthlyPremiumReportDto>>> getTotalPremiumByEffectiveMonth() {
        List<MonthlyPremiumReportDto> result = reportService.getTotalPremiumByEffectiveMonth();
        return ResponseEntity.ok(ApiResponse.success(result, "Total premium by effective month retrieved successfully"));
    }
}
