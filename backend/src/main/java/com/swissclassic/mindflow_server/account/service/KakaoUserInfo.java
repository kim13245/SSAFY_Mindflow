package com.swissclassic.mindflow_server.account.service;

import com.swissclassic.mindflow_server.account.model.entity.OAuthProvider;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Getter
@Slf4j
public class KakaoUserInfo implements OAuthUserInfo {
    private final Map<String, Object> attributes;

    public KakaoUserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getId() {
        return String.valueOf(attributes.get("id"));
    }

    @Override
    public String getEmail() {
        log.info(attributes.toString());
        Map<String, Object> account = (Map<String, Object>) attributes.get("kakao_account");
        return (String) account.get("email");
    }

    @Override
    public String getName() {
        Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
        return (String) properties.get("nickname");
    }

    @Override
    public OAuthProvider getProvider() {
        return OAuthProvider.KAKAO;
    }
}