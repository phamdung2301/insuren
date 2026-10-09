package com.dungphd.insurance.service.impl;

import com.dungphd.insurance.dto.CoverageDto;
import com.dungphd.insurance.dto.InsuredDto;
import com.dungphd.insurance.dto.LocationDto;
import com.dungphd.insurance.dto.request.CreatePolicyRequest;
import com.dungphd.insurance.dto.request.UpdatePolicyRequest;
import com.dungphd.insurance.dto.response.PolicyResponse;
import com.dungphd.insurance.exception.DuplicateResourceException;
import com.dungphd.insurance.exception.InvalidRequestException;
import com.dungphd.insurance.exception.ResourceNotFoundException;
import com.dungphd.insurance.model.*;
import com.dungphd.insurance.repository.PolicyRepository;
import com.dungphd.insurance.service.PolicyService;
import com.dungphd.insurance.service.PremiumCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.dungphd.insurance.dto.response.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.dungphd.insurance.dto.request.EndorsementRequest;
import com.dungphd.insurance.dto.request.StatusTransitionRequest;
import com.dungphd.insurance.dto.response.PolicyTransactionResponse;
import com.dungphd.insurance.dto.response.PolicyVersionResponse;
import com.dungphd.insurance.repository.PolicyTransactionRepository;
import com.dungphd.insurance.repository.PolicyVersionRepository;

@Service
@RequiredArgsConstructor
public class PolicyServiceImpl implements PolicyService {

    private final PolicyRepository policyRepository;
    private final PolicyVersionRepository policyVersionRepository;
    private final PolicyTransactionRepository policyTransactionRepository;
    private final MongoTemplate mongoTemplate;
    private final PremiumCalculationService premiumCalculationService;

    // ==========================================
    // 2.1 Policy Core CRUD (P01)
    // ==========================================

    @Override
    public PolicyResponse createPolicy(CreatePolicyRequest request) {
        if (policyRepository.existsByPolicyNumber(request.getPolicyNumber())) {
            throw new DuplicateResourceException("Policy with number " + request.getPolicyNumber() + " already exists.");
        }

        Policy policy = Policy.builder()
                .policyNumber(request.getPolicyNumber())
                .status(PolicyStatus.DRAFT)
                .insured(mapToInsured(request.getInsured()))
                .locations(request.getLocations() != null ?
                        request.getLocations().stream().map(this::mapToLocation).collect(Collectors.toList()) : new ArrayList<>())
                .effectiveDate(request.getEffectiveDate())
                .expirationDate(request.getExpirationDate())
                .version(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        policy.recalculateTotalPremium();
        Policy savedPolicy = policyRepository.save(policy);

        // Record initial Version Snapshot V1
        PolicyVersion initSnapshot = PolicyVersion.builder()
                .policyNumber(savedPolicy.getPolicyNumber())
                .version(1)
                .policySnapshot(savedPolicy)
                .createdBy("System")
                .createdAt(Instant.now())
                .build();
        policyVersionRepository.save(initSnapshot);

        // Record initial Transaction: CREATE_POLICY
        PolicyTransaction initTxn = PolicyTransaction.builder()
                .policyNumber(savedPolicy.getPolicyNumber())
                .version(1)
                .transactionType(TransactionType.CREATE_POLICY)
                .actor("System")
                .description("Created policy in DRAFT status. Initial total premium: $" + savedPolicy.getTotalPremium())
                .timestamp(Instant.now())
                .build();
        policyTransactionRepository.save(initTxn);

        return mapToPolicyResponse(savedPolicy);
    }

    @Override
    public PolicyResponse getPolicyByNumber(String policyNumber) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));
        return mapToPolicyResponse(policy);
    }

    @Override
    public PolicyResponse updatePolicy(String policyNumber, UpdatePolicyRequest request) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (policy.getStatus() == PolicyStatus.ACTIVE) {
            throw new InvalidRequestException("Direct modifications are not allowed on ACTIVE policies. Please use the Endorsement process to preserve historical integrity.");
        }
        if (policy.getStatus() == PolicyStatus.CANCELLED || policy.getStatus() == PolicyStatus.EXPIRED) {
            throw new InvalidRequestException("Cannot modify policy in " + policy.getStatus() + " status.");
        }

        if (request.getInsured() != null) {
            policy.setInsured(mapToInsured(request.getInsured()));
        }
        if (request.getEffectiveDate() != null) {
            policy.setEffectiveDate(request.getEffectiveDate());
        }
        if (request.getExpirationDate() != null) {
            policy.setExpirationDate(request.getExpirationDate());
        }

        policy.recalculateTotalPremium();
        Policy updatedPolicy = policyRepository.save(policy);

        PolicyTransaction txn = PolicyTransaction.builder()
                .policyNumber(policyNumber)
                .version(policy.getVersion())
                .transactionType(TransactionType.UPDATE_POLICY)
                .actor("System")
                .description("Updated policy terms in " + policy.getStatus() + " status")
                .timestamp(Instant.now())
                .build();
        policyTransactionRepository.save(txn);

        return mapToPolicyResponse(updatedPolicy);
    }

    @Override
    public void deletePolicy(String policyNumber) {
        if (!policyRepository.existsByPolicyNumber(policyNumber)) {
            throw new ResourceNotFoundException("Policy not found with number: " + policyNumber);
        }
        policyRepository.findByPolicyNumber(policyNumber).ifPresent(policy -> {
            if (policy.getStatus() != PolicyStatus.DRAFT) {
                throw new InvalidRequestException("Only policies in DRAFT status can be deleted. Current status is " + policy.getStatus());
            }
        });
        policyRepository.deleteByPolicyNumber(policyNumber);
    }

    // ==========================================
    // 2.2 Location Management (P04)
    // ==========================================

    @Override
    public PolicyResponse addLocation(String policyNumber, LocationDto locationDto) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (policy.getStatus() == PolicyStatus.ACTIVE) {
            throw new InvalidRequestException("Direct modifications are not allowed on ACTIVE policies. Please use the Endorsement process to add locations.");
        }
        if (policy.getStatus() == PolicyStatus.CANCELLED || policy.getStatus() == PolicyStatus.EXPIRED) {
            throw new InvalidRequestException("Cannot modify policy in " + policy.getStatus() + " status.");
        }

        boolean exists = policy.getLocations().stream()
                .anyMatch(loc -> loc.getLocationId().equalsIgnoreCase(locationDto.getLocationId()));
        if (exists) {
            throw new DuplicateResourceException("Location with ID " + locationDto.getLocationId() + " already exists in policy.");
        }

        Location location = mapToLocation(locationDto);
        boolean updated = policyRepository.addLocation(policyNumber, location);
        if (!updated) {
            throw new InvalidRequestException("Failed to add location to policy " + policyNumber);
        }

        recordTxn(policyNumber, policy.getVersion(), TransactionType.ADD_LOCATION, "Added location " + locationDto.getLocationId() + " (" + locationDto.getAddress() + ")");
        return syncAndGetUpdatedPolicy(policyNumber);
    }

    @Override
    public PolicyResponse updateLocation(String policyNumber, String locationId, LocationDto locationDto) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (policy.getStatus() == PolicyStatus.ACTIVE) {
            throw new InvalidRequestException("Direct modifications are not allowed on ACTIVE policies. Please use the Endorsement process to update locations.");
        }
        if (policy.getStatus() == PolicyStatus.CANCELLED || policy.getStatus() == PolicyStatus.EXPIRED) {
            throw new InvalidRequestException("Cannot modify policy in " + policy.getStatus() + " status.");
        }

        boolean exists = policy.getLocations().stream()
                .anyMatch(loc -> loc.getLocationId().equalsIgnoreCase(locationId));
        if (!exists) {
            throw new ResourceNotFoundException("Location not found with ID: " + locationId);
        }

        Location location = mapToLocation(locationDto);
        boolean updated = policyRepository.updateLocation(policyNumber, locationId, location);
        if (!updated) {
            throw new InvalidRequestException("Failed to update location " + locationId);
        }

        recordTxn(policyNumber, policy.getVersion(), TransactionType.UPDATE_LOCATION, "Updated location " + locationId + " address to " + locationDto.getAddress());
        return syncAndGetUpdatedPolicy(policyNumber);
    }

    @Override
    public PolicyResponse removeLocation(String policyNumber, String locationId) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (policy.getStatus() == PolicyStatus.ACTIVE) {
            throw new InvalidRequestException("Direct modifications are not allowed on ACTIVE policies. Please use the Endorsement process to remove locations.");
        }
        if (policy.getStatus() == PolicyStatus.CANCELLED || policy.getStatus() == PolicyStatus.EXPIRED) {
            throw new InvalidRequestException("Cannot modify policy in " + policy.getStatus() + " status.");
        }

        boolean exists = policy.getLocations().stream()
                .anyMatch(loc -> loc.getLocationId().equalsIgnoreCase(locationId));
        if (!exists) {
            throw new ResourceNotFoundException("Location not found with ID: " + locationId);
        }

        boolean updated = policyRepository.removeLocation(policyNumber, locationId);
        if (!updated) {
            throw new InvalidRequestException("Failed to remove location " + locationId);
        }

        recordTxn(policyNumber, policy.getVersion(), TransactionType.REMOVE_LOCATION, "Removed location " + locationId);
        return syncAndGetUpdatedPolicy(policyNumber);
    }

    // ==========================================
    // 2.3 Coverage Management (P05)
    // ==========================================

    @Override
    public PolicyResponse addCoverage(String policyNumber, String locationId, CoverageDto coverageDto) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (policy.getStatus() == PolicyStatus.ACTIVE) {
            throw new InvalidRequestException("Direct modifications are not allowed on ACTIVE policies. Please use the Endorsement process to add coverages.");
        }
        if (policy.getStatus() == PolicyStatus.CANCELLED || policy.getStatus() == PolicyStatus.EXPIRED) {
            throw new InvalidRequestException("Cannot modify policy in " + policy.getStatus() + " status.");
        }

        Location location = policy.getLocations().stream()
                .filter(loc -> loc.getLocationId().equalsIgnoreCase(locationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with ID: " + locationId));

        boolean covExists = location.getCoverages() != null && location.getCoverages().stream()
                .anyMatch(c -> c.getCoverageCode().equalsIgnoreCase(coverageDto.getCoverageCode()));
        if (covExists) {
            throw new DuplicateResourceException("Coverage code " + coverageDto.getCoverageCode() + " already exists in location " + locationId);
        }

        Coverage coverage = mapToCoverage(coverageDto);
        boolean updated = policyRepository.addCoverage(policyNumber, locationId, coverage);
        if (!updated) {
            throw new InvalidRequestException("Failed to add coverage to location " + locationId);
        }

        recordTxn(policyNumber, policy.getVersion(), TransactionType.ADD_COVERAGE,
                "Added coverage " + coverageDto.getCoverageCode() + " to location " + locationId + " ($" + coverage.getPremium() + ")");
        return syncAndGetUpdatedPolicy(policyNumber);
    }

    @Override
    public PolicyResponse updateCoverage(String policyNumber, String locationId, String coverageCode, CoverageDto coverageDto) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (policy.getStatus() == PolicyStatus.ACTIVE) {
            throw new InvalidRequestException("Direct modifications are not allowed on ACTIVE policies. Please use the Endorsement process to update coverages.");
        }
        if (policy.getStatus() == PolicyStatus.CANCELLED || policy.getStatus() == PolicyStatus.EXPIRED) {
            throw new InvalidRequestException("Cannot modify policy in " + policy.getStatus() + " status.");
        }

        Location location = policy.getLocations().stream()
                .filter(loc -> loc.getLocationId().equalsIgnoreCase(locationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with ID: " + locationId));

        boolean covExists = location.getCoverages() != null && location.getCoverages().stream()
                .anyMatch(c -> c.getCoverageCode().equalsIgnoreCase(coverageCode));
        if (!covExists) {
            throw new ResourceNotFoundException("Coverage not found with code: " + coverageCode + " in location " + locationId);
        }

        Coverage coverage = mapToCoverage(coverageDto);
        boolean updated = policyRepository.updateCoverage(policyNumber, locationId, coverageCode, coverage);
        if (!updated) {
            throw new InvalidRequestException("Failed to update coverage " + coverageCode);
        }

        recordTxn(policyNumber, policy.getVersion(), TransactionType.UPDATE_COVERAGE,
                "Updated coverage " + coverageCode + " in location " + locationId);
        return syncAndGetUpdatedPolicy(policyNumber);
    }

    @Override
    public PolicyResponse removeCoverage(String policyNumber, String locationId, String coverageCode) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (policy.getStatus() == PolicyStatus.ACTIVE) {
            throw new InvalidRequestException("Direct modifications are not allowed on ACTIVE policies. Please use the Endorsement process to remove coverages.");
        }
        if (policy.getStatus() == PolicyStatus.CANCELLED || policy.getStatus() == PolicyStatus.EXPIRED) {
            throw new InvalidRequestException("Cannot modify policy in " + policy.getStatus() + " status.");
        }

        Location location = policy.getLocations().stream()
                .filter(loc -> loc.getLocationId().equalsIgnoreCase(locationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with ID: " + locationId));

        boolean covExists = location.getCoverages() != null && location.getCoverages().stream()
                .anyMatch(c -> c.getCoverageCode().equalsIgnoreCase(coverageCode));
        if (!covExists) {
            throw new ResourceNotFoundException("Coverage not found with code: " + coverageCode + " in location " + locationId);
        }

        boolean updated = policyRepository.removeCoverage(policyNumber, locationId, coverageCode);
        if (!updated) {
            throw new InvalidRequestException("Failed to remove coverage " + coverageCode);
        }

        recordTxn(policyNumber, policy.getVersion(), TransactionType.REMOVE_COVERAGE,
                "Removed coverage " + coverageCode + " from location " + locationId);
        return syncAndGetUpdatedPolicy(policyNumber);
    }

    // ==========================================
    // 2.4 Dynamic Search, Filter, Page & Sort (P02, P03)
    // ==========================================

    @Override
    public PageResponse<PolicyResponse> searchPolicies(
            String policyNumber,
            PolicyStatus status,
            String insuredName,
            Instant effectiveFrom,
            Instant effectiveTo,
            Double minPremium,
            Double maxPremium,
            int page,
            int size,
            String sortBy,
            String sortDirection) {

        Criteria criteria = new Criteria();
        List<Criteria> criteriaList = new ArrayList<>();

        if (policyNumber != null && !policyNumber.isBlank()) {
            criteriaList.add(Criteria.where("policyNumber").regex(policyNumber, "i"));
        }
        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }
        if (insuredName != null && !insuredName.isBlank()) {
            criteriaList.add(Criteria.where("insured.name").regex(insuredName, "i"));
        }
        if (effectiveFrom != null && effectiveTo != null) {
            criteriaList.add(Criteria.where("effectiveDate").gte(effectiveFrom).lte(effectiveTo));
        } else if (effectiveFrom != null) {
            criteriaList.add(Criteria.where("effectiveDate").gte(effectiveFrom));
        } else if (effectiveTo != null) {
            criteriaList.add(Criteria.where("effectiveDate").lte(effectiveTo));
        }
        if (minPremium != null && maxPremium != null) {
            criteriaList.add(Criteria.where("totalPremium").gte(minPremium).lte(maxPremium));
        } else if (minPremium != null) {
            criteriaList.add(Criteria.where("totalPremium").gte(minPremium));
        } else if (maxPremium != null) {
            criteriaList.add(Criteria.where("totalPremium").lte(maxPremium));
        }

        if (!criteriaList.isEmpty()) {
            criteria.andOperator(criteriaList.toArray(new Criteria[0]));
        }

        Query query = Query.query(criteria);

        long totalElements = mongoTemplate.count(query, Policy.class);

        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = (sortBy != null && !sortBy.isBlank()) ? sortBy : "updatedAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        query.with(pageable);
        List<Policy> policies = mongoTemplate.find(query, Policy.class);

        List<PolicyResponse> content = policies.stream()
                .map(this::mapToPolicyResponse)
                .collect(Collectors.toList());

        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;

        return PageResponse.<PolicyResponse>builder()
                .content(content)
                .pageNumber(page)
                .pageSize(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .isFirst(page == 0)
                .isLast(totalPages == 0 || page >= totalPages - 1)
                .build();
    }

    // ==========================================
    // 3.1 Policy Lifecycle State Machine (P06)
    // ==========================================

    @Override
    public PolicyResponse transitionStatus(String policyNumber, StatusTransitionRequest request) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        PolicyStatus currentStatus = policy.getStatus();
        PolicyStatus targetStatus = request.getTargetStatus();

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new InvalidRequestException(
                    "Invalid status transition from " + currentStatus + " to " + targetStatus);
        }

        policy.setStatus(targetStatus);

        if (targetStatus == PolicyStatus.BOUND) {
            policy.setBoundDate(Instant.now());
            if (request.getPaymentDueDate() != null) {
                policy.setPaymentDueDate(request.getPaymentDueDate());
            } else {
                policy.setPaymentDueDate(Instant.now().plus(7, java.time.temporal.ChronoUnit.DAYS));
            }
        } else if (targetStatus == PolicyStatus.ACTIVE) {
            if (policy.getEffectiveDate() == null) {
                policy.setEffectiveDate(Instant.now());
            }
            if (policy.getExpirationDate() == null) {
                policy.setExpirationDate(Instant.now().plus(365, java.time.temporal.ChronoUnit.DAYS));
            }
        }

        Policy savedPolicy = policyRepository.save(policy);

        TransactionType txnType = TransactionType.STATUS_TRANSITION;
        if (targetStatus == PolicyStatus.CANCELLED) {
            txnType = TransactionType.CANCEL_POLICY;
        } else if (targetStatus == PolicyStatus.EXPIRED) {
            txnType = TransactionType.EXPIRE_POLICY;
        }

        String actor = (request.getActor() != null && !request.getActor().isBlank()) ? request.getActor() : "System";
        String description = "Status transitioned from " + currentStatus + " to " + targetStatus +
                (request.getReason() != null ? ". Reason: " + request.getReason() : "");

        PolicyTransaction transaction = PolicyTransaction.builder()
                .policyNumber(policyNumber)
                .version(savedPolicy.getVersion())
                .transactionType(txnType)
                .actor(actor)
                .description(description)
                .build();
        policyTransactionRepository.save(transaction);

        return mapToPolicyResponse(savedPolicy);
    }

    // ==========================================
    // 3.2 Endorsement & History Versioning (P07, P08)
    // ==========================================

    @Override
    public PolicyResponse endorsePolicy(String policyNumber, EndorsementRequest request) {
        Policy policy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (policy.getStatus() != PolicyStatus.ACTIVE) {
            throw new InvalidRequestException(
                    "Endorsement is only allowed on ACTIVE policies. Current status is " + policy.getStatus());
        }

        // Save snapshot of current version if not already present
        if (!policyVersionRepository.findByPolicyNumberAndVersion(policyNumber, policy.getVersion()).isPresent()) {
            PolicyVersion currentSnapshot = PolicyVersion.builder()
                    .policyNumber(policyNumber)
                    .version(policy.getVersion())
                    .policySnapshot(policy)
                    .createdBy(request.getActor() != null ? request.getActor() : "System")
                    .createdAt(Instant.now())
                    .build();
            policyVersionRepository.save(currentSnapshot);
        }

        double oldPremium = policy.getTotalPremium() != null ? policy.getTotalPremium() : 0.0;

        // Apply changes if full payload provided
        if (request.getInsured() != null) {
            policy.setInsured(mapToInsured(request.getInsured()));
        }

        if (request.getLocations() != null && !request.getLocations().isEmpty()) {
            policy.setLocations(request.getLocations().stream().map(this::mapToLocation).collect(Collectors.toList()));
        }

        // Granular actions
        String typeStr = request.getEndorsementType() != null ? request.getEndorsementType().toUpperCase() : "GENERAL";
        TransactionType txnType = TransactionType.ENDORSEMENT;

        if ("ADD_COVERAGE".equalsIgnoreCase(typeStr) && request.getCoverage() != null && request.getLocationId() != null) {
            Coverage cov = mapToCoverage(request.getCoverage());
            policy.getLocations().stream()
                    .filter(loc -> loc.getLocationId().equalsIgnoreCase(request.getLocationId()))
                    .findFirst()
                    .ifPresent(loc -> {
                        if (loc.getCoverages() == null) loc.setCoverages(new ArrayList<>());
                        loc.getCoverages().removeIf(c -> c.getCoverageCode().equalsIgnoreCase(cov.getCoverageCode()));
                        loc.getCoverages().add(cov);
                    });
            txnType = TransactionType.ADD_COVERAGE;
        } else if ("REMOVE_COVERAGE".equalsIgnoreCase(typeStr) && request.getCoverageCode() != null && request.getLocationId() != null) {
            policy.getLocations().stream()
                    .filter(loc -> loc.getLocationId().equalsIgnoreCase(request.getLocationId()))
                    .findFirst()
                    .ifPresent(loc -> {
                        if (loc.getCoverages() != null) {
                            loc.getCoverages().removeIf(c -> c.getCoverageCode().equalsIgnoreCase(request.getCoverageCode()));
                        }
                    });
            txnType = TransactionType.REMOVE_COVERAGE;
        } else if ("ADD_LOCATION".equalsIgnoreCase(typeStr) && request.getLocationId() != null) {
            Location newLoc = Location.builder()
                    .locationId(request.getLocationId())
                    .address(request.getEffectiveDescription())
                    .coverages(new ArrayList<>())
                    .build();
            policy.getLocations().add(newLoc);
            txnType = TransactionType.ADD_LOCATION;
        }

        policy.recalculateTotalPremium();
        double newPremium = policy.getTotalPremium() != null ? policy.getTotalPremium() : 0.0;
        double premiumChange = Math.round((newPremium - oldPremium) * 100.0) / 100.0;

        // Increment version for Endorsement
        policy.setVersion(policy.getVersion() + 1);
        policy.setUpdatedAt(Instant.now());
        Policy savedPolicy = policyRepository.save(policy);

        String actor = (request.getActor() != null && !request.getActor().isBlank()) ? request.getActor() : "Underwriter/Customer";

        // Save snapshot of new version
        PolicyVersion newSnapshot = PolicyVersion.builder()
                .policyNumber(policyNumber)
                .version(savedPolicy.getVersion())
                .policySnapshot(savedPolicy)
                .createdBy(actor)
                .createdAt(Instant.now())
                .build();
        policyVersionRepository.save(newSnapshot);

        // Record Endorsement Transaction
        String desc = request.getEffectiveDescription();
        if (premiumChange != 0) {
            desc += " (Premium Change: " + (premiumChange > 0 ? "+$" : "-$") + Math.abs(premiumChange) + " USD)";
        }

        PolicyTransaction transaction = PolicyTransaction.builder()
                .policyNumber(policyNumber)
                .version(savedPolicy.getVersion())
                .transactionType(txnType)
                .actor(actor)
                .description(desc)
                .timestamp(Instant.now())
                .build();
        policyTransactionRepository.save(transaction);

        return mapToPolicyResponse(savedPolicy);
    }

    // ==========================================
    // 3.4 History & Version Queries (P08)
    // ==========================================

    @Override
    public List<PolicyTransactionResponse> getPolicyHistory(String policyNumber) {
        if (!policyRepository.existsByPolicyNumber(policyNumber)) {
            throw new ResourceNotFoundException("Policy not found with number: " + policyNumber);
        }

        List<PolicyTransaction> transactions = policyTransactionRepository.findByPolicyNumberOrderByTimestampDesc(policyNumber);
        return transactions.stream()
                .map(txn -> PolicyTransactionResponse.builder()
                        .id(txn.getId())
                        .policyNumber(txn.getPolicyNumber())
                        .version(txn.getVersion())
                        .transactionType(txn.getTransactionType())
                        .actor(txn.getActor())
                        .description(txn.getDescription())
                        .timestamp(txn.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<PolicyVersionResponse> getAllPolicyVersions(String policyNumber) {
        if (!policyRepository.existsByPolicyNumber(policyNumber)) {
            throw new ResourceNotFoundException("Policy not found with number: " + policyNumber);
        }

        List<PolicyVersion> versions = policyVersionRepository.findByPolicyNumberOrderByVersionDesc(policyNumber);
        return versions.stream()
                .map(pv -> PolicyVersionResponse.builder()
                        .id(pv.getId())
                        .policyNumber(pv.getPolicyNumber())
                        .version(pv.getVersion())
                        .status(pv.getPolicySnapshot() != null && pv.getPolicySnapshot().getStatus() != null ? pv.getPolicySnapshot().getStatus().name() : null)
                        .totalPremium(pv.getPolicySnapshot() != null ? pv.getPolicySnapshot().getTotalPremium() : null)
                        .policySnapshot(mapToPolicyResponse(pv.getPolicySnapshot()))
                        .createdBy(pv.getCreatedBy())
                        .createdAt(pv.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public PolicyVersionResponse getPolicyVersion(String policyNumber, Integer version) {
        PolicyVersion policyVersion = policyVersionRepository.findByPolicyNumberAndVersion(policyNumber, version)
                .orElseThrow(() -> new ResourceNotFoundException("Version " + version + " not found for policy " + policyNumber));

        return PolicyVersionResponse.builder()
                .id(policyVersion.getId())
                .policyNumber(policyVersion.getPolicyNumber())
                .version(policyVersion.getVersion())
                .status(policyVersion.getPolicySnapshot() != null && policyVersion.getPolicySnapshot().getStatus() != null ? policyVersion.getPolicySnapshot().getStatus().name() : null)
                .totalPremium(policyVersion.getPolicySnapshot() != null ? policyVersion.getPolicySnapshot().getTotalPremium() : null)
                .policySnapshot(mapToPolicyResponse(policyVersion.getPolicySnapshot()))
                .createdBy(policyVersion.getCreatedBy())
                .createdAt(policyVersion.getCreatedAt())
                .build();
    }

    // ==========================================
    // Helper & Mapping Methods
    // ==========================================

    private PolicyResponse syncAndGetUpdatedPolicy(String policyNumber) {
        Policy freshPolicy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));
        freshPolicy.recalculateTotalPremium();
        Policy saved = policyRepository.save(freshPolicy);
        return mapToPolicyResponse(saved);
    }

    // ==========================================
    // Feature: Renewal (tái tục hợp đồng)
    // ==========================================

    @Override
    public PolicyResponse renewPolicy(String policyNumber, String actor) {
        Policy oldPolicy = policyRepository.findByPolicyNumber(policyNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + policyNumber));

        if (oldPolicy.getStatus() != PolicyStatus.ACTIVE && oldPolicy.getStatus() != PolicyStatus.EXPIRED) {
            throw new InvalidRequestException("Only ACTIVE or EXPIRED policies can be renewed. Policy "
                    + policyNumber + " is currently " + oldPolicy.getStatus() + ".");
        }

        String newPolicyNumber = generatePolicyNumber();
        Instant now = Instant.now();
        Instant newEffective = (oldPolicy.getExpirationDate() != null && oldPolicy.getExpirationDate().isAfter(now))
                ? oldPolicy.getExpirationDate()
                : now;
        Instant newExpiration = newEffective.plus(365, java.time.temporal.ChronoUnit.DAYS);

        // Deep-copy locations & coverages (locationId mới để tránh trùng)
        List<Location> newLocations = oldPolicy.getLocations() != null
                ? oldPolicy.getLocations().stream()
                        .map(loc -> Location.builder()
                                .locationId("LOC-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                                .address(loc.getAddress())
                                .coverages(loc.getCoverages() != null
                                        ? loc.getCoverages().stream()
                                                .map(cov -> Coverage.builder()
                                                        .coverageCode(cov.getCoverageCode())
                                                        .coverageName(cov.getCoverageName())
                                                        .coverageType(cov.getCoverageType())
                                                        .limit(cov.getLimit())
                                                        .deductible(cov.getDeductible())
                                                        .termMonths(cov.getTermMonths())
                                                        .baseRate(cov.getBaseRate())
                                                        .premium(cov.getPremium())
                                                        .build())
                                                .collect(Collectors.toList())
                                        : new ArrayList<>())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        Insured oldInsured = oldPolicy.getInsured();
        Insured newInsured = oldInsured != null ? Insured.builder()
                .insuredId(oldInsured.getInsuredId())
                .name(oldInsured.getName())
                .type(oldInsured.getType())
                .email(oldInsured.getEmail())
                .phone(oldInsured.getPhone())
                .address(oldInsured.getAddress())
                .build() : null;

        Policy renewed = Policy.builder()
                .policyNumber(newPolicyNumber)
                .status(PolicyStatus.DRAFT)
                .insured(newInsured)
                .locations(newLocations)
                .effectiveDate(newEffective)
                .expirationDate(newExpiration)
                .version(1)
                .renewedFromPolicyNumber(oldPolicy.getPolicyNumber())
                .createdAt(now)
                .updatedAt(now)
                .build();
        renewed.recalculateTotalPremium();
        Policy saved = policyRepository.save(renewed);

        // Snapshot V1 cho HĐ mới
        PolicyVersion initSnapshot = PolicyVersion.builder()
                .policyNumber(saved.getPolicyNumber())
                .version(1)
                .policySnapshot(saved)
                .createdBy(actor != null ? actor : "System")
                .createdAt(Instant.now())
                .build();
        policyVersionRepository.save(initSnapshot);

        // Ghi transaction cho cả 2 HĐ
        recordTxnWithActor(saved.getPolicyNumber(), 1, TransactionType.RENEW_POLICY,
                "Renewed from policy " + oldPolicy.getPolicyNumber() + ". New draft created.", actor);
        recordTxnWithActor(oldPolicy.getPolicyNumber(), oldPolicy.getVersion(), TransactionType.RENEW_POLICY,
                "Policy renewed into new draft " + saved.getPolicyNumber() + ".", actor);

        return mapToPolicyResponse(saved);
    }

    @Override
    public java.util.List<PolicyResponse> getExpiringPolicies(int days) {
        int d = Math.max(days, 1);
        Instant now = Instant.now();
        Instant cutoff = now.plus(d, java.time.temporal.ChronoUnit.DAYS);
        Criteria criteria = new Criteria().andOperator(
                Criteria.where("status").is(PolicyStatus.ACTIVE),
                Criteria.where("expirationDate").gte(now).lte(cutoff));
        Query query = Query.query(criteria).with(Sort.by(Sort.Direction.ASC, "expirationDate"));
        return mongoTemplate.find(query, Policy.class).stream()
                .map(this::mapToPolicyResponse)
                .collect(Collectors.toList());
    }

    private String generatePolicyNumber() {
        String number;
        int year = java.time.LocalDate.now().getYear();
        do {
            number = String.format("POL-%d-%06d", year,
                    java.util.concurrent.ThreadLocalRandom.current().nextInt(100000, 999999));
        } while (policyRepository.existsByPolicyNumber(number));
        return number;
    }

    private void recordTxnWithActor(String policyNumber, Integer version, TransactionType type,
                                    String description, String actor) {
        PolicyTransaction txn = PolicyTransaction.builder()
                .policyNumber(policyNumber)
                .version(version)
                .transactionType(type)
                .actor(actor != null ? actor : "System")
                .description(description)
                .timestamp(Instant.now())
                .build();
        policyTransactionRepository.save(txn);
    }

    private PolicyResponse mapToPolicyResponse(Policy policy) {
        return PolicyResponse.builder()
                .id(policy.getId())
                .policyNumber(policy.getPolicyNumber())
                .status(policy.getStatus())
                .insured(mapToInsuredDto(policy.getInsured()))
                .locations(policy.getLocations() != null ?
                        policy.getLocations().stream().map(this::mapToLocationDto).collect(Collectors.toList()) : new ArrayList<>())
                .totalPremium(policy.getTotalPremium())
                .effectiveDate(policy.getEffectiveDate())
                .expirationDate(policy.getExpirationDate())
                .boundDate(policy.getBoundDate())
                .paymentDueDate(policy.getPaymentDueDate())
                .version(policy.getVersion())
                .createdAt(policy.getCreatedAt())
                .updatedAt(policy.getUpdatedAt())
                .build();
    }

    private void recordTxn(String policyNumber, Integer version, TransactionType type, String description) {
        PolicyTransaction txn = PolicyTransaction.builder()
                .policyNumber(policyNumber)
                .version(version)
                .transactionType(type)
                .actor("System")
                .description(description)
                .timestamp(Instant.now())
                .build();
        policyTransactionRepository.save(txn);
    }

    private Insured mapToInsured(InsuredDto dto) {
        if (dto == null) return null;
        return Insured.builder()
                .insuredId(dto.getInsuredId() != null && !dto.getInsuredId().isBlank() ? dto.getInsuredId() : "INS-" + (1000 + (int)(Math.random() * 9000)))
                .name(dto.getName())
                .type(dto.getType() != null && !dto.getType().isBlank() ? dto.getType() : "BUSINESS")
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .build();
    }

    private InsuredDto mapToInsuredDto(Insured entity) {
        if (entity == null) return null;
        return InsuredDto.builder()
                .insuredId(entity.getInsuredId())
                .name(entity.getName())
                .type(entity.getType() != null ? entity.getType() : "BUSINESS")
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .address(entity.getAddress())
                .build();
    }

    private Location mapToLocation(LocationDto dto) {
        if (dto == null) return null;
        return Location.builder()
                .locationId(dto.getLocationId())
                .address(dto.getAddress())
                .coverages(dto.getCoverages() != null ?
                        dto.getCoverages().stream().map(this::mapToCoverage).collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }

    private LocationDto mapToLocationDto(Location entity) {
        if (entity == null) return null;
        return LocationDto.builder()
                .locationId(entity.getLocationId())
                .address(entity.getAddress())
                .coverages(entity.getCoverages() != null ?
                        entity.getCoverages().stream().map(this::mapToCoverageDto).collect(Collectors.toList()) : new ArrayList<>())
                .build();
    }

    private Coverage mapToCoverage(CoverageDto dto) {
        if (dto == null) return null;

        String name = (dto.getCoverageName() != null && !dto.getCoverageName().isBlank())
                ? dto.getCoverageName()
                : (dto.getCoverageCode() != null ? dto.getCoverageCode() : "Coverage");

        // Build coverage entity first
        Coverage coverage = Coverage.builder()
                .coverageCode(dto.getCoverageCode())
                .coverageName(name)
                .coverageType(dto.getCoverageType() != null ? dto.getCoverageType() : "STANDARD")
                .limit(dto.getLimit())
                .deductible(dto.getDeductible())
                .termMonths(dto.getTermMonths() != null ? dto.getTermMonths() : 12)
                .baseRate(dto.getBaseRate())
                .build();

        // Auto-calculate premium using PremiumCalculationService
        // If frontend explicitly provides premium AND it's > 0, use it (admin override)
        // Otherwise, calculate from the pricing matrix
        if (dto.getPremium() != null && dto.getPremium() > 0 && dto.getBaseRate() != null) {
            coverage.setPremium(dto.getPremium()); // admin-provided override
        } else {
            coverage.setPremium(premiumCalculationService.calculate(coverage)); // auto-calculate
        }

        return coverage;
    }

    private CoverageDto mapToCoverageDto(Coverage entity) {
        if (entity == null) return null;
        return CoverageDto.builder()
                .coverageCode(entity.getCoverageCode())
                .coverageName(entity.getCoverageName())
                .coverageType(entity.getCoverageType())
                .limit(entity.getLimit())
                .deductible(entity.getDeductible())
                .termMonths(entity.getTermMonths())
                .baseRate(entity.getBaseRate())
                .premium(entity.getPremium())
                .build();
    }
}
