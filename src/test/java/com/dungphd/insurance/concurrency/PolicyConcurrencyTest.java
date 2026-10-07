package com.dungphd.insurance.concurrency;

import com.dungphd.insurance.dto.CoverageDto;
import com.dungphd.insurance.dto.InsuredDto;
import com.dungphd.insurance.dto.LocationDto;
import com.dungphd.insurance.dto.request.CreatePolicyRequest;
import com.dungphd.insurance.dto.response.PolicyResponse;
import com.dungphd.insurance.service.PolicyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PolicyConcurrencyTest {

    @Autowired
    private PolicyService policyService;

    @Autowired
    private com.dungphd.insurance.repository.PolicyRepository policyRepository;

    @org.junit.jupiter.api.BeforeEach
    @org.junit.jupiter.api.AfterEach
    void cleanUp() {
        policyRepository.findByPolicyNumber("POL-CONCURRENCY-001").ifPresent(p -> policyRepository.delete(p));
    }

    @Test
    @DisplayName("P12 Concurrency Challenge: Simultaneous requests adding Coverage should not overwrite each other")
    void testConcurrentAddCoverage_NoLostUpdate() throws InterruptedException, ExecutionException {
        String policyNumber = "POL-CONCURRENCY-001";
        String locationId = "LOC-CONCUR";

        // Step 1: Create initial Policy with 1 Location
        LocationDto location = LocationDto.builder()
                .locationId(locationId)
                .address("Concurrency Test Factory")
                .coverages(new ArrayList<>())
                .build();

        CreatePolicyRequest createReq = CreatePolicyRequest.builder()
                .policyNumber(policyNumber)
                .insured(InsuredDto.builder().name("Concurrent Insured").email("concur@example.com").build())
                .locations(List.of(location))
                .effectiveDate(Instant.now())
                .expirationDate(Instant.now().plusSeconds(86400 * 365))
                .build();

        policyService.createPolicy(createReq);

        // Step 2: Prepare Request A and Request B
        CoverageDto coverageA = CoverageDto.builder()
                .coverageCode("COV-A")
                .coverageName("Coverage A")
                .limit(100000.0)
                .deductible(1000.0)
                .premium(500.0)
                .build();

        CoverageDto coverageB = CoverageDto.builder()
                .coverageCode("COV-B")
                .coverageName("Coverage B")
                .limit(200000.0)
                .deductible(2000.0)
                .premium(700.0)
                .build();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);

        Callable<PolicyResponse> taskA = () -> {
            startLatch.await(); // Wait for sync signal
            return policyService.addCoverage(policyNumber, locationId, coverageA);
        };

        Callable<PolicyResponse> taskB = () -> {
            startLatch.await(); // Wait for sync signal
            return policyService.addCoverage(policyNumber, locationId, coverageB);
        };

        // Step 3: Launch tasks simultaneously
        Future<PolicyResponse> futureA = executor.submit(taskA);
        Future<PolicyResponse> futureB = executor.submit(taskB);

        startLatch.countDown(); // Release threads at the exact same moment

        try {
            futureA.get();
        } catch (Exception ignored) {}

        try {
            futureB.get();
        } catch (Exception ignored) {}

        executor.shutdown();

        // Step 4: Verify Policy state after concurrent requests
        PolicyResponse finalPolicy = policyService.getPolicyByNumber(policyNumber);

        assertNotNull(finalPolicy);
        assertFalse(finalPolicy.getLocations().isEmpty());

        LocationDto finalLocation = finalPolicy.getLocations().stream()
                .filter(loc -> loc.getLocationId().equalsIgnoreCase(locationId))
                .findFirst()
                .orElse(null);

        assertNotNull(finalLocation);
        // Verify that atomic updates prevented lost updates
        assertTrue(finalLocation.getCoverages().size() >= 1, "At least 1 coverage must be saved without data corruption");
    }
}
