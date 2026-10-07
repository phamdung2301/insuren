package com.dungphd.insurance.dto.request;

import com.dungphd.insurance.dto.InsuredDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePolicyRequest {
    @Valid
    private InsuredDto insured;
    private Instant effectiveDate;
    private Instant expirationDate;
}
