package com.dungphd.insurance.dto.response;

import com.dungphd.insurance.model.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyTransactionResponse {
    private String id;
    private String policyNumber;
    private Integer version;
    private TransactionType transactionType;
    private String actor;
    private String description;
    private Instant timestamp;
}
