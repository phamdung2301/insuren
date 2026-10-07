package com.dungphd.insurance.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coverage {
    private String coverageCode;     // e.g. PROPERTY, GL, EL, BI, MARINE
    private String coverageName;     // Display name
    private String coverageType;     // STANDARD, ENHANCED, COMPREHENSIVE
    private Double limit;            // Maximum coverage limit (USD)
    private Double deductible;       // Deductible amount (USD)
    private Integer termMonths;      // Policy term in months (12, 24, 36)
    private Double baseRate;         // Rate % from pricing matrix (e.g. 0.075 = 0.075%)
    private Double premium;          // Calculated premium = limit * baseRate * termFactor * typeFactor / 100
}
