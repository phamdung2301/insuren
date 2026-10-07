package com.dungphd.insurance.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyPremiumReportDto {
    private int month;
    private int year;
    private double totalPremium;
    private long count;
}
