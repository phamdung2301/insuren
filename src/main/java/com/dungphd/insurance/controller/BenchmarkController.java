package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.response.ApiResponse;
import com.dungphd.insurance.dto.response.report.BenchmarkReportResponse;
import com.dungphd.insurance.service.BenchmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/benchmark")
@RequiredArgsConstructor
public class BenchmarkController {

    private final BenchmarkService benchmarkService;

    @PostMapping("/generate-50k")
    public ResponseEntity<ApiResponse<Long>> generate50kPolicies() {
        long totalGenerated = benchmarkService.generate50kPolicies();
        return ResponseEntity.ok(ApiResponse.success(totalGenerated, "Successfully generated 50,000 synthetic policies in MongoDB"));
    }

    @GetMapping("/run")
    public ResponseEntity<ApiResponse<BenchmarkReportResponse>> runPerformanceBenchmark() {
        BenchmarkReportResponse report = benchmarkService.runPerformanceBenchmark();
        return ResponseEntity.ok(ApiResponse.success(report, "Performance benchmark completed successfully"));
    }
}
