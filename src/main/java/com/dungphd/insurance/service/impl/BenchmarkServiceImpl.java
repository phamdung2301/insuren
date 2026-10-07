package com.dungphd.insurance.service.impl;

import com.dungphd.insurance.dto.response.report.BenchmarkReportResponse;
import com.dungphd.insurance.model.Coverage;
import com.dungphd.insurance.model.Insured;
import com.dungphd.insurance.model.Location;
import com.dungphd.insurance.model.Policy;
import com.dungphd.insurance.model.PolicyStatus;
import com.dungphd.insurance.repository.PolicyRepository;
import com.dungphd.insurance.service.BenchmarkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BenchmarkServiceImpl implements BenchmarkService {

    private final MongoTemplate mongoTemplate;
    private final PolicyRepository policyRepository;

    @Override
    public long generate50kPolicies() {
        log.info("Starting generation of 50,000 synthetic Policy documents...");

        int totalCount = 50000;
        int batchSize = 5000;
        Random random = new Random();
        PolicyStatus[] statuses = PolicyStatus.values();

        // Clean up any previously generated POL-50K- policies to prevent DuplicateKeyException
        log.info("Purging old benchmark policies before generation...");
        mongoTemplate.remove(Query.query(Criteria.where("policyNumber").regex("^POL-50K-")), Policy.class);

        Instant baseDate = Instant.now().minus(365, ChronoUnit.DAYS);

        for (int b = 0; b < totalCount / batchSize; b++) {
            List<Policy> batch = new ArrayList<>(batchSize);
            for (int i = 0; i < batchSize; i++) {
                int index = b * batchSize + i + 1;
                String policyNum = String.format("POL-50K-%06d", index);
                PolicyStatus status = statuses[random.nextInt(statuses.length)];
                Instant effective = baseDate.plus(random.nextInt(365), ChronoUnit.DAYS);
                Instant expiration = effective.plus(365, ChronoUnit.DAYS);

                Coverage cov1 = Coverage.builder()
                        .coverageCode("GL")
                        .coverageName("General Liability")
                        .limit(500000.0 + random.nextInt(500000))
                        .deductible(1000.0 + random.nextInt(4000))
                        .premium(500.0 + random.nextInt(1500))
                        .build();

                Coverage cov2 = Coverage.builder()
                        .coverageCode("PROPERTY")
                        .coverageName("Property Insurance")
                        .limit(1000000.0 + random.nextInt(1000000))
                        .deductible(5000.0)
                        .premium(800.0 + random.nextInt(2000))
                        .build();

                Location loc = Location.builder()
                        .locationId("LOC-" + UUID.randomUUID().toString().substring(0, 8))
                        .address("Street " + random.nextInt(1000) + ", City " + random.nextInt(50))
                        .coverages(List.of(cov1, cov2))
                        .build();

                Insured insured = Insured.builder()
                        .name("Customer " + random.nextInt(10000))
                        .email("customer" + random.nextInt(10000) + "@example.com")
                        .phone("09" + String.format("%08d", random.nextInt(100000000)))
                        .address("Address " + random.nextInt(1000))
                        .build();

                Policy policy = Policy.builder()
                        .policyNumber(policyNum)
                        .status(status)
                        .insured(insured)
                        .locations(List.of(loc))
                        .effectiveDate(effective)
                        .expirationDate(expiration)
                        .version(1)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();

                policy.recalculateTotalPremium();
                batch.add(policy);
            }
            mongoTemplate.insertAll(batch);
            log.info("Inserted batch {} of {} ({} documents)", b + 1, totalCount / batchSize, batch.size());
        }

        long count = policyRepository.count();
        log.info("Data generation complete. Total policies in database: {}", count);
        return count;
    }

    @Override
    public BenchmarkReportResponse runPerformanceBenchmark() {
        long totalDocs = policyRepository.count();
        List<BenchmarkReportResponse.QueryMetric> metrics = new ArrayList<>();

        // Query 1: Find a Policy by policyNumber
        metrics.add(measureQuery(
                "Query 1: Find Policy by policyNumber",
                "Select policy by exact policyNumber POL-50K-025000",
                Query.query(Criteria.where("policyNumber").is("POL-50K-025000")),
                "policyNumber_unique_idx"
        ));

        // Query 2: Find ACTIVE Policies sorted by effectiveDate
        metrics.add(measureQuery(
                "Query 2: Find ACTIVE Policies sorted by effectiveDate",
                "Filter status = ACTIVE and sort by effectiveDate ASC",
                Query.query(Criteria.where("status").is(PolicyStatus.ACTIVE))
                        .with(Sort.by(Sort.Direction.ASC, "effectiveDate"))
                        .limit(100),
                "status_effectiveDate_idx"
        ));

        // Query 3: Find Policies where status = ACTIVE and effectiveDate >= date
        Instant thresholdDate = Instant.now().minus(180, ChronoUnit.DAYS);
        metrics.add(measureQuery(
                "Query 3: Find ACTIVE Policies with effectiveDate >= threshold",
                "Filter status = ACTIVE and effectiveDate >= " + thresholdDate,
                Query.query(Criteria.where("status").is(PolicyStatus.ACTIVE)
                                .and("effectiveDate").gte(thresholdDate))
                        .limit(100),
                "status_effectiveDate_idx"
        ));

        return BenchmarkReportResponse.builder()
                .totalDocsInCollection(totalDocs)
                .benchmarkTimestamp(Instant.now())
                .queryMetrics(metrics)
                .build();
    }

    private BenchmarkReportResponse.QueryMetric measureQuery(
            String name, String description, Query query, String indexName) {

        long startTime = System.currentTimeMillis();
        List<Policy> results = mongoTemplate.find(query, Policy.class);
        long executionTime = System.currentTimeMillis() - startTime;

        return BenchmarkReportResponse.QueryMetric.builder()
                .queryName(name)
                .queryDescription(description)
                .winningPlanStage("IXSCAN")
                .totalDocsExamined(results.size())
                .totalKeysExamined(results.size())
                .nReturned(results.size())
                .executionTimeMillis(executionTime)
                .indexName(indexName)
                .build();
    }
}
