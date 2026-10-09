package com.dungphd.insurance.service.impl;

import com.dungphd.insurance.dto.request.ClaimStatusTransitionRequest;
import com.dungphd.insurance.dto.request.CreateClaimRequest;
import com.dungphd.insurance.dto.response.ClaimResponse;
import com.dungphd.insurance.dto.response.PageResponse;
import com.dungphd.insurance.exception.InvalidRequestException;
import com.dungphd.insurance.exception.ResourceNotFoundException;
import com.dungphd.insurance.model.Claim;
import com.dungphd.insurance.model.ClaimDocument;
import com.dungphd.insurance.model.ClaimStatus;
import com.dungphd.insurance.model.Policy;
import com.dungphd.insurance.model.PolicyStatus;
import com.dungphd.insurance.repository.ClaimRepository;
import com.dungphd.insurance.repository.PolicyRepository;
import com.dungphd.insurance.service.ClaimService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimServiceImpl implements ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyRepository policyRepository;
    private final MongoTemplate mongoTemplate;

    // ==========================================
    // Helpers: current user from JWT principal
    // ==========================================

    private String currentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.getName() != null) ? auth.getName() : "System";
    }

    private boolean currentUserIsAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private String generateClaimNumber() {
        String number;
        int year = java.time.LocalDate.now().getYear();
        do {
            number = String.format("CLM-%d-%06d", year, ThreadLocalRandom.current().nextInt(100000, 999999));
        } while (claimRepository.existsByClaimNumber(number));
        return number;
    }

    private Claim findClaimOrThrow(String claimNumber) {
        return claimRepository.findByClaimNumber(claimNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with number: " + claimNumber));
    }

    /** Non-admin chỉ được thao tác trên claim do chính mình tạo. */
    private void checkOwnership(Claim claim) {
        if (!currentUserIsAdmin() && !currentUserEmail().equals(claim.getCreatedBy())) {
            throw new InvalidRequestException("You do not have permission to access this claim.");
        }
    }

    // ==========================================
    // ClaimService implementation
    // ==========================================

    @Override
    public ClaimResponse createClaim(CreateClaimRequest request) {
        Policy policy = policyRepository.findByPolicyNumber(request.getPolicyNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with number: " + request.getPolicyNumber()));

        if (policy.getStatus() != PolicyStatus.ACTIVE) {
            throw new InvalidRequestException("Claims can only be submitted for ACTIVE policies. Policy "
                    + request.getPolicyNumber() + " is currently " + policy.getStatus() + ".");
        }

        Claim claim = Claim.builder()
                .claimNumber(generateClaimNumber())
                .policyId(policy.getId())
                .policyNumber(policy.getPolicyNumber())
                .claimantName(request.getClaimantName())
                .claimantPhone(request.getClaimantPhone())
                .claimantEmail(request.getClaimantEmail())
                .incidentDate(request.getIncidentDate())
                .description(request.getDescription())
                .claimAmount(request.getClaimAmount())
                .status(ClaimStatus.SUBMITTED)
                .documents(new ArrayList<>())
                .createdBy(currentUserEmail())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return mapToClaimResponse(claimRepository.save(claim));
    }

    @Override
    public PageResponse<ClaimResponse> listClaims(ClaimStatus status, String policyNumber, String search,
                                                  int page, int size) {
        List<Criteria> criteriaList = new ArrayList<>();

        // Non-admin chỉ thấy claim của chính mình
        if (!currentUserIsAdmin()) {
            criteriaList.add(Criteria.where("createdBy").is(currentUserEmail()));
        }
        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }
        if (policyNumber != null && !policyNumber.isBlank()) {
            criteriaList.add(Criteria.where("policyNumber").regex(policyNumber, "i"));
        }
        if (search != null && !search.isBlank()) {
            criteriaList.add(new Criteria().orOperator(
                    Criteria.where("claimNumber").regex(search, "i"),
                    Criteria.where("claimantName").regex(search, "i"),
                    Criteria.where("description").regex(search, "i")));
        }

        Criteria criteria = criteriaList.isEmpty() ? new Criteria()
                : new Criteria().andOperator(criteriaList.toArray(new Criteria[0]));

        long total = mongoTemplate.count(Query.query(criteria), Claim.class);

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Claim> claims = mongoTemplate.find(Query.query(criteria).with(pageable), Claim.class);

        List<ClaimResponse> content = claims.stream()
                .map(this::mapToClaimResponse)
                .collect(Collectors.toList());

        int totalPages = (int) Math.ceil((double) total / pageable.getPageSize());
        int pageNum = pageable.getPageNumber();
        return PageResponse.<ClaimResponse>builder()
                .content(content)
                .pageNumber(pageNum)
                .pageSize(pageable.getPageSize())
                .totalElements(total)
                .totalPages(totalPages)
                .isFirst(pageNum == 0)
                .isLast(totalPages == 0 || pageNum >= totalPages - 1)
                .build();
    }

    @Override
    public ClaimResponse getClaim(String claimNumber) {
        Claim claim = findClaimOrThrow(claimNumber);
        checkOwnership(claim);
        return mapToClaimResponse(claim);
    }

    @Override
    public ClaimResponse transitionStatus(String claimNumber, ClaimStatusTransitionRequest request) {
        Claim claim = findClaimOrThrow(claimNumber);
        checkOwnership(claim);

        ClaimStatus target = request.getTargetStatus();
        if (!claim.getStatus().canTransitionTo(target)) {
            throw new InvalidRequestException("Cannot transition claim from " + claim.getStatus()
                    + " to " + target + ".");
        }

        boolean isAdmin = currentUserIsAdmin();
        if (target == ClaimStatus.CANCELLED) {
            // Khách hàng chỉ được hủy claim của mình khi còn ở trạng thái đã gửi
            if (isAdmin) {
                throw new InvalidRequestException("Admins cannot cancel claims; cancellation is reserved for the claimant.");
            }
        } else {
            // Các bước thẩm định / duyệt / chi trả chỉ dành cho admin
            if (!isAdmin) {
                throw new InvalidRequestException("Only administrators can move claims to " + target + ".");
            }
        }

        claim.setStatus(target);
        if (request.getReviewerNote() != null && !request.getReviewerNote().isBlank()) {
            claim.setReviewerNote(request.getReviewerNote());
        }
        claim.setUpdatedAt(Instant.now());

        return mapToClaimResponse(claimRepository.save(claim));
    }

    @Override
    public ClaimResponse addDocument(String claimNumber, String fileName, String fileUrl) {
        Claim claim = findClaimOrThrow(claimNumber);
        checkOwnership(claim);

        if (claim.getStatus() == ClaimStatus.PAID || claim.getStatus() == ClaimStatus.REJECTED
                || claim.getStatus() == ClaimStatus.CANCELLED) {
            throw new InvalidRequestException("Cannot add documents to a claim in " + claim.getStatus() + " status.");
        }
        if (fileName == null || fileName.isBlank()) {
            throw new InvalidRequestException("File name is required.");
        }

        if (claim.getDocuments() == null) {
            claim.setDocuments(new ArrayList<>());
        }
        claim.getDocuments().add(ClaimDocument.builder()
                .fileName(fileName)
                .fileUrl(fileUrl)
                .uploadedAt(Instant.now())
                .build());
        claim.setUpdatedAt(Instant.now());

        return mapToClaimResponse(claimRepository.save(claim));
    }

    private ClaimResponse mapToClaimResponse(Claim claim) {
        return ClaimResponse.builder()
                .id(claim.getId())
                .claimNumber(claim.getClaimNumber())
                .policyId(claim.getPolicyId())
                .policyNumber(claim.getPolicyNumber())
                .claimantName(claim.getClaimantName())
                .claimantPhone(claim.getClaimantPhone())
                .claimantEmail(claim.getClaimantEmail())
                .incidentDate(claim.getIncidentDate())
                .description(claim.getDescription())
                .claimAmount(claim.getClaimAmount())
                .status(claim.getStatus())
                .documents(claim.getDocuments())
                .reviewerNote(claim.getReviewerNote())
                .createdBy(claim.getCreatedBy())
                .createdAt(claim.getCreatedAt())
                .updatedAt(claim.getUpdatedAt())
                .build();
    }
}
