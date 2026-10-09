package com.dungphd.insurance.repository;

import com.dungphd.insurance.model.Claim;
import com.dungphd.insurance.model.ClaimStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ClaimRepository extends MongoRepository<Claim, String> {

    Optional<Claim> findByClaimNumber(String claimNumber);

    boolean existsByClaimNumber(String claimNumber);

    List<Claim> findByPolicyNumber(String policyNumber);

    List<Claim> findByCreatedBy(String createdBy);

    List<Claim> findByStatus(ClaimStatus status);
}
