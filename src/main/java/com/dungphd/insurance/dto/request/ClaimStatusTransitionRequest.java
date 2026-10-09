package com.dungphd.insurance.dto.request;

import com.dungphd.insurance.model.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimStatusTransitionRequest {

    @NotNull(message = "Target status is required")
    private ClaimStatus targetStatus;

    private String reviewerNote;
}
