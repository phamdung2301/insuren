package com.dungphd.insurance.dto.request;

import com.dungphd.insurance.dto.InsuredDto;
import com.dungphd.insurance.dto.LocationDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePolicyRequest {

    @NotBlank(message = "Policy number is required")
    private String policyNumber;

    @NotNull(message = "Insured information is required")
    @Valid
    private InsuredDto insured;

    @Valid
    @Builder.Default
    private List<LocationDto> locations = new ArrayList<>();

    @NotNull(message = "Effective date is required")
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.dungphd.insurance.config.FlexibleInstantDeserializer.class)
    private Instant effectiveDate;

    @NotNull(message = "Expiration date is required")
    @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = com.dungphd.insurance.config.FlexibleInstantDeserializer.class)
    private Instant expirationDate;
}
