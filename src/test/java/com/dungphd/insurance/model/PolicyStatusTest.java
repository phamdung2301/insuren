package com.dungphd.insurance.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PolicyStatusTest {

    @Test
    @DisplayName("DRAFT should only transition to QUOTED")
    void testDraftTransitions() {
        assertTrue(PolicyStatus.DRAFT.canTransitionTo(PolicyStatus.QUOTED));

        assertFalse(PolicyStatus.DRAFT.canTransitionTo(PolicyStatus.BOUND));
        assertFalse(PolicyStatus.DRAFT.canTransitionTo(PolicyStatus.ACTIVE));
        assertFalse(PolicyStatus.DRAFT.canTransitionTo(PolicyStatus.CANCELLED));
        assertFalse(PolicyStatus.DRAFT.canTransitionTo(PolicyStatus.EXPIRED));
    }

    @Test
    @DisplayName("QUOTED should transition to BOUND or back to DRAFT")
    void testQuotedTransitions() {
        assertTrue(PolicyStatus.QUOTED.canTransitionTo(PolicyStatus.BOUND));
        assertTrue(PolicyStatus.QUOTED.canTransitionTo(PolicyStatus.DRAFT));

        assertFalse(PolicyStatus.QUOTED.canTransitionTo(PolicyStatus.ACTIVE));
        assertFalse(PolicyStatus.QUOTED.canTransitionTo(PolicyStatus.CANCELLED));
        assertFalse(PolicyStatus.QUOTED.canTransitionTo(PolicyStatus.EXPIRED));
    }

    @Test
    @DisplayName("BOUND should transition to ACTIVE or back to DRAFT")
    void testBoundTransitions() {
        assertTrue(PolicyStatus.BOUND.canTransitionTo(PolicyStatus.ACTIVE));
        assertTrue(PolicyStatus.BOUND.canTransitionTo(PolicyStatus.DRAFT));

        assertFalse(PolicyStatus.BOUND.canTransitionTo(PolicyStatus.QUOTED));
        assertFalse(PolicyStatus.BOUND.canTransitionTo(PolicyStatus.CANCELLED));
        assertFalse(PolicyStatus.BOUND.canTransitionTo(PolicyStatus.EXPIRED));
    }

    @Test
    @DisplayName("ACTIVE should transition to CANCELLED or EXPIRED")
    void testActiveTransitions() {
        assertTrue(PolicyStatus.ACTIVE.canTransitionTo(PolicyStatus.CANCELLED));
        assertTrue(PolicyStatus.ACTIVE.canTransitionTo(PolicyStatus.EXPIRED));

        assertFalse(PolicyStatus.ACTIVE.canTransitionTo(PolicyStatus.DRAFT));
        assertFalse(PolicyStatus.ACTIVE.canTransitionTo(PolicyStatus.QUOTED));
        assertFalse(PolicyStatus.ACTIVE.canTransitionTo(PolicyStatus.BOUND));
    }

    @Test
    @DisplayName("CANCELLED and EXPIRED should be terminal states (no transitions allowed)")
    void testTerminalTransitions() {
        assertFalse(PolicyStatus.CANCELLED.canTransitionTo(PolicyStatus.ACTIVE));
        assertFalse(PolicyStatus.CANCELLED.canTransitionTo(PolicyStatus.DRAFT));

        assertFalse(PolicyStatus.EXPIRED.canTransitionTo(PolicyStatus.ACTIVE));
        assertFalse(PolicyStatus.EXPIRED.canTransitionTo(PolicyStatus.DRAFT));
    }

    @Test
    @DisplayName("Transitioning to null should return false")
    void testNullTransition() {
        assertFalse(PolicyStatus.DRAFT.canTransitionTo(null));
    }
}
