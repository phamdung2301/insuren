package com.dungphd.insurance.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {
    private String locationId;
    private String address;

    @Builder.Default
    private List<Coverage> coverages = new ArrayList<>();
}
