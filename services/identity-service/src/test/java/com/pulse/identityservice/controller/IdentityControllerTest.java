package com.pulse.identityservice.controller;

import com.pulse.identityservice.dto.AuthResponse;
import com.pulse.identityservice.dto.RegisterRequest;
import com.pulse.identityservice.dto.VerifyOtpRequest;
import com.pulse.identityservice.exception.InvalidCredentialsException;
import com.pulse.identityservice.service.IdentityService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class IdentityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IdentityService identityService;

    @Test
    public void testRegisterUser_Success() throws Exception {
        // Arrange
        AuthResponse mockResponse = new AuthResponse();
        mockResponse.setToken("mock-jwt-token");
        mockResponse.setMessage("User registered successfully");
        
        when(identityService.register(any(RegisterRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/identity/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"fullName\":\"Test User\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.message").value("User registered successfully"));
    }

    @Test
    public void testRegisterUser_InvalidEmail() throws Exception {
        // Act & Assert - Test with invalid email
        mockMvc.perform(post("/api/identity/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"invalid-email\",\"password\":\"Test123!\",\"fullName\":\"Test User\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testRegisterUser_MissingFields() throws Exception {
        // Act & Assert - Test with missing required fields
        mockMvc.perform(post("/api/identity/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\"}"))
                .andExpect(status().isBadRequest());
    }

    // Partial tests for verify-otp API
    // Note: Only 2 out of 5 acceptance criteria are tested (Partially Covered scenario)
    // Missing: expired OTP test, one-time use test, max attempts test

    @Test
    public void testVerifyOtp_Success() throws Exception {
        // Arrange - Valid OTP scenario
        AuthResponse mockResponse = new AuthResponse();
        mockResponse.setToken("mock-jwt-token-with-otp");
        mockResponse.setMessage("OTP verified successfully");
        
        when(identityService.verifyOtp(any(VerifyOtpRequest.class))).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post("/api/identity/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\",\"otp\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token-with-otp"))
                .andExpect(jsonPath("$.message").value("OTP verified successfully"));
    }

    @Test
    public void testVerifyOtp_InvalidCode() throws Exception {
        // Arrange - Invalid OTP
        when(identityService.verifyOtp(any(VerifyOtpRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid OTP code"));

        // Act & Assert
        mockMvc.perform(post("/api/identity/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@example.com\",\"otp\":\"000000\"}"))
                .andExpect(status().isUnauthorized());
    }
}
