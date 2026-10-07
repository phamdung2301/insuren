package com.dungphd.insurance.service;

import com.dungphd.insurance.dto.CoverageDto;
import com.dungphd.insurance.dto.LocationDto;
import com.dungphd.insurance.dto.request.CreatePolicyRequest;
import com.dungphd.insurance.dto.request.UpdatePolicyRequest;
import com.dungphd.insurance.dto.response.PageResponse;
import com.dungphd.insurance.dto.response.PolicyResponse;

public interface PolicyService {

    // Milestone 2.1 - Policy Core CRUD (P01)
    PolicyResponse createPolicy(CreatePolicyRequest request);
    PolicyResponse getPolicyByNumber(String policyNumber);
    PolicyResponse updatePolicy(String policyNumber, UpdatePolicyRequest request);
    void deletePolicy(String policyNumber);

    // Milestone 2.2 - Location Management (P04)
    PolicyResponse addLocation(String policyNumber, LocationDto locationDto);
    PolicyResponse updateLocation(String policyNumber, String locationId, LocationDto locationDto);
    PolicyResponse removeLocation(String policyNumber, String locationId);

    // Milestone 2.3 - Coverage Management (P05)
    PolicyResponse addCoverage(String policyNumber, String locationId, CoverageDto coverageDto);
    PolicyResponse updateCoverage(String policyNumber, String locationId, String coverageCode, CoverageDto coverageDto);
    PolicyResponse removeCoverage(String policyNumber, String locationId, String coverageCode);

    // Milestone 2.4 - Dynamic Search, Filtering, Paging & Sorting (P02, P03)
    PageResponse<PolicyResponse> searchPolicies(
            String policyNumber,
            com.dungphd.insurance.model.PolicyStatus status,
            String insuredName,
            java.time.Instant effectiveFrom,
            java.time.Instant effectiveTo,
            Double minPremium,
            Double maxPremium,
            int page,
            int size,
            String sortBy,
            String sortDirection);

    // Milestone 3.1 - Status Transition Validation Engine (P06)
    PolicyResponse transitionStatus(String policyNumber, com.dungphd.insurance.dto.request.StatusTransitionRequest request);

    // Milestone 3.2 - Endorsement & History Versioning System (P07, P08)
    PolicyResponse endorsePolicy(String policyNumber, com.dungphd.insurance.dto.request.EndorsementRequest request);

    // Milestone 3.4 - History & Version Queries (P08)
    java.util.List<com.dungphd.insurance.dto.response.PolicyTransactionResponse> getPolicyHistory(String policyNumber);
    java.util.List<com.dungphd.insurance.dto.response.PolicyVersionResponse> getAllPolicyVersions(String policyNumber);
    com.dungphd.insurance.dto.response.PolicyVersionResponse getPolicyVersion(String policyNumber, Integer version);
}
