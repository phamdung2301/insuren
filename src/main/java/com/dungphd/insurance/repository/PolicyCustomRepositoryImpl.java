package com.dungphd.insurance.repository;

import com.dungphd.insurance.model.Coverage;
import com.dungphd.insurance.model.Location;
import com.dungphd.insurance.model.Policy;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PolicyCustomRepositoryImpl implements PolicyCustomRepository {

    private final MongoTemplate mongoTemplate;

    @Override
    public boolean addLocation(String policyNumber, Location location) {
        Query query = new Query(Criteria.where("policyNumber").is(policyNumber));
        Update update = new Update()
                .push("locations", location)
                .currentDate("updatedAt");
        UpdateResult result = mongoTemplate.updateFirst(query, update, Policy.class);
        return result.getModifiedCount() > 0;
    }

    @Override
    public boolean updateLocation(String policyNumber, String locationId, Location location) {
        Query query = new Query(Criteria.where("policyNumber").is(policyNumber)
                .and("locations.locationId").is(locationId));
        Update update = new Update()
                .set("locations.$.address", location.getAddress())
                .currentDate("updatedAt");
        UpdateResult result = mongoTemplate.updateFirst(query, update, Policy.class);
        return result.getModifiedCount() > 0;
    }

    @Override
    public boolean removeLocation(String policyNumber, String locationId) {
        Query query = new Query(Criteria.where("policyNumber").is(policyNumber));
        Update update = new Update()
                .pull("locations", new Query(Criteria.where("locationId").is(locationId)))
                .currentDate("updatedAt");
        UpdateResult result = mongoTemplate.updateFirst(query, update, Policy.class);
        return result.getModifiedCount() > 0;
    }

    @Override
    public boolean addCoverage(String policyNumber, String locationId, Coverage coverage) {
        Query query = new Query(Criteria.where("policyNumber").is(policyNumber)
                .and("locations.locationId").is(locationId));
        Update update = new Update()
                .push("locations.$.coverages", coverage)
                .currentDate("updatedAt");
        UpdateResult result = mongoTemplate.updateFirst(query, update, Policy.class);
        return result.getModifiedCount() > 0;
    }

    @Override
    public boolean updateCoverage(String policyNumber, String locationId, String coverageCode, Coverage coverage) {
        Query query = new Query(Criteria.where("policyNumber").is(policyNumber));
        Update update = new Update()
                .set("locations.$[loc].coverages.$[cov].coverageName", coverage.getCoverageName())
                .set("locations.$[loc].coverages.$[cov].limit", coverage.getLimit())
                .set("locations.$[loc].coverages.$[cov].deductible", coverage.getDeductible())
                .set("locations.$[loc].coverages.$[cov].premium", coverage.getPremium())
                .filterArray(Criteria.where("loc.locationId").is(locationId))
                .filterArray(Criteria.where("cov.coverageCode").is(coverageCode))
                .currentDate("updatedAt");
        UpdateResult result = mongoTemplate.updateFirst(query, update, Policy.class);
        return result.getModifiedCount() > 0;
    }

    @Override
    public boolean removeCoverage(String policyNumber, String locationId, String coverageCode) {
        Query query = new Query(Criteria.where("policyNumber").is(policyNumber)
                .and("locations.locationId").is(locationId));
        Update update = new Update()
                .pull("locations.$.coverages", new Query(Criteria.where("coverageCode").is(coverageCode)))
                .currentDate("updatedAt");
        UpdateResult result = mongoTemplate.updateFirst(query, update, Policy.class);
        return result.getModifiedCount() > 0;
    }
}
