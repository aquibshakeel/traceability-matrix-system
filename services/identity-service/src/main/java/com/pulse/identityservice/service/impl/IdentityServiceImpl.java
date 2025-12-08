package com.pulse.identityservice.service.impl;

import com.pulse.identityservice.dto.AuthResponse;
import com.pulse.identityservice.dto.LoginRequest;
import com.pulse.identityservice.dto.RegisterRequest;
import com.pulse.identityservice.dto.VerifyOtpRequest;
import com.pulse.identityservice.exception.InvalidCredentialsException;
import com.pulse.identityservice.exception.OtpExpiredException;
import com.pulse.identityservice.exception.UserAlreadyExistsException;
import com.pulse.identityservice.exception.UserNotFoundException;
import com.pulse.identityservice.model.User;
import com.pulse.identityservice.repository.UserRepository;
import com.pulse.identityservice.service.IdentityService;
import com.pulse.identityservice.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

/**
 * Implementation of IdentityService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IdentityServiceImpl implements IdentityService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final int OTP_EXPIRY_MINUTES = 5;

    @Override
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with email " + request.getEmail() + " already exists");
        }

        String otp = generateOtp();

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .otp(otp)
                .otpGeneratedAt(LocalDateTime.now())
                .isVerified(false)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        log.info("User registered successfully. OTP: {}", otp);

        return AuthResponse.builder()
                .message("User registered successfully. Please verify OTP sent to your email.")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .isVerified(false)
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        if (!user.getIsVerified()) {
            throw new InvalidCredentialsException("User account is not verified. Please verify OTP first.");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        log.info("User logged in successfully: {}", request.getEmail());

        return AuthResponse.builder()
                .message("Login successful")
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .isVerified(true)
                .build();
    }

    @Override
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        log.info("OTP verification attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        if (user.getOtp() == null || !user.getOtp().equals(request.getOtp())) {
            throw new InvalidCredentialsException("Invalid OTP");
        }

        LocalDateTime otpExpiryTime = user.getOtpGeneratedAt().plusMinutes(OTP_EXPIRY_MINUTES);
        if (LocalDateTime.now().isAfter(otpExpiryTime)) {
            throw new OtpExpiredException("OTP has expired. Please request a new one.");
        }

        user.setIsVerified(true);
        user.setOtp(null);
        user.setOtpGeneratedAt(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());

        log.info("OTP verified successfully for email: {}", request.getEmail());

        return AuthResponse.builder()
                .message("OTP verified successfully")
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .isVerified(true)
                .build();
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}
