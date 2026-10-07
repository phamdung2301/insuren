package com.dungphd.insurance.dto.request;

import com.dungphd.insurance.model.PolicyStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusTransitionRequest {

    @NotNull(message = "Target status is required")
    private PolicyStatus targetStatus;

    private String reason;

    private String actor;

    private java.time.Instant paymentDueDate;
}
