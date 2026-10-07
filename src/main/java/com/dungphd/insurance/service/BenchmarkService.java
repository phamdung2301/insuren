package com.dungphd.insurance.service;

import com.dungphd.insurance.dto.response.report.BenchmarkReportResponse;

public interface BenchmarkService {

    long generate50kPolicies();

    BenchmarkReportResponse runPerformanceBenchmark();
}
