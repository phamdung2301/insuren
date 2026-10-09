package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.CoverageDto;
import com.dungphd.insurance.dto.LocationDto;
import com.dungphd.insurance.dto.request.CreatePolicyRequest;
import com.dungphd.insurance.dto.request.UpdatePolicyRequest;
import com.dungphd.insurance.dto.response.ApiResponse;
import com.dungphd.insurance.dto.response.PolicyResponse;
import com.dungphd.insurance.service.PolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyService policyService;

    // ==========================================
    // 2.1 Policy Core CRUD (P01)
    // ==========================================

    @PostMapping
    public ResponseEntity<ApiResponse<PolicyResponse>> createPolicy(@Valid @RequestBody CreatePolicyRequest request) {
        PolicyResponse response = policyService.createPolicy(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Policy created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<com.dungphd.insurance.dto.response.PageResponse<PolicyResponse>>> searchPolicies(
            @RequestParam(required = false) String policyNumber,
            @RequestParam(required = false) com.dungphd.insurance.model.PolicyStatus status,
            @RequestParam(required = false) String insuredName,
            @RequestParam(required = false) java.time.Instant effectiveFrom,
            @RequestParam(required = false) java.time.Instant effectiveTo,
            @RequestParam(required = false) Double minPremium,
            @RequestParam(required = false) Double maxPremium,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        com.dungphd.insurance.dto.response.PageResponse<PolicyResponse> response = policyService.searchPolicies(
                policyNumber, status, insuredName, effectiveFrom, effectiveTo,
                minPremium, maxPremium, page, size, sortBy, sortDirection);

        return ResponseEntity.ok(ApiResponse.success(response, "Policies retrieved successfully"));
    }

    @GetMapping("/expiring")
    public ResponseEntity<ApiResponse<java.util.List<PolicyResponse>>> getExpiringPolicies(
            @RequestParam(defaultValue = "30") int days) {
        java.util.List<PolicyResponse> response = policyService.getExpiringPolicies(days);
        return ResponseEntity.ok(ApiResponse.success(response, "Expiring policies retrieved successfully"));
    }

    @GetMapping("/{policyNumber}")
    public ResponseEntity<ApiResponse<PolicyResponse>> getPolicyByNumber(@PathVariable String policyNumber) {
        PolicyResponse response = policyService.getPolicyByNumber(policyNumber);
        return ResponseEntity.ok(ApiResponse.success(response, "Policy retrieved successfully"));
    }

    @PutMapping("/{policyNumber}")
    public ResponseEntity<ApiResponse<PolicyResponse>> updatePolicy(
            @PathVariable String policyNumber,
            @Valid @RequestBody UpdatePolicyRequest request) {
        PolicyResponse response = policyService.updatePolicy(policyNumber, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Policy updated successfully"));
    }

    @DeleteMapping("/{policyNumber}")
    public ResponseEntity<ApiResponse<Void>> deletePolicy(@PathVariable String policyNumber) {
        policyService.deletePolicy(policyNumber);
        return ResponseEntity.ok(ApiResponse.success(null, "Policy deleted successfully"));
    }

    // ==========================================
    // 2.2 Location Management (P04)
    // ==========================================

    @PostMapping("/{policyNumber}/locations")
    public ResponseEntity<ApiResponse<PolicyResponse>> addLocation(
            @PathVariable String policyNumber,
            @Valid @RequestBody LocationDto locationDto) {
        PolicyResponse response = policyService.addLocation(policyNumber, locationDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Location added successfully to policy"));
    }

    @PutMapping("/{policyNumber}/locations/{locationId}")
    public ResponseEntity<ApiResponse<PolicyResponse>> updateLocation(
            @PathVariable String policyNumber,
            @PathVariable String locationId,
            @Valid @RequestBody LocationDto locationDto) {
        PolicyResponse response = policyService.updateLocation(policyNumber, locationId, locationDto);
        return ResponseEntity.ok(ApiResponse.success(response, "Location updated successfully"));
    }

    @DeleteMapping("/{policyNumber}/locations/{locationId}")
    public ResponseEntity<ApiResponse<PolicyResponse>> removeLocation(
            @PathVariable String policyNumber,
            @PathVariable String locationId) {
        PolicyResponse response = policyService.removeLocation(policyNumber, locationId);
        return ResponseEntity.ok(ApiResponse.success(response, "Location removed successfully"));
    }

    // ==========================================
    // 2.3 Coverage Management (P05)
    // ==========================================

    @PostMapping("/{policyNumber}/locations/{locationId}/coverages")
    public ResponseEntity<ApiResponse<PolicyResponse>> addCoverage(
            @PathVariable String policyNumber,
            @PathVariable String locationId,
            @Valid @RequestBody CoverageDto coverageDto) {
        PolicyResponse response = policyService.addCoverage(policyNumber, locationId, coverageDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Coverage added successfully to location"));
    }

    @PutMapping("/{policyNumber}/locations/{locationId}/coverages/{coverageCode}")
    public ResponseEntity<ApiResponse<PolicyResponse>> updateCoverage(
            @PathVariable String policyNumber,
            @PathVariable String locationId,
            @PathVariable String coverageCode,
            @Valid @RequestBody CoverageDto coverageDto) {
        PolicyResponse response = policyService.updateCoverage(policyNumber, locationId, coverageCode, coverageDto);
        return ResponseEntity.ok(ApiResponse.success(response, "Coverage updated successfully"));
    }

    @DeleteMapping("/{policyNumber}/locations/{locationId}/coverages/{coverageCode}")
    public ResponseEntity<ApiResponse<PolicyResponse>> removeCoverage(
            @PathVariable String policyNumber,
            @PathVariable String locationId,
            @PathVariable String coverageCode) {
        PolicyResponse response = policyService.removeCoverage(policyNumber, locationId, coverageCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Coverage removed successfully"));
    }

    // ==========================================
    // 3.1 Policy Lifecycle State Machine (P06)
    // ==========================================

    @PostMapping("/{policyNumber}/status-transitions")
    public ResponseEntity<ApiResponse<PolicyResponse>> transitionStatus(
            @PathVariable String policyNumber,
            @Valid @RequestBody com.dungphd.insurance.dto.request.StatusTransitionRequest request) {
        PolicyResponse response = policyService.transitionStatus(policyNumber, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Status transitioned successfully"));
    }

    // ==========================================
    // 3.2 Endorsement Engine (P07)
    // ==========================================

    @PostMapping("/{policyNumber}/endorsements")
    public ResponseEntity<ApiResponse<PolicyResponse>> endorsePolicy(
            @PathVariable String policyNumber,
            @Valid @RequestBody com.dungphd.insurance.dto.request.EndorsementRequest request) {
        PolicyResponse response = policyService.endorsePolicy(policyNumber, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Policy endorsed successfully, new version created"));
    }

    // ==========================================
    // Feature: Renewal (tái tục hợp đồng)
    // ==========================================

    @PostMapping("/{policyNumber}/renew")
    public ResponseEntity<ApiResponse<PolicyResponse>> renewPolicy(@PathVariable String policyNumber) {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String actor = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        PolicyResponse response = policyService.renewPolicy(policyNumber, actor);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Policy renewed successfully, new draft created"));
    }

    // ==========================================
    // 3.4 History & Version Queries (P08)
    // ==========================================

    @GetMapping("/{policyNumber}/history")
    public ResponseEntity<ApiResponse<java.util.List<com.dungphd.insurance.dto.response.PolicyTransactionResponse>>> getPolicyHistory(
            @PathVariable String policyNumber) {
        java.util.List<com.dungphd.insurance.dto.response.PolicyTransactionResponse> history = policyService.getPolicyHistory(policyNumber);
        return ResponseEntity.ok(ApiResponse.success(history, "Policy transaction history retrieved successfully"));
    }

    @GetMapping("/{policyNumber}/versions")
    public ResponseEntity<ApiResponse<java.util.List<com.dungphd.insurance.dto.response.PolicyVersionResponse>>> getAllPolicyVersions(
            @PathVariable String policyNumber) {
        java.util.List<com.dungphd.insurance.dto.response.PolicyVersionResponse> versions = policyService.getAllPolicyVersions(policyNumber);
        return ResponseEntity.ok(ApiResponse.success(versions, "Policy version history retrieved successfully"));
    }

    @GetMapping("/{policyNumber}/versions/{version}")
    public ResponseEntity<ApiResponse<com.dungphd.insurance.dto.response.PolicyVersionResponse>> getPolicyVersion(
            @PathVariable String policyNumber,
            @PathVariable Integer version) {
        com.dungphd.insurance.dto.response.PolicyVersionResponse versionResponse = policyService.getPolicyVersion(policyNumber, version);
        return ResponseEntity.ok(ApiResponse.success(versionResponse, "Policy version snapshot retrieved successfully"));
    }
}
