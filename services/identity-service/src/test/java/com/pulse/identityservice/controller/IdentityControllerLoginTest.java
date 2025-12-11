package com.pulse.identityservice.controller;

import com.pulse.identityservice.dto.AuthResponse;
import com.pulse.identityservice.dto.LoginRequest;
import com.pulse.identityservice.exception.InvalidCredentialsException;
import com.pulse.identityservice.exception.UserNotFoundException;
import com.pulse.identityservice.service.IdentityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for IdentityController - Login endpoint.
 * Tests POST /identity/login functionality.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Identity Controller - Login Tests")
class IdentityControllerLoginTest {

    @Mock
    private IdentityService identityService;

    @InjectMocks
    private IdentityController identityController;

    @Test
    @DisplayName("When login with valid credentials, return 200 with JWT token")
    void testLogin_WithValidCredentials_Returns200WithJWT() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("password123")
                .build();

        AuthResponse expectedResponse = AuthResponse.builder()
                .message("Login successful")
                .token("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
                .userId("user-123")
                .email("user@example.com")
                .isVerified(true)
                .build();

        when(identityService.login(any(LoginRequest.class))).thenReturn(expectedResponse);

        // Act
        ResponseEntity<AuthResponse> response = identityController.login(request);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Login successful", response.getBody().getMessage());
        assertNotNull(response.getBody().getToken());
        assertTrue(response.getBody().getToken().startsWith("eyJ"));
        assertEquals("user@example.com", response.getBody().getEmail());
        assertEquals(true, response.getBody().getIsVerified());
        
        verify(identityService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("When email doesn't exist, return 401 Unauthorized")
    void testLogin_WithNonExistentEmail_Returns401() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("password123")
                .build();

        when(identityService.login(any(LoginRequest.class)))
                .thenThrow(new UserNotFoundException("User not found with email: nonexistent@example.com"));

        // Act & Assert
        assertThrows(UserNotFoundException.class, () -> {
            identityController.login(request);
        });
        
        verify(identityService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("When password is incorrect, return 401 Unauthorized")
    void testLogin_WithIncorrectPassword_Returns401() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("wrongpassword")
                .build();

        when(identityService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid credentials"));

        // Act & Assert
        assertThrows(InvalidCredentialsException.class, () -> {
            identityController.login(request);
        });
        
        verify(identityService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("When account is not verified, return 401 Unauthorized")
    void testLogin_WithUnverifiedAccount_Returns401() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("unverified@example.com")
                .password("password123")
                .build();

        when(identityService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("User account is not verified. Please verify OTP first."));

        // Act & Assert
        InvalidCredentialsException exception = assertThrows(InvalidCredentialsException.class, () -> {
            identityController.login(request);
        });
        
        assertTrue(exception.getMessage().contains("not verified"));
        verify(identityService, times(1)).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("When user tries to login with empty password, return 401 Unauthorized")
    void testLogin_WithEmptyPassword_Returns401() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("") // Empty password
                .build();

        when(identityService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid credentials"));

        // Act & Assert
        assertThrows(InvalidCredentialsException.class, () -> {
            identityController.login(request);
        });
        
        verify(identityService, times(1)).login(any(LoginRequest.class));
    }
}
