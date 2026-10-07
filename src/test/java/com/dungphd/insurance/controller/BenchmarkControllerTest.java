package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.response.report.BenchmarkReportResponse;
import com.dungphd.insurance.exception.GlobalExceptionHandler;
import com.dungphd.insurance.service.BenchmarkService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BenchmarkControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BenchmarkService benchmarkService;

    @InjectMocks
    private BenchmarkController benchmarkController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(benchmarkController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /benchmark/generate-50k - Should generate 50,000 policies")
    void testGenerate50kPolicies() throws Exception {
        when(benchmarkService.generate50kPolicies()).thenReturn(50000L);

        mockMvc.perform(post("/benchmark/generate-50k"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(50000));
    }

    @Test
    @DisplayName("GET /benchmark/run - Should execute performance benchmark")
    void testRunPerformanceBenchmark() throws Exception {
        BenchmarkReportResponse.QueryMetric metric = BenchmarkReportResponse.QueryMetric.builder()
                .queryName("Query 1")
                .queryDescription("Find policy by policyNumber")
                .winningPlanStage("IXSCAN")
                .totalDocsExamined(1)
                .totalKeysExamined(1)
                .nReturned(1)
                .executionTimeMillis(2)
                .indexName("policyNumber_unique_idx")
                .build();

        BenchmarkReportResponse report = BenchmarkReportResponse.builder()
                .totalDocsInCollection(50000)
                .benchmarkTimestamp(Instant.now())
                .queryMetrics(List.of(metric))
                .build();

        when(benchmarkService.runPerformanceBenchmark()).thenReturn(report);

        mockMvc.perform(get("/benchmark/run"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalDocsInCollection").value(50000))
                .andExpect(jsonPath("$.data.queryMetrics[0].queryName").value("Query 1"));
    }
}
