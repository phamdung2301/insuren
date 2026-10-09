package com.dungphd.insurance.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "claims")
public class Claim {

    @Id
    private String id;

    @Indexed(unique = true)
    private String claimNumber;

    @Indexed
    private String policyId;

    @Indexed
    private String policyNumber;

    private String claimantName;
    private String claimantPhone;
    private String claimantEmail;

    private Instant incidentDate;

    private String description;

    private Double claimAmount;

    @Indexed
    private ClaimStatus status;

    @Builder.Default
    private List<ClaimDocument> documents = new ArrayList<>();

    private String reviewerNote;

    @Indexed
    private String createdBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
