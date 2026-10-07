package com.dungphd.insurance.repository;

import com.dungphd.insurance.model.Coverage;
import com.dungphd.insurance.model.Location;
import com.dungphd.insurance.model.Policy;
import com.mongodb.client.result.UpdateResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolicyCustomRepositoryImplTest {

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private PolicyCustomRepositoryImpl customRepository;

    private Location sampleLocation;
    private Coverage sampleCoverage;
    private UpdateResult successUpdateResult;

    @BeforeEach
    void setUp() {
        sampleCoverage = Coverage.builder()
                .coverageCode("GL")
                .coverageName("General Liability")
                .limit(1000000.0)
                .deductible(5000.0)
                .premium(1200.0)
                .build();

        sampleLocation = Location.builder()
                .locationId("LOC-01")
                .address("Factory A")
                .build();

        successUpdateResult = mock(UpdateResult.class);
        when(successUpdateResult.getModifiedCount()).thenReturn(1L);
    }

    @Test
    @DisplayName("addLocation - Should execute push update with MongoTemplate")
    void testAddLocation() {
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Policy.class)))
                .thenReturn(successUpdateResult);

        boolean result = customRepository.addLocation("POL-1001", sampleLocation);

        assertTrue(result);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), any(Update.class), eq(Policy.class));
    }

    @Test
    @DisplayName("updateLocation - Should execute set update with MongoTemplate")
    void testUpdateLocation() {
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Policy.class)))
                .thenReturn(successUpdateResult);

        boolean result = customRepository.updateLocation("POL-1001", "LOC-01", sampleLocation);

        assertTrue(result);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), any(Update.class), eq(Policy.class));
    }

    @Test
    @DisplayName("removeLocation - Should execute pull update with MongoTemplate")
    void testRemoveLocation() {
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Policy.class)))
                .thenReturn(successUpdateResult);

        boolean result = customRepository.removeLocation("POL-1001", "LOC-01");

        assertTrue(result);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), any(Update.class), eq(Policy.class));
    }

    @Test
    @DisplayName("addCoverage - Should execute push coverage update with MongoTemplate")
    void testAddCoverage() {
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Policy.class)))
                .thenReturn(successUpdateResult);

        boolean result = customRepository.addCoverage("POL-1001", "LOC-01", sampleCoverage);

        assertTrue(result);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), any(Update.class), eq(Policy.class));
    }

    @Test
    @DisplayName("updateCoverage - Should execute arrayFilters update with MongoTemplate")
    void testUpdateCoverage() {
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Policy.class)))
                .thenReturn(successUpdateResult);

        boolean result = customRepository.updateCoverage("POL-1001", "LOC-01", "GL", sampleCoverage);

        assertTrue(result);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), any(Update.class), eq(Policy.class));
    }

    @Test
    @DisplayName("removeCoverage - Should execute pull coverage update with MongoTemplate")
    void testRemoveCoverage() {
        when(mongoTemplate.updateFirst(any(Query.class), any(Update.class), eq(Policy.class)))
                .thenReturn(successUpdateResult);

        boolean result = customRepository.removeCoverage("POL-1001", "LOC-01", "GL");

        assertTrue(result);
        verify(mongoTemplate, times(1)).updateFirst(any(Query.class), any(Update.class), eq(Policy.class));
    }
}
