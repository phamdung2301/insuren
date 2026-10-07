package com.dungphd.insurance.exception;

import com.dungphd.insurance.dto.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("handleResourceNotFound should return HTTP 404 NOT_FOUND")
    void testResourceNotFoundHandler() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Policy not found");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleResourceNotFound(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Policy not found", response.getBody().getMessage());
    }

    @Test
    @DisplayName("handleDuplicateResource should return HTTP 409 CONFLICT")
    void testDuplicateResourceHandler() {
        DuplicateResourceException ex = new DuplicateResourceException("Policy number exists");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleDuplicateResource(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Policy number exists", response.getBody().getMessage());
    }

    @Test
    @DisplayName("handleInvalidRequest should return HTTP 400 BAD_REQUEST")
    void testInvalidRequestHandler() {
        InvalidRequestException ex = new InvalidRequestException("Invalid transition");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleInvalidRequest(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Invalid transition", response.getBody().getMessage());
    }

    @Test
    @DisplayName("handleGenericException should return HTTP 500 INTERNAL_SERVER_ERROR")
    void testGenericExceptionHandler() {
        Exception ex = new RuntimeException("Database error");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGenericException(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertTrue(response.getBody().getMessage().contains("Database error"));
    }
}
