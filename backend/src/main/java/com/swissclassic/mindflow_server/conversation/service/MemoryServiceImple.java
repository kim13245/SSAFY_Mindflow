package com.swissclassic.mindflow_server.conversation.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class MemoryServiceImple implements MemoryService {

    private final WebClient webClient; // WebClient를 사용하여 Flask 서버와 통신

    public MemoryServiceImple(WebClient webClient) {
        this.webClient = webClient;
    }


    @Override
    public void setMemory(long chatRoomId) {
        // 메서드 구현 내용
        System.out.println("안녕");
        webClient.post()
                .uri("/chatbot/setMemory/{chatRoomId}", chatRoomId) // chatRoomId를 URI에 동적으로 삽입
                .header("Content-Type", "application/json")
                .retrieve()
                .bodyToMono(Map.class) // 응답 데이터를 Map으로 변환 (JSON 형식으로 응답 받기)
                .doOnTerminate(() -> System.out.println("Request completed"))
                .block(); // 동기 방식으로 처리
    }
}

