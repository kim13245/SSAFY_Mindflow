package com.swissclassic.mindflow_server.account.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OAuthProviderInfo {
    private String id;
    private String displayName;
}
