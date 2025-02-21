package com.swissclassic.mindflow_server.account.model.dto;

import lombok.Data;

import javax.validation.constraints.Size;

/**
 * DTO for user registration requests.
 */
@Data
public class RegisterRequest {
    @Size(min = 3, max = 50, message = "Account ID must be between 3 and 50 characters.")
    private String accountId;

    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters.")
    private String username;

    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters.")
    private String password;

    private String email;

    private String displayName;

    @Data
    public static
    class JwtResponse {
        private String token;
        private String type = "Bearer";

        public JwtResponse(String token) {
            this.token = token;
        }
    }
}
