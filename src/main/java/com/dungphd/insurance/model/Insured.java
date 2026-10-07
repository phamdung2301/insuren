package com.dungphd.insurance.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Insured {
    private String insuredId; // e.g. INS-001
    private String name;
    private String type;      // BUSINESS or INDIVIDUAL
    private String email;
    private String phone;
    private String address;
}
