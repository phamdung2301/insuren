package com.dungphd.insurance.dto.response;

import com.dungphd.insurance.model.ClaimDocument;
import com.dungphd.insurance.model.ClaimStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimResponse {
    private String id;
    private String claimNumber;
    private String policyId;
    private String policyNumber;
    private String claimantName;
    private String claimantPhone;
    private String claimantEmail;
    private Instant incidentDate;
    private String description;
    private Double claimAmount;
    private ClaimStatus status;
    private List<ClaimDocument> documents;
    private String reviewerNote;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
