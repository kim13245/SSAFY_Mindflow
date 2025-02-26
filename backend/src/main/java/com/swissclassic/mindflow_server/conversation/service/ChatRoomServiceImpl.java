
package com.swissclassic.mindflow_server.conversation.service;


import com.swissclassic.mindflow_server.conversation.model.dto.ChatRoomResponse;
import com.swissclassic.mindflow_server.conversation.model.dto.TitleRequest;
import com.swissclassic.mindflow_server.conversation.model.dto.TitleResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import com.swissclassic.mindflow_server.conversation.repository.ChatRoomRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatRoomServiceImpl implements ChatRoomService {
    private final ChatRoomRepository chatRoomRepository;
    private final WebClient webClient; // WebClient를 사용하여 Flask 서버와 통신
    @Autowired
    public ChatRoomServiceImpl(ChatRoomRepository chatRoomRepository, WebClient webClient) {
        this.chatRoomRepository = chatRoomRepository;
        this.webClient = webClient;
    }

    @Override
    @Transactional // 트랜잭션 관리 추가 (필요 시)
    public ChatRoom createChatRoom(String title, Long creatorId) {
        ChatRoom chatRoom = ChatRoom.builder()
                .title(title)
                .creatorId(creatorId)
                .build();
        return chatRoomRepository.save(chatRoom);
    }

    @Override
    public List<ChatRoom> getAllChatRooms() {
        return chatRoomRepository.findAll();
    }

    @Override
    public ChatRoom getChatRoomById(Long id) {
        return chatRoomRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Chat room not found with ID: " + id));
    }
    @Override
    public List<ChatRoomResponse> findAllByCreatorId(long creatorId) {
        return chatRoomRepository.findAllByCreatorId(creatorId).stream()
                .map(chatRoom -> new ChatRoomResponse(chatRoom.getId(), chatRoom.getTitle(),chatRoom.getCreatedAt(),chatRoom.getStarred()))
                .collect(Collectors.toList());
    }

    @Override
    public String getTitle(String input) {
        // Flask 서버의 /chatbot/title 엔드포인트 호출

        TitleResponse response = webClient.post()
                .uri("/chatbot/title") // 제목 생성 API 엔드포인트
                .header("Content-Type", "application/json")
                .bodyValue(new TitleRequest(input)) // 요청 데이터 생성 (TitleRequest 객체 사용)
                .retrieve()
                .bodyToMono(TitleResponse.class) // 응답 데이터를 TitleResponse 객체로 변환
                .block(); // 동기 방식으로 결과 반환

        // TitleResponse 객체에서 제목 추출
        return response.getResponse();
    }

    @Override
    public void toggleStarredStatus(Long id){
        Optional<ChatRoom> optionalChatRoom = chatRoomRepository.findById(id);
        ChatRoom chatRoom = optionalChatRoom.get();
        chatRoom.setStarred(!chatRoom.getStarred());
        chatRoomRepository.save(chatRoom);
    }

    @Override
    @Transactional
    public void deleteChatRoomById(Long id){
        chatRoomRepository.deleteById(id);
    }
}

