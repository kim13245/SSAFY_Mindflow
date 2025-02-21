package com.swissclassic.mindflow_server.account.service;

import com.swissclassic.mindflow_server.account.model.entity.OAuth2UserWrapper;
import com.swissclassic.mindflow_server.account.model.entity.User;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import com.swissclassic.mindflow_server.account.service.OAuthUserInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;

@Service
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oauth2User = super.loadUser(userRequest);

        try {
            OAuthUserInfo userInfo = extractOAuthUserInfo(
                    userRequest.getClientRegistration().getRegistrationId(),
                    oauth2User.getAttributes()
            );

            User user = findOrCreateUser(userInfo);
            return new OAuth2UserWrapper(user, oauth2User.getAttributes());

        } catch (Exception ex) {
            log.error("OAuth2 authentication failed", ex);
            throw new RuntimeException("Failed to process OAuth2 user");
        }
    }

    private OAuthUserInfo extractOAuthUserInfo(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleUserInfo(attributes);
            case "kakao" -> new KakaoUserInfo(attributes);
            default -> throw new RuntimeException(
                    "Sorry! Login with " + registrationId + " is not supported yet.");
        };
    }

    private User findOrCreateUser(OAuthUserInfo userInfo) {
        // First try to find by social ID
        Optional<User> userOptional = userRepository
                .findBySocialProviderAndSocialId(
                        userInfo.getProvider(),
                        userInfo.getId()
                );

        if (userOptional.isPresent()) {
            return updateExistingUser(userOptional.get(), userInfo);
        }

        // Then try by email
        userOptional = userRepository.findByEmail(userInfo.getEmail());
        if (userOptional.isPresent()) {
            User existingUser = userOptional.get();
            existingUser.setSocialProvider(userInfo.getProvider());
            existingUser.setSocialId(userInfo.getId());
            return userRepository.save(existingUser);
        }

        return registerNewUser(userInfo);
    }

    private User registerNewUser(OAuthUserInfo userInfo) {
        User user = new User();
        user.setAccountId(generateUniqueAccountId(userInfo.getName()));
        user.setUsername(userInfo.getName());
        user.setDisplayName(userInfo.getName());
        user.setEmail(userInfo.getEmail());
        user.setPassword("");  // Social users don't need password
        user.setSocialProvider(userInfo.getProvider());
        user.setSocialId(userInfo.getId());
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    private User updateExistingUser(User user, OAuthUserInfo userInfo) {
        // Update only if needed
        if (!user.getDisplayName().equals(userInfo.getName())) {
            user.setDisplayName(userInfo.getName());
            return userRepository.save(user);
        }
        return user;
    }

    private String generateUniqueAccountId(String name) {
        String baseId = name.toLowerCase()
                            .replaceAll("\\s+", "")
                            .replaceAll("[^a-z0-9]", "");

        String accountId = baseId;
        int suffix = 1;

        while (userRepository.existsByAccountId(accountId)) {
            accountId = baseId + suffix++;
        }

        return accountId;
    }
}