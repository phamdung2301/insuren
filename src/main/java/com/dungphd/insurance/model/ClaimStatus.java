package com.dungphd.insurance.model;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * ClaimStatus - Vòng đời yêu cầu bồi thường:
 * SUBMITTED -> UNDER_REVIEW -> APPROVED -> PAID
 *                              \-> REJECTED
 * SUBMITTED có thể CANCELLED (khách hàng tự hủy).
 */
public enum ClaimStatus {
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    PAID,
    CANCELLED;

    private static final Map<ClaimStatus, Set<ClaimStatus>> ALLOWED_TRANSITIONS = Map.of(
            SUBMITTED, EnumSet.of(UNDER_REVIEW, CANCELLED),
            UNDER_REVIEW, EnumSet.of(APPROVED, REJECTED),
            APPROVED, EnumSet.of(PAID),
            REJECTED, EnumSet.noneOf(ClaimStatus.class),
            PAID, EnumSet.noneOf(ClaimStatus.class),
            CANCELLED, EnumSet.noneOf(ClaimStatus.class)
    );

    public boolean canTransitionTo(ClaimStatus nextStatus) {
        if (nextStatus == null) return false;
        Set<ClaimStatus> validNext = ALLOWED_TRANSITIONS.get(this);
        return validNext != null && validNext.contains(nextStatus);
    }
}
