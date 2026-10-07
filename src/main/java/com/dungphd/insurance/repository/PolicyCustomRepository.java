package com.dungphd.insurance.repository;

import com.dungphd.insurance.model.Coverage;
import com.dungphd.insurance.model.Location;

public interface PolicyCustomRepository {
    boolean addLocation(String policyNumber, Location location);
    boolean updateLocation(String policyNumber, String locationId, Location location);
    boolean removeLocation(String policyNumber, String locationId);

    boolean addCoverage(String policyNumber, String locationId, Coverage coverage);
    boolean updateCoverage(String policyNumber, String locationId, String coverageCode, Coverage coverage);
    boolean removeCoverage(String policyNumber, String locationId, String coverageCode);
}
