package com.dungphd.insurance.repository;

import com.dungphd.insurance.model.Policy;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PolicyRepository extends MongoRepository<Policy, String>, PolicyCustomRepository {

    Optional<Policy> findByPolicyNumber(String policyNumber);

    boolean existsByPolicyNumber(String policyNumber);

    void deleteByPolicyNumber(String policyNumber);
}
