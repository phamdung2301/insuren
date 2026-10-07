package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.CoverageDto;
import com.dungphd.insurance.dto.InsuredDto;
import com.dungphd.insurance.dto.LocationDto;
import com.dungphd.insurance.dto.request.CreatePolicyRequest;
import com.dungphd.insurance.dto.request.UpdatePolicyRequest;
import com.dungphd.insurance.dto.response.PolicyResponse;
import com.dungphd.insurance.exception.GlobalExceptionHandler;
import com.dungphd.insurance.model.PolicyStatus;
import com.dungphd.insurance.service.PolicyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PolicyControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PolicyService policyService;

    @InjectMocks
    private PolicyController policyController;

    private PolicyResponse samplePolicyResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(policyController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        InsuredDto insured = InsuredDto.builder()
                .name("John Doe")
                .email("john@example.com")
                .phone("1234567890")
                .address("123 Main St")
                .build();

        CoverageDto coverage = CoverageDto.builder()
                .coverageCode("GL")
                .coverageName("General Liability")
                .limit(1000000.0)
                .deductible(5000.0)
                .premium(1200.0)
                .build();

        LocationDto location = LocationDto.builder()
                .locationId("LOC-01")
                .address("Factory A")
                .coverages(List.of(coverage))
                .build();

        samplePolicyResponse = PolicyResponse.builder()
                .id("651a2b3c4d5e6f7a8b9c0d1e")
                .policyNumber("POL-1001")
                .status(PolicyStatus.DRAFT)
                .insured(insured)
                .locations(List.of(location))
                .totalPremium(1200.0)
                .effectiveDate(Instant.parse("2026-01-01T00:00:00Z"))
                .expirationDate(Instant.parse("2027-01-01T00:00:00Z"))
                .version(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    // ==========================================
    // 2.1 Core Policy CRUD Tests (P01)
    // ==========================================

    @Test
    @DisplayName("POST /policies - Should create policy successfully")
    void testCreatePolicy() throws Exception {
        when(policyService.createPolicy(any(CreatePolicyRequest.class))).thenReturn(samplePolicyResponse);

        String jsonPayload = """
                {
                    "policyNumber": "POL-1001",
                    "insured": {
                        "name": "John Doe",
                        "email": "john@example.com",
                        "phone": "1234567890",
                        "address": "123 Main St"
                    },
                    "effectiveDate": "2026-01-01T00:00:00Z",
                    "expirationDate": "2027-01-01T00:00:00Z"
                }
                """;

        mockMvc.perform(post("/policies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.policyNumber").value("POL-1001"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.totalPremium").value(1200.0));
    }

    @Test
    @DisplayName("GET /policies/{policyNumber} - Should get policy by policyNumber")
    void testGetPolicyByNumber() throws Exception {
        when(policyService.getPolicyByNumber("POL-1001")).thenReturn(samplePolicyResponse);

        mockMvc.perform(get("/policies/POL-1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.policyNumber").value("POL-1001"));
    }

    @Test
    @DisplayName("GET /policies - Should search and return paged list of policies")
    void testSearchPolicies() throws Exception {
        com.dungphd.insurance.dto.response.PageResponse<PolicyResponse> pageResponse =
                com.dungphd.insurance.dto.response.PageResponse.<PolicyResponse>builder()
                .content(List.of(samplePolicyResponse))
                .pageNumber(0)
                .pageSize(20)
                .totalElements(1)
                .totalPages(1)
                .isFirst(true)
                .isLast(true)
                .build();

        when(policyService.searchPolicies(any(), any(), any(), any(), any(), any(), any(), eq(0), eq(20), eq("updatedAt"), eq("DESC")))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/policies")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sortBy", "updatedAt")
                        .param("sortDirection", "DESC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].policyNumber").value("POL-1001"))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("PUT /policies/{policyNumber} - Should update policy info")
    void testUpdatePolicy() throws Exception {
        when(policyService.updatePolicy(eq("POL-1001"), any(UpdatePolicyRequest.class)))
                .thenReturn(samplePolicyResponse);

        String jsonPayload = """
                {
                    "insured": {
                        "name": "John Doe",
                        "email": "john@example.com",
                        "phone": "1234567890",
                        "address": "123 Main St"
                    }
                }
                """;

        mockMvc.perform(put("/policies/POL-1001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.policyNumber").value("POL-1001"));
    }

    @Test
    @DisplayName("DELETE /policies/{policyNumber} - Should delete policy")
    void testDeletePolicy() throws Exception {
        doNothing().when(policyService).deletePolicy("POL-1001");

        mockMvc.perform(delete("/policies/POL-1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Policy deleted successfully"));
    }

    // ==========================================
    // 2.2 Location Management Tests (P04)
    // ==========================================

    @Test
    @DisplayName("POST /policies/{policyNumber}/locations - Should add location")
    void testAddLocation() throws Exception {
        when(policyService.addLocation(eq("POL-1001"), any(LocationDto.class))).thenReturn(samplePolicyResponse);

        String jsonPayload = """
                {
                    "locationId": "LOC-02",
                    "address": "Warehouse B"
                }
                """;

        mockMvc.perform(post("/policies/POL-1001/locations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PUT /policies/{policyNumber}/locations/{locationId} - Should update location")
    void testUpdateLocation() throws Exception {
        when(policyService.updateLocation(eq("POL-1001"), eq("LOC-01"), any(LocationDto.class)))
                .thenReturn(samplePolicyResponse);

        String jsonPayload = """
                {
                    "locationId": "LOC-01",
                    "address": "Updated Address"
                }
                """;

        mockMvc.perform(put("/policies/POL-1001/locations/LOC-01")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /policies/{policyNumber}/locations/{locationId} - Should remove location")
    void testRemoveLocation() throws Exception {
        when(policyService.removeLocation("POL-1001", "LOC-01")).thenReturn(samplePolicyResponse);

        mockMvc.perform(delete("/policies/POL-1001/locations/LOC-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==========================================
    // 2.3 Coverage Management Tests (P05)
    // ==========================================

    @Test
    @DisplayName("POST /policies/{policyNumber}/locations/{locationId}/coverages - Should add coverage")
    void testAddCoverage() throws Exception {
        when(policyService.addCoverage(eq("POL-1001"), eq("LOC-01"), any(CoverageDto.class)))
                .thenReturn(samplePolicyResponse);

        String jsonPayload = """
                {
                    "coverageCode": "EL",
                    "coverageName": "Employer Liability",
                    "limit": 500000.0,
                    "deductible": 2000.0,
                    "premium": 800.0
                }
                """;

        mockMvc.perform(post("/policies/POL-1001/locations/LOC-01/coverages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PUT /policies/{policyNumber}/locations/{locationId}/coverages/{coverageCode} - Should update coverage")
    void testUpdateCoverage() throws Exception {
        when(policyService.updateCoverage(eq("POL-1001"), eq("LOC-01"), eq("GL"), any(CoverageDto.class)))
                .thenReturn(samplePolicyResponse);

        String jsonPayload = """
                {
                    "coverageCode": "GL",
                    "coverageName": "General Liability Updated",
                    "limit": 2000000.0,
                    "deductible": 10000.0,
                    "premium": 1500.0
                }
                """;

        mockMvc.perform(put("/policies/POL-1001/locations/LOC-01/coverages/GL")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /policies/{policyNumber}/locations/{locationId}/coverages/{coverageCode} - Should remove coverage")
    void testRemoveCoverage() throws Exception {
        when(policyService.removeCoverage("POL-1001", "LOC-01", "GL")).thenReturn(samplePolicyResponse);

        mockMvc.perform(delete("/policies/POL-1001/locations/LOC-01/coverages/GL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==========================================
    // 3.1 & 3.2 Status Transition & Endorsement Tests (P06, P07)
    // ==========================================

    @Test
    @DisplayName("POST /policies/{policyNumber}/status-transitions - Should transition status")
    void testTransitionStatus() throws Exception {
        when(policyService.transitionStatus(eq("POL-1001"), any(com.dungphd.insurance.dto.request.StatusTransitionRequest.class)))
                .thenReturn(samplePolicyResponse);

        String jsonPayload = """
                {
                    "targetStatus": "QUOTED",
                    "reason": "Approved"
                }
                """;

        mockMvc.perform(post("/policies/POL-1001/status-transitions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Status transitioned successfully"));
    }

    @Test
    @DisplayName("POST /policies/{policyNumber}/endorsements - Should endorse active policy")
    void testEndorsePolicy() throws Exception {
        when(policyService.endorsePolicy(eq("POL-1001"), any(com.dungphd.insurance.dto.request.EndorsementRequest.class)))
                .thenReturn(samplePolicyResponse);

        String jsonPayload = """
                {
                    "changeDescription": "Added new location",
                    "actor": "Agent A"
                }
                """;

        mockMvc.perform(post("/policies/POL-1001/endorsements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Policy endorsed successfully, new version created"));
    }

    // ==========================================
    // 3.4 History & Version Query Tests (P08)
    // ==========================================

    @Test
    @DisplayName("GET /policies/{policyNumber}/history - Should return transaction history")
    void testGetPolicyHistory() throws Exception {
        com.dungphd.insurance.dto.response.PolicyTransactionResponse txn =
                com.dungphd.insurance.dto.response.PolicyTransactionResponse.builder()
                        .id("txn-01")
                        .policyNumber("POL-1001")
                        .version(1)
                        .transactionType(com.dungphd.insurance.model.TransactionType.CREATE_POLICY)
                        .actor("System")
                        .description("Created Policy")
                        .timestamp(Instant.now())
                        .build();

        when(policyService.getPolicyHistory("POL-1001")).thenReturn(List.of(txn));

        mockMvc.perform(get("/policies/POL-1001/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].policyNumber").value("POL-1001"));
    }

    @Test
    @DisplayName("GET /policies/{policyNumber}/versions/{version} - Should return policy version snapshot")
    void testGetPolicyVersion() throws Exception {
        com.dungphd.insurance.dto.response.PolicyVersionResponse versionResponse =
                com.dungphd.insurance.dto.response.PolicyVersionResponse.builder()
                        .id("ver-01")
                        .policyNumber("POL-1001")
                        .version(1)
                        .policySnapshot(samplePolicyResponse)
                        .createdBy("System")
                        .createdAt(Instant.now())
                        .build();

        when(policyService.getPolicyVersion("POL-1001", 1)).thenReturn(versionResponse);

        mockMvc.perform(get("/policies/POL-1001/versions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.version").value(1))
                .andExpect(jsonPath("$.data.policyNumber").value("POL-1001"));
    }
}
