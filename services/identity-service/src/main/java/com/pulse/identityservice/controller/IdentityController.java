package com.pulse.identityservice.controller;

import com.pulse.identityservice.dto.AuthResponse;
import com.pulse.identityservice.dto.LoginRequest;
import com.pulse.identityservice.dto.RegisterRequest;
import com.pulse.identityservice.dto.VerifyOtpRequest;
import com.pulse.identityservice.service.IdentityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for identity operations.
 */
@Slf4j
@RestController
@RequestMapping("/identity")
@RequiredArgsConstructor
@Tag(name = "Identity", description = "Identity management APIs")
public class IdentityController {

    private final IdentityService identityService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account and sends OTP for verification")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register request received for email: {}", request.getEmail());
        AuthResponse response = identityService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates user and returns JWT token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request received for email: {}", request.getEmail());
        AuthResponse response = identityService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP", description = "Verifies the OTP sent to user's email and activates the account")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        log.info("OTP verification request received for email: {}", request.getEmail());
        AuthResponse response = identityService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }
}
