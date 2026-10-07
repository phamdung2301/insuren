package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.response.report.MonthlyPremiumReportDto;
import com.dungphd.insurance.dto.response.report.PolicyStatusCountReportDto;
import com.dungphd.insurance.dto.response.report.PolicyStatusPremiumReportDto;
import com.dungphd.insurance.exception.GlobalExceptionHandler;
import com.dungphd.insurance.model.PolicyStatus;
import com.dungphd.insurance.service.PolicyService;
import com.dungphd.insurance.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReportService reportService;

    @Mock
    private PolicyService policyService;

    @InjectMocks
    private ReportController reportController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reportController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /reports/policy-count-by-status - Should return count by status")
    void testGetPolicyCountByStatus() throws Exception {
        PolicyStatusCountReportDto report = PolicyStatusCountReportDto.builder()
                .status(PolicyStatus.ACTIVE)
                .count(100)
                .build();

        when(reportService.getPolicyCountByStatus()).thenReturn(List.of(report));

        mockMvc.perform(get("/reports/policy-count-by-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.data[0].count").value(100));
    }

    @Test
    @DisplayName("GET /reports/total-premium-by-status - Should return premium by status")
    void testGetTotalPremiumByStatus() throws Exception {
        PolicyStatusPremiumReportDto report = PolicyStatusPremiumReportDto.builder()
                .status(PolicyStatus.ACTIVE)
                .totalPremium(250000.0)
                .count(50)
                .build();

        when(reportService.getTotalPremiumByStatus()).thenReturn(List.of(report));

        mockMvc.perform(get("/reports/total-premium-by-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].totalPremium").value(250000.0));
    }

    @Test
    @DisplayName("GET /reports/premium-by-effective-month - Should return premium by effective month")
    void testGetTotalPremiumByEffectiveMonth() throws Exception {
        MonthlyPremiumReportDto report = MonthlyPremiumReportDto.builder()
                .year(2026)
                .month(1)
                .totalPremium(50000.0)
                .count(10)
                .build();

        when(reportService.getTotalPremiumByEffectiveMonth()).thenReturn(List.of(report));

        mockMvc.perform(get("/reports/premium-by-effective-month"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].month").value(1))
                .andExpect(jsonPath("$.data[0].totalPremium").value(50000.0));
    }
}
