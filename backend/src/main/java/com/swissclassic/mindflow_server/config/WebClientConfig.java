package com.swissclassic.mindflow_server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    // application.yml에서 python.server.url 값을 읽어옴
    @Value("${python.server.url}")
    private String aiServerUrl;

    @Bean
    public WebClient aiServerWebClient() {
        return WebClient.builder()
                .baseUrl(aiServerUrl) // yml 파일에서 설정된 URL 사용
                .build();
    }
}