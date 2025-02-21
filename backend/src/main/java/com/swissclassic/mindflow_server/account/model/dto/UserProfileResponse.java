package com.swissclassic.mindflow_server.account.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserProfileResponse {
    String accountId;
    String email;
    String username;
    String displayName;
}
