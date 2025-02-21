package com.swissclassic.mindflow_server.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for JWT.
 */
@Configuration
@Getter
@Setter
public class JwtProperties {

    /**
     * Secret key used for signing JWTs.
     */
    @Value("${jwt.secret}")
    private String secret;

    /**
     * JWT token expiration time in milliseconds.
     */
    @Value("${jwt.expiration}")
    private long expirationMs;
    @Value("${jwt.refresh.expiration}")
    private long refreshExpirationMs;
}
