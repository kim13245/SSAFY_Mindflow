package com.swissclassic.mindflow_server.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
@Slf4j
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        List<String> allowedOrigins = List.of("http://localhost:5173", "http://localhost:5174", "http://localhost",
                                              "http://i12d203.p.ssafy.io", "https://mindflow.ddns.net",
                                              "http://localhost:8453"
        );
        log.error("CorsFilter" + allowedOrigins.toString());
        config.setAllowedOrigins(allowedOrigins);
        // 허용할 origin 설정 (React 앱 주소)
        // 자격증명 허용
        config.setAllowCredentials(true);

        // 허용할 헤더
        config.addAllowedHeader("*");

        // 허용할 HTTP 메서드
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");
        config.setMaxAge(3600L);
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}