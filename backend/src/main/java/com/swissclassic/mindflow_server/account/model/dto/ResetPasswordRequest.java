package com.swissclassic.mindflow_server.account.model.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@RequiredArgsConstructor
public class ResetPasswordRequest {
    private String accountId;
    private String token;
    private String newPassword;
}
