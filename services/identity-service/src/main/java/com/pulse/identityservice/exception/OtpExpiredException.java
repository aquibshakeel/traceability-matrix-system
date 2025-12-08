package com.pulse.identityservice.exception;

/**
 * Exception thrown when OTP has expired.
 */
public class OtpExpiredException extends RuntimeException {

    public OtpExpiredException(String message) {
        super(message);
    }
}
