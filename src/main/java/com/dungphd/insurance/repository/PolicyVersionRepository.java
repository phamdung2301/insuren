package com.dungphd.insurance.repository;

import com.dungphd.insurance.model.PolicyVersion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PolicyVersionRepository extends MongoRepository<PolicyVersion, String> {

    Optional<PolicyVersion> findByPolicyNumberAndVersion(String policyNumber, Integer version);

    List<PolicyVersion> findByPolicyNumberOrderByVersionDesc(String policyNumber);
}
