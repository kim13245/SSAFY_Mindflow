package com.swissclassic.mindflow_server.account.service;

import com.swissclassic.mindflow_server.account.model.entity.OAuthProvider;

public interface OAuthUserInfo {
    String getId();
    String getEmail();
    String getName();
    OAuthProvider getProvider();
}
