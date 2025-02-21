package com.swissclassic.mindflow_server.account.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EditUserProfileRequest {
    String accountId;
    String email;
    String username;
    String displayName;
    String password;
}
