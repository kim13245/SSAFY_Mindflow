package com.swissclassic.mindflow_server.account.model.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@RequiredArgsConstructor
public class AccountVerificationRequest {
    private String accountId;
    private String email;
}
