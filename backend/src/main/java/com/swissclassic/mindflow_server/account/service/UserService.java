package com.swissclassic.mindflow_server.account.service;

import com.swissclassic.mindflow_server.account.model.dto.RegisterRequest;
import com.swissclassic.mindflow_server.account.model.entity.OAuth2UserWrapper;
import com.swissclassic.mindflow_server.account.model.entity.User;
import com.swissclassic.mindflow_server.account.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHeaders;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Service for managing users.
 */
@Service
@Slf4j
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;
    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;
    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String googleRedirectUri;
    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String kakaoClientId;
    @Value("${spring.security.oauth2.client.registration.kakao.client-secret}")
    private String kakaoClientSecret;
    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String kakaoRedirectUri;

    @Autowired
    private CustomOAuth2UserService oAuth2UserService;

    /**
     * Registers a new user.
     *
     * @param registerRequest the registration request containing user details
     * @return the registered User
     * @throws Exception if the username or email is already taken
     */
    public User registerUser(RegisterRequest registerRequest) throws Exception {
        // Check if username already exists
        if (userRepository.findByUsername(registerRequest.getUsername())
                          .isPresent()) {
            throw new Exception("Username is already taken.");
        }

        // Check if email already exists
        if (userRepository.findByEmail(registerRequest.getEmail())
                          .isPresent()) {
            throw new Exception("Email is already in use.");
        }

        // Create new User entity
        User user = new User();
        user.setAccountId(registerRequest.getAccountId());
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword())); // Hashing the password
        user.setEmail(registerRequest.getEmail());
        user.setDisplayName(registerRequest.getDisplayName());
        user.setCreatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public OAuth2UserWrapper processOAuthLogin(String provider, String code) {
        Map<String, Object> tokenResponse = getTokenFromCode(provider, code);
        log.debug("processOAuthLogin: tokenResponse="+tokenResponse.toString());
        Map<String, Object> userInfo = getUserInfo(
                provider, tokenResponse.get("access_token")
                                       .toString()
        );
        log.debug("processOAuthLogin: userInfo="+userInfo.toString());
        OAuth2UserRequest userRequest = createOAuth2UserRequest(provider, tokenResponse);
        OAuth2UserWrapper asdf = (OAuth2UserWrapper) oAuth2UserService.loadUser(userRequest);
        log.debug("processOAuthLogin: "+asdf.toString());
        return asdf;
    }

    private Map<String, Object> getTokenFromCode(String provider, String code) {
        WebClient webClient = WebClient.create();

        String redirectUri = switch(provider){
            case "google" -> googleRedirectUri;
            case "kakao" -> kakaoRedirectUri;
            default -> throw new IllegalStateException("Unexpected value: " + provider);
        };

        String clientId = switch(provider){
            case "google" -> googleClientId;
            case "kakao" -> kakaoClientId;
            default -> throw new IllegalStateException("Unexpected value: " + provider);
        };

        String clientSecret = switch(provider){
            case "google" -> googleClientSecret;
            case "kakao" -> kakaoClientId;
            default -> throw new IllegalStateException("Unexpected value: " + provider);
        };

        log.info("getTokenFromCode: Sending token request with parameters:");
        log.info("getTokenFromCode: code: {}", code);
        log.info("getTokenFromCode: client_id: {}", clientId);
        log.info("getTokenFromCode: redirect_uri: {}", redirectUri);
        return switch (provider.toLowerCase()) {
            case "google" -> webClient.post()
                                      .uri("https://oauth2.googleapis.com/token")
                                      .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                                      .body(BodyInserters.fromFormData("client_id", googleClientId)
                                                         .with("client_secret", googleClientSecret)
                                                         .with("code", code)
                                                         .with("grant_type", "authorization_code")
                                                         .with("redirect_uri", googleRedirectUri))
                                      .retrieve()
                                      .onStatus(
                                              HttpStatusCode::is4xxClientError,  // Lambda version of the predicate
                                              response -> response.bodyToMono(String.class)
                                                                  .flatMap(errorBody -> {
                                                                      log.error(
                                                                              "getTokenFromCode: Error response from token endpoint: {}",
                                                                              errorBody
                                                                      );
                                                                      return Mono.error(new RuntimeException(
                                                                              "getTokenFromCode: Token endpoint error: " + errorBody));
                                                                  })
                                      )
                                      .bodyToMono(Map.class)
                                      .doOnError(throwable -> log.error(throwable.getMessage(), throwable))
                                      .block()
            ;
            case "kakao" -> webClient.post()
                                     .uri("https://kauth.kakao.com/oauth/token")
                                     .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                                     .body(BodyInserters.fromFormData("client_id", kakaoClientId)
                                                        .with("client_secret", kakaoClientSecret)
                                                        .with("code", code)
                                                        .with("grant_type", "authorization_code")
                                                        .with("redirect_uri", kakaoRedirectUri))
                                     .retrieve()
                                     .onStatus(
                                             HttpStatusCode::is4xxClientError,
                                             response -> response.bodyToMono(String.class).flatMap(errorBody -> {
                                                 log.error("Kakao token exchange error: {}", errorBody);
                                                 return Mono.error(new RuntimeException("Kakao token endpoint error: " + errorBody));
                                             })
                                     )
                                     .bodyToMono(Map.class)
                                     .block();
            // Add other providers...
            default -> throw new IllegalArgumentException("getTokenFromCode: Unsupported provider");
        };
    }

    private Map<String, Object> getUserInfo(String provider, String accessToken) {
        WebClient webClient = WebClient.create();

        return switch (provider.toLowerCase()) {
            case "google" -> webClient.get()
                                      .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                                      .header("Authorization", "Bearer " + accessToken)
                                      .retrieve()
                                      .bodyToMono(Map.class)
                                      .block()
            ;

            case "kakao" -> webClient.get()
                                     .uri("https://kapi.kakao.com/v2/user/me")
                                     .header("Authorization", "Bearer " + accessToken)
                                     .retrieve()
                                     .bodyToMono(Map.class)
                                     .block()
            ;

            default -> throw new IllegalArgumentException("Unsupported provider");
        };
    }

    private OAuth2UserRequest createOAuth2UserRequest(String provider, Map<String, Object> tokenResponse) {
        ClientRegistration registration = getClientRegistration(provider);

        OAuth2AccessToken accessToken = new OAuth2AccessToken(
                OAuth2AccessToken.TokenType.BEARER, tokenResponse.get("access_token")
                                                                 .toString(), Instant.now(), Instant.now()
                                                                                                    .plusSeconds(
                                                                                                            Long.parseLong(
                                                                                                                    tokenResponse.get(
                                                                                                                                         "expires_in")
                                                                                                                                 .toString()))
        );

        return new OAuth2UserRequest(registration, accessToken);
    }

    private ClientRegistration getClientRegistration(String provider) {
        return switch (provider.toLowerCase()) {
            case "google" -> ClientRegistration.withRegistrationId("google")
                                               .clientId(googleClientId)
                                               .clientSecret(googleClientSecret)
                                               .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                                               .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                                               .scope("openid", "profile", "email")
                                               .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                                               .tokenUri("https://www.googleapis.com/oauth2/v4/token")
                                               .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                                               .userNameAttributeName("sub")
                                               .clientName("Google")
                                               .build()
            ;

            case "kakao" -> ClientRegistration.withRegistrationId("kakao")
                                              .clientId(kakaoClientId)
                                              .clientSecret(kakaoClientSecret)
                                              .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                                              .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                                              .scope("profile_nickname", "profile_image", "account_email")
                                              .authorizationUri("https://kauth.kakao.com/oauth/authorize")
                                              .tokenUri("https://kauth.kakao.com/oauth/token")
                                              .userInfoUri("https://kapi.kakao.com/v2/user/me")
                                              .userNameAttributeName("id")
                                              .clientName("Kakao")
                                              .build()
            ;

            default -> throw new IllegalArgumentException("Unsupported provider: " + provider);
        };
    }
}
