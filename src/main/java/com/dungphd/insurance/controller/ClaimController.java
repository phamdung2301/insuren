package com.dungphd.insurance.controller;

import com.dungphd.insurance.dto.request.ClaimStatusTransitionRequest;
import com.dungphd.insurance.dto.request.CreateClaimRequest;
import com.dungphd.insurance.dto.response.ApiResponse;
import com.dungphd.insurance.dto.response.ClaimResponse;
import com.dungphd.insurance.dto.response.PageResponse;
import com.dungphd.insurance.model.ClaimStatus;
import com.dungphd.insurance.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    public ResponseEntity<ApiResponse<ClaimResponse>> createClaim(@Valid @RequestBody CreateClaimRequest request) {
        ClaimResponse response = claimService.createClaim(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Claim submitted successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ClaimResponse>>> listClaims(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) String policyNumber,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<ClaimResponse> response = claimService.listClaims(status, policyNumber, search, page, size);
        return ResponseEntity.ok(ApiResponse.success(response, "Claims retrieved successfully"));
    }

    @GetMapping("/{claimNumber}")
    public ResponseEntity<ApiResponse<ClaimResponse>> getClaim(@PathVariable String claimNumber) {
        ClaimResponse response = claimService.getClaim(claimNumber);
        return ResponseEntity.ok(ApiResponse.success(response, "Claim retrieved successfully"));
    }

    @PatchMapping("/{claimNumber}/status")
    public ResponseEntity<ApiResponse<ClaimResponse>> transitionStatus(
            @PathVariable String claimNumber,
            @Valid @RequestBody ClaimStatusTransitionRequest request) {
        ClaimResponse response = claimService.transitionStatus(claimNumber, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Claim status updated successfully"));
    }

    @PostMapping("/{claimNumber}/documents")
    public ResponseEntity<ApiResponse<ClaimResponse>> addDocument(
            @PathVariable String claimNumber,
            @RequestParam String fileName,
            @RequestParam(required = false) String fileUrl) {
        ClaimResponse response = claimService.addDocument(claimNumber, fileName, fileUrl);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Document added successfully"));
    }
}
