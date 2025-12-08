package com.pulse.identityservice.service;

import com.pulse.identityservice.dto.AuthResponse;
import com.pulse.identityservice.dto.LoginRequest;
import com.pulse.identityservice.dto.RegisterRequest;
import com.pulse.identityservice.dto.VerifyOtpRequest;

/**
 * Service interface for identity operations.
 */
public interface IdentityService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse verifyOtp(VerifyOtpRequest request);
}
