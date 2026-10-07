package com.dungphd.insurance.service.impl;

import com.dungphd.insurance.dto.CoverageDto;
import com.dungphd.insurance.dto.InsuredDto;
import com.dungphd.insurance.dto.LocationDto;
import com.dungphd.insurance.dto.request.CreatePolicyRequest;
import com.dungphd.insurance.dto.request.UpdatePolicyRequest;
import com.dungphd.insurance.dto.response.PageResponse;
import com.dungphd.insurance.dto.response.PolicyResponse;
import com.dungphd.insurance.dto.response.PolicyTransactionResponse;
import com.dungphd.insurance.dto.response.PolicyVersionResponse;
import com.dungphd.insurance.exception.DuplicateResourceException;
import com.dungphd.insurance.exception.InvalidRequestException;
import com.dungphd.insurance.exception.ResourceNotFoundException;
import com.dungphd.insurance.model.*;
import com.dungphd.insurance.repository.PolicyRepository;
import com.dungphd.insurance.repository.PolicyTransactionRepository;
import com.dungphd.insurance.repository.PolicyVersionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolicyServiceImplTest {

    @Mock
    private PolicyRepository policyRepository;

    @Mock
    private PolicyVersionRepository policyVersionRepository;

    @Mock
    private PolicyTransactionRepository policyTransactionRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private com.dungphd.insurance.service.PremiumCalculationService premiumCalculationService;

    @InjectMocks
    private PolicyServiceImpl policyService;

    private Policy samplePolicy;
    private CreatePolicyRequest createRequest;
    private InsuredDto sampleInsuredDto;
    private LocationDto sampleLocationDto;
    private CoverageDto sampleCoverageDto;

    @BeforeEach
    void setUp() {
        sampleInsuredDto = InsuredDto.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("0901234567")
                .address("123 Main St")
                .build();

        sampleCoverageDto = CoverageDto.builder()
                .coverageCode("GL")
                .coverageName("General Liability")
                .limit(1000000.0)
                .deductible(5000.0)
                .premium(1200.0)
                .build();

        sampleLocationDto = LocationDto.builder()
                .locationId("LOC-01")
                .address("Factory A")
                .coverages(new ArrayList<>(List.of(sampleCoverageDto)))
                .build();

        createRequest = CreatePolicyRequest.builder()
                .policyNumber("POL-1001")
                .insured(sampleInsuredDto)
                .locations(List.of(sampleLocationDto))
                .effectiveDate(Instant.parse("2026-01-01T00:00:00Z"))
                .expirationDate(Instant.parse("2027-01-01T00:00:00Z"))
                .build();

        Insured insured = Insured.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("0901234567")
                .address("123 Main St")
                .build();

        Coverage coverage = Coverage.builder()
                .coverageCode("GL")
                .coverageName("General Liability")
                .limit(1000000.0)
                .deductible(5000.0)
                .premium(1200.0)
                .build();

        Location location = Location.builder()
                .locationId("LOC-01")
                .address("Factory A")
                .coverages(new ArrayList<>(List.of(coverage)))
                .build();

        samplePolicy = Policy.builder()
                .id("651a2b3c4d5e6f7a8b9c0d1e")
                .policyNumber("POL-1001")
                .status(PolicyStatus.DRAFT)
                .insured(insured)
                .locations(new ArrayList<>(List.of(location)))
                .totalPremium(1200.0)
                .effectiveDate(Instant.parse("2026-01-01T00:00:00Z"))
                .expirationDate(Instant.parse("2027-01-01T00:00:00Z"))
                .version(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        lenient().when(premiumCalculationService.calculate(any(Coverage.class))).thenReturn(1200.0);
    }

    // ==========================================
    // 2.1 Core Policy CRUD Tests (P01)
    // ==========================================

    @Test
    @DisplayName("createPolicy - Success")
    void createPolicy_Success() {
        when(policyRepository.existsByPolicyNumber("POL-1001")).thenReturn(false);
        when(policyRepository.save(any(Policy.class))).thenReturn(samplePolicy);

        PolicyResponse response = policyService.createPolicy(createRequest);

        assertNotNull(response);
        assertEquals("POL-1001", response.getPolicyNumber());
        assertEquals(PolicyStatus.DRAFT, response.getStatus());
        assertEquals(1200.0, response.getTotalPremium());
        verify(policyRepository, times(1)).save(any(Policy.class));
    }

    @Test
    @DisplayName("createPolicy - Duplicate policyNumber throws DuplicateResourceException")
    void createPolicy_DuplicatePolicyNumber_ThrowsException() {
        when(policyRepository.existsByPolicyNumber("POL-1001")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> policyService.createPolicy(createRequest));
        verify(policyRepository, never()).save(any(Policy.class));
    }

    @Test
    @DisplayName("getPolicyByNumber - Success")
    void getPolicyByNumber_Success() {
        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));

        PolicyResponse response = policyService.getPolicyByNumber("POL-1001");

        assertNotNull(response);
        assertEquals("POL-1001", response.getPolicyNumber());
    }

    @Test
    @DisplayName("getPolicyByNumber - Not found throws ResourceNotFoundException")
    void getPolicyByNumber_NotFound_ThrowsException() {
        when(policyRepository.findByPolicyNumber("POL-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> policyService.getPolicyByNumber("POL-9999"));
    }

    @Test
    @DisplayName("updatePolicy - Success")
    void updatePolicy_Success() {
        UpdatePolicyRequest updateReq = UpdatePolicyRequest.builder()
                .insured(InsuredDto.builder().name("Jane Doe").email("jane@example.com").build())
                .build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));
        when(policyRepository.save(any(Policy.class))).thenReturn(samplePolicy);

        PolicyResponse response = policyService.updatePolicy("POL-1001", updateReq);

        assertNotNull(response);
        verify(policyRepository, times(1)).save(any(Policy.class));
    }

    @Test
    @DisplayName("deletePolicy - Success")
    void deletePolicy_Success() {
        when(policyRepository.existsByPolicyNumber("POL-1001")).thenReturn(true);
        doNothing().when(policyRepository).deleteByPolicyNumber("POL-1001");

        assertDoesNotThrow(() -> policyService.deletePolicy("POL-1001"));
        verify(policyRepository, times(1)).deleteByPolicyNumber("POL-1001");
    }

    @Test
    @DisplayName("deletePolicy - Not found throws ResourceNotFoundException")
    void deletePolicy_NotFound_ThrowsException() {
        when(policyRepository.existsByPolicyNumber("POL-9999")).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> policyService.deletePolicy("POL-9999"));
    }

    // ==========================================
    // 2.2 Location Management Tests (P04)
    // ==========================================

    @Test
    @DisplayName("addLocation - Success")
    void addLocation_Success() {
        LocationDto newLocation = LocationDto.builder().locationId("LOC-02").address("Warehouse B").build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));
        when(policyRepository.addLocation(eq("POL-1001"), any(Location.class))).thenReturn(true);
        when(policyRepository.save(any(Policy.class))).thenReturn(samplePolicy);

        PolicyResponse response = policyService.addLocation("POL-1001", newLocation);

        assertNotNull(response);
        verify(policyRepository, times(1)).addLocation(eq("POL-1001"), any(Location.class));
    }

    @Test
    @DisplayName("addLocation - Duplicate locationId throws DuplicateResourceException")
    void addLocation_DuplicateLocationId_ThrowsException() {
        LocationDto duplicateLoc = LocationDto.builder().locationId("LOC-01").address("Factory A").build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));

        assertThrows(DuplicateResourceException.class, () -> policyService.addLocation("POL-1001", duplicateLoc));
    }

    @Test
    @DisplayName("removeLocation - Success")
    void removeLocation_Success() {
        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));
        when(policyRepository.removeLocation("POL-1001", "LOC-01")).thenReturn(true);
        when(policyRepository.save(any(Policy.class))).thenReturn(samplePolicy);

        PolicyResponse response = policyService.removeLocation("POL-1001", "LOC-01");

        assertNotNull(response);
        verify(policyRepository, times(1)).removeLocation("POL-1001", "LOC-01");
    }

    // ==========================================
    // 2.3 Coverage Management Tests (P05)
    // ==========================================

    @Test
    @DisplayName("addCoverage - Success")
    void addCoverage_Success() {
        CoverageDto newCoverage = CoverageDto.builder()
                .coverageCode("EL")
                .coverageName("Employer Liability")
                .limit(500000.0)
                .deductible(2000.0)
                .premium(800.0)
                .build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));
        when(policyRepository.addCoverage(eq("POL-1001"), eq("LOC-01"), any(Coverage.class))).thenReturn(true);
        when(policyRepository.save(any(Policy.class))).thenReturn(samplePolicy);

        PolicyResponse response = policyService.addCoverage("POL-1001", "LOC-01", newCoverage);

        assertNotNull(response);
        verify(policyRepository, times(1)).addCoverage(eq("POL-1001"), eq("LOC-01"), any(Coverage.class));
    }

    @Test
    @DisplayName("addCoverage - Duplicate coverageCode throws DuplicateResourceException")
    void addCoverage_DuplicateCode_ThrowsException() {
        CoverageDto duplicateCov = CoverageDto.builder().coverageCode("GL").build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));

        assertThrows(DuplicateResourceException.class, () -> policyService.addCoverage("POL-1001", "LOC-01", duplicateCov));
    }

    // ==========================================
    // 2.4 Dynamic Search & Pagination Tests (P02, P03)
    // ==========================================

    @Test
    @DisplayName("searchPolicies - Returns Paged Response")
    void searchPolicies_Success() {
        when(mongoTemplate.count(any(Query.class), eq(Policy.class))).thenReturn(1L);
        when(mongoTemplate.find(any(Query.class), eq(Policy.class))).thenReturn(List.of(samplePolicy));

        PageResponse<PolicyResponse> page = policyService.searchPolicies(
                "POL-1001", PolicyStatus.DRAFT, "John",
                null, null, null, null,
                0, 10, "updatedAt", "DESC");

        assertNotNull(page);
        assertEquals(1, page.getTotalElements());
        assertEquals(1, page.getContent().size());
        assertEquals("POL-1001", page.getContent().get(0).getPolicyNumber());
    }

    // ==========================================
    // 3.1 Policy Lifecycle State Machine Tests (P06)
    // ==========================================

    @Test
    @DisplayName("transitionStatus - Valid transition DRAFT -> QUOTED should succeed")
    void transitionStatus_Valid_Success() {
        com.dungphd.insurance.dto.request.StatusTransitionRequest req =
                com.dungphd.insurance.dto.request.StatusTransitionRequest.builder()
                        .targetStatus(PolicyStatus.QUOTED)
                        .reason("Quote approved")
                        .actor("Underwriter")
                        .build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));
        when(policyRepository.save(any(Policy.class))).thenReturn(samplePolicy);

        PolicyResponse response = policyService.transitionStatus("POL-1001", req);

        assertNotNull(response);
        verify(policyTransactionRepository, times(1)).save(any(PolicyTransaction.class));
    }

    @Test
    @DisplayName("transitionStatus - Invalid transition DRAFT -> ACTIVE should throw InvalidRequestException")
    void transitionStatus_Invalid_ThrowsException() {
        com.dungphd.insurance.dto.request.StatusTransitionRequest req =
                com.dungphd.insurance.dto.request.StatusTransitionRequest.builder()
                        .targetStatus(PolicyStatus.ACTIVE)
                        .reason("Direct activation attempt")
                        .build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));

        assertThrows(InvalidRequestException.class, () -> policyService.transitionStatus("POL-1001", req));
        verify(policyRepository, never()).save(any(Policy.class));
    }

    // ==========================================
    // 3.2 Endorsement Engine Tests (P07, P08)
    // ==========================================

    @Test
    @DisplayName("endorsePolicy - Active policy should create new version snapshot and transaction")
    void endorsePolicy_ActivePolicy_Success() {
        samplePolicy.setStatus(PolicyStatus.ACTIVE);
        com.dungphd.insurance.dto.request.EndorsementRequest req =
                com.dungphd.insurance.dto.request.EndorsementRequest.builder()
                        .changeDescription("Added new coverage to LOC-01")
                        .actor("Agent Smith")
                        .build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));
        when(policyRepository.save(any(Policy.class))).thenReturn(samplePolicy);

        PolicyResponse response = policyService.endorsePolicy("POL-1001", req);

        assertNotNull(response);
        verify(policyVersionRepository, times(2)).save(any(PolicyVersion.class));
        verify(policyTransactionRepository, times(1)).save(any(PolicyTransaction.class));
    }

    @Test
    @DisplayName("endorsePolicy - Non-Active policy should throw InvalidRequestException")
    void endorsePolicy_NonActivePolicy_ThrowsException() {
        samplePolicy.setStatus(PolicyStatus.DRAFT);
        com.dungphd.insurance.dto.request.EndorsementRequest req =
                com.dungphd.insurance.dto.request.EndorsementRequest.builder()
                        .changeDescription("Premature endorsement")
                        .build();

        when(policyRepository.findByPolicyNumber("POL-1001")).thenReturn(Optional.of(samplePolicy));

        assertThrows(InvalidRequestException.class, () -> policyService.endorsePolicy("POL-1001", req));
        verify(policyVersionRepository, never()).save(any(PolicyVersion.class));
    }

    // ==========================================
    // 3.4 History & Version Query Tests (P08)
    // ==========================================

    @Test
    @DisplayName("getPolicyHistory - Returns transactions list")
    void getPolicyHistory_Success() {
        PolicyTransaction txn = PolicyTransaction.builder()
                .policyNumber("POL-1001")
                .version(1)
                .transactionType(TransactionType.CREATE_POLICY)
                .actor("System")
                .description("Created Policy")
                .timestamp(Instant.now())
                .build();

        when(policyRepository.existsByPolicyNumber("POL-1001")).thenReturn(true);
        when(policyTransactionRepository.findByPolicyNumberOrderByTimestampDesc("POL-1001"))
                .thenReturn(List.of(txn));

        List<PolicyTransactionResponse> history = policyService.getPolicyHistory("POL-1001");

        assertNotNull(history);
        assertEquals(1, history.size());
        assertEquals(TransactionType.CREATE_POLICY, history.get(0).getTransactionType());
    }

    @Test
    @DisplayName("getPolicyVersion - Returns version snapshot")
    void getPolicyVersion_Success() {
        PolicyVersion ver = PolicyVersion.builder()
                .policyNumber("POL-1001")
                .version(1)
                .policySnapshot(samplePolicy)
                .createdBy("System")
                .createdAt(Instant.now())
                .build();

        when(policyVersionRepository.findByPolicyNumberAndVersion("POL-1001", 1))
                .thenReturn(Optional.of(ver));

        PolicyVersionResponse response = policyService.getPolicyVersion("POL-1001", 1);

        assertNotNull(response);
        assertEquals(1, response.getVersion());
        assertEquals("POL-1001", response.getPolicyNumber());
    }
}
