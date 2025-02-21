package com.swissclassic.mindflow_server.account.model.dto;

import lombok.Data;

/**
 * DTO for user login requests.
 */
@Data
public class LoginRequest {
    private String accountId;
    private String password;
}
