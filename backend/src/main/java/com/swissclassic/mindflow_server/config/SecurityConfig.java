package com.swissclassic.mindflow_server.config;

import com.swissclassic.mindflow_server.account.service.CustomOAuth2UserService;
import com.swissclassic.mindflow_server.account.service.CustomUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuration class for Spring Security using JWT.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Configures the security filter chain with JWT authentication.
     *
     * @param http the HttpSecurity to modify
     * @return the configured SecurityFilterChain
     * @throws Exception in case of configuration errors
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // CSRF 비활성화 (새로운 방식)
                .csrf(AbstractHttpConfigurer::disable)
                // CorsConfig의 설정 반영
                .cors(cors -> cors.configure(http))
                // 세션 관리 설정 (새로운 방식)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 요청 인증 규칙 설정
                .authorizeHttpRequests(authorize -> authorize
                        // 기존 허용 경로
                        .requestMatchers("/api/**", "/swagger-ui/**", "/v3/api-docs/**",
                                         "/swagger-resources/**", "/webjars/**", "/login/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/**")
                        .permitAll()
                        // 나머지는 인증 필요
                        .anyRequest()
                        .authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
//                .exceptionHandling(
//                        exception -> exception.authenticationEntryPoint((request, response, authException) -> {
//                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, authException.getMessage());
//                        }))
                .oauth2Login(
                        oauth2 -> oauth2.userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService)))
                .build();
    }

    /**
     * Password encoder bean using BCrypt.
     *
     * @return the PasswordEncoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager bean.
     *
     * @param authConfig the AuthenticationConfiguration
     * @return the AuthenticationManager
     * @throws Exception in case of errors
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}
