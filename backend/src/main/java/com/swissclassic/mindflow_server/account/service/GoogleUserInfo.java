package com.swissclassic.mindflow_server.account.service;

import com.swissclassic.mindflow_server.account.model.entity.OAuthProvider;
import lombok.Getter;

import java.util.Map;

@Getter
public class GoogleUserInfo implements OAuthUserInfo {
    private final Map<String, Object> attributes;

    public GoogleUserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getId() {
        return (String) attributes.get("sub");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getName() {
        return (String) attributes.get("name");
    }

    @Override
    public OAuthProvider getProvider() {
        return OAuthProvider.GOOGLE;
    }
}