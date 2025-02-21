package com.swissclassic.mindflow_server.account.controller;

import com.swissclassic.mindflow_server.account.model.dto.AuthResponse;
import com.swissclassic.mindflow_server.account.model.dto.OAuthProviderInfo;
import com.swissclassic.mindflow_server.account.model.entity.OAuth2UserWrapper;
import com.swissclassic.mindflow_server.account.model.entity.OAuthProvider;
import com.swissclassic.mindflow_server.account.model.entity.User;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import com.swissclassic.mindflow_server.account.service.UserService;
import com.swissclassic.mindflow_server.util.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@Slf4j
@Tag(name = "Authentication", description = "OAuth2 인증 관련 API")
public class OAuth2Controller {
    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;
    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String googleRedirectUri;
    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @GetMapping("/oauth2/login/{provider}")
    @Operation(summary = "소셜 로그인 URL 반환", description = "지정된 제공자(Google, Kakao 등)의 OAuth2 로그인 URL을 반환합니다.")
    public ResponseEntity<String> getOAuthLoginUrl(
            @PathVariable String provider
    ) {
        try {
            String redirectUri = switch (provider) {
                case "google" -> googleRedirectUri;
                case "kakao" -> kakaoRedirectUri;
                default -> throw new IllegalArgumentException("Unsupported social provider.");
            };
            String authUrl = getAuthorizationUrl(provider, redirectUri);
            return ResponseEntity.ok(authUrl);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                                 .body(e.getMessage());
        }
    }

    @GetMapping("/oauth2/callback/{provider}")
    @Operation(summary = "OAuth2 콜백 처리", description = "소셜 로그인 후 콜백을 처리하고 JWT 토큰을 발급합니다.")
    public ResponseEntity<?> handleOAuthCallback(
            @PathVariable String provider, @RequestParam String code
    ) {
        try {
            OAuth2UserWrapper oAuth2User = userService.processOAuthLogin(provider, code);
            String accessToken = jwtUtils.generateJwtToken(oAuth2User.getUser()
                                                                     .getAccountId());
            String refreshToken = jwtUtils.generateRefreshToken(oAuth2User.getUser()
                                                                          .getId()
                                                                          .toString());
            User user = oAuth2User.getUser();
            user.setRefreshToken(refreshToken);
            userRepository.save(user);
            log.debug("Successfully generated JWT token");
            return ResponseEntity.ok(new AuthResponse(oAuth2User.getUser()
                                                                .getId(), oAuth2User.getUser()
                                                                                    .getDisplayName(), accessToken,
                                                      refreshToken
            ));
        } catch (Exception e) {
            log.error("OAuth2 authentication failed", e);
            return ResponseEntity.badRequest()
                                 .body("OAuth2 authentication failed: " + e.getMessage());
        }
    }

    @GetMapping("/oauth2/providers")
    @Operation(summary = "지원하는 소셜 로그인 제공자 목록", description = "현재 지원하는 모든 소셜 로그인 제공자 목록을 반환합니다.")
    public ResponseEntity<List<OAuthProviderInfo>> getProviders() {
        List<OAuthProviderInfo> providers = Arrays.stream(OAuthProvider.values())
                                                  .filter(p -> p != OAuthProvider.NONE)
                                                  .map(p -> new OAuthProviderInfo(p.name(), getProviderDisplayName(p)))
                                                  .collect(Collectors.toList());

        return ResponseEntity.ok(providers);
    }

    private String getAuthorizationUrl(String provider, String redirectUri) {
        return switch (provider.toLowerCase()) {
            case "google" -> String.format(
                    "https://accounts.google.com/o/oauth2/v2/auth" + "?client_id=%s" + "&redirect_uri=%s" + "&response_type=code" + "&scope=email%%20profile",
                    // Note: URL encoded space
                    googleClientId, redirectUri
            );
            case "kakao" -> String.format(
                    "https://kauth.kakao.com/oauth/authorize?client_id=%s&redirect_uri=%s&response_type=code",
                    kakaoClientId,
                    redirectUri
            );
            default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
        };
    }

    private String getProviderDisplayName(OAuthProvider provider) {
        return switch (provider) {
            case GOOGLE -> "Google";
            case KAKAO -> "Kakao";
            default -> provider.name();
        };
    }
}

