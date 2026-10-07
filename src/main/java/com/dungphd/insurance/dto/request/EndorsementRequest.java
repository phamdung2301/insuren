package com.dungphd.insurance.dto.request;

import com.dungphd.insurance.dto.CoverageDto;
import com.dungphd.insurance.dto.InsuredDto;
import com.dungphd.insurance.dto.LocationDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EndorsementRequest {

    private String changeDescription;

    private String description;

    // ADD_COVERAGE | REMOVE_COVERAGE | UPDATE_COVERAGE | ADD_LOCATION | REMOVE_LOCATION | GENERAL
    private String endorsementType;

    private String actor;

    private String locationId;

    private String coverageCode;

    @Valid
    private CoverageDto coverage;

    @Valid
    private InsuredDto insured;

    @Valid
    private List<LocationDto> locations;

    public String getEffectiveDescription() {
        if (changeDescription != null && !changeDescription.isBlank()) return changeDescription;
        if (description != null && !description.isBlank()) return description;
        if (endorsementType != null) return "Endorsement: " + endorsementType;
        return "General Policy Endorsement";
    }
}
