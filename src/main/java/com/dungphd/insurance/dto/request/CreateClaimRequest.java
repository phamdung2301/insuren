package com.dungphd.insurance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateClaimRequest {

    @NotBlank(message = "Policy number is required")
    private String policyNumber;

    @NotBlank(message = "Claimant name is required")
    private String claimantName;

    private String claimantPhone;

    private String claimantEmail;

    @NotNull(message = "Incident date is required")
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.dungphd.insurance.config.FlexibleInstantDeserializer.class)
    private Instant incidentDate;

    @NotBlank(message = "Incident description is required")
    private String description;

    @NotNull(message = "Claim amount is required")
    @Positive(message = "Claim amount must be positive")
    private Double claimAmount;
}
