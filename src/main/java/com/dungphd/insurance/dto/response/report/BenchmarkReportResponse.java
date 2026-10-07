package com.dungphd.insurance.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BenchmarkReportResponse {

    private long totalDocsInCollection;

    private Instant benchmarkTimestamp;

    private List<QueryMetric> queryMetrics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QueryMetric {
        private String queryName;
        private String queryDescription;
        private String winningPlanStage;
        private long totalDocsExamined;
        private long totalKeysExamined;
        private long nReturned;
        private long executionTimeMillis;
        private String indexName;
    }
}
