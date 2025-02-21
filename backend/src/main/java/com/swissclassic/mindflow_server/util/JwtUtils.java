package com.swissclassic.mindflow_server.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.swissclassic.mindflow_server.config.JwtProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Utility class for handling JWT operations.
 */
@Component
@Slf4j
public class JwtUtils {

    private final JwtProperties jwtProperties;

    @Autowired
    public JwtUtils(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    private Algorithm getAlgorithm() {
        log.debug("JWT Secret key = " + jwtProperties.getSecret());
        return Algorithm.HMAC256(jwtProperties.getSecret()
                                              .getBytes());
    }

    /**
     * Generates a JWT token for the given username.
     *
     * @param username the username for which the token is generated
     * @return the generated JWT token
     */
    public String generateJwtToken(String username) {
        log.debug("JWT access time = " + jwtProperties.getExpirationMs() + "ms");
        return JWT.create()
                  .withSubject(username)
                  .withIssuedAt(new Date())
                  .withExpiresAt(new Date(System.currentTimeMillis() + jwtProperties.getExpirationMs()))
                  .sign(getAlgorithm());
    }

    /**
     * Generates a JWT token for the given username.
     *
     * @param username the username for which the token is generated
     * @return the generated JWT token
     */
    public String generateRefreshToken(String username) {
        log.debug("JWT access time = " + jwtProperties.getRefreshExpirationMs() + "ms");
        return JWT.create()
                  .withSubject(username)
                  .withIssuedAt(new Date())
                  .withExpiresAt(new Date(System.currentTimeMillis() + jwtProperties.getRefreshExpirationMs()))
                  .sign(getAlgorithm());
    }

    /**
     * Validates the given JWT token.
     *
     * @param token the JWT token to validate
     * @return the decoded JWT if valid
     * @throws Exception if the token is invalid or expired
     */
    public DecodedJWT validateJwtToken(String token) throws Exception {
        try {
            JWTVerifier verifier = JWT.require(getAlgorithm())
                                      .build();
            return verifier.verify(token);
        } catch (Exception e) {
            throw new Exception("Invalid JWT token");
        }
    }

    /**
     * Extracts the username (subject) from the JWT access token.
     *
     * @param token the JWT access token
     * @return the username
     */
    public String getUsernameFromJwtToken(String token) {
        DecodedJWT decodedJWT = JWT.decode(token);
        return decodedJWT.getSubject();
    }
}
