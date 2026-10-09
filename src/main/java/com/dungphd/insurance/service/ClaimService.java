package com.dungphd.insurance.service;

import com.dungphd.insurance.dto.request.ClaimStatusTransitionRequest;
import com.dungphd.insurance.dto.request.CreateClaimRequest;
import com.dungphd.insurance.dto.response.ClaimResponse;
import com.dungphd.insurance.dto.response.PageResponse;
import com.dungphd.insurance.model.ClaimStatus;

public interface ClaimService {

    ClaimResponse createClaim(CreateClaimRequest request);

    PageResponse<ClaimResponse> listClaims(ClaimStatus status, String policyNumber, String search,
                                          int page, int size);

    ClaimResponse getClaim(String claimNumber);

    ClaimResponse transitionStatus(String claimNumber, ClaimStatusTransitionRequest request);

    ClaimResponse addDocument(String claimNumber, String fileName, String fileUrl);
}
