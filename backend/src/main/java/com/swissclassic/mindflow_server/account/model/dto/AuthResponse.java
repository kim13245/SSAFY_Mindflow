package com.swissclassic.mindflow_server.account.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {
    private Long userId;
    private String displayName;
    private String accessToken;
    private String refreshToken;
}
