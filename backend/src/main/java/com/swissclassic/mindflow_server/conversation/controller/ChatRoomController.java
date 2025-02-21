package com.swissclassic.mindflow_server.conversation.controller;

import com.swissclassic.mindflow_server.conversation.model.dto.ChatRoomResponse;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import com.swissclassic.mindflow_server.conversation.service.ChatLogService;
import com.swissclassic.mindflow_server.conversation.service.ChatRoomService;
import com.swissclassic.mindflow_server.conversation.service.ConversationSummaryService;
import com.swissclassic.mindflow_server.mindmap.service.TopicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chatroom")
public class ChatRoomController {
    private final ChatRoomService chatRoomService;
    private final ChatLogService chatLogService;
    private final ConversationSummaryService conversationSummaryService;
    private final TopicService topicService;

    @GetMapping("my-rooms/{creatorId}")
    public ResponseEntity<List<ChatRoomResponse>> getChatRoomsByCreatorId(@PathVariable long creatorId) {
        List<ChatRoomResponse> chatRooms = chatRoomService.findAllByCreatorId(creatorId);
        return ResponseEntity.ok(chatRooms);
    }
    @GetMapping("messages/{chatRoomId}")
    public ResponseEntity<List<ChatLog>> getChatLogsByChatRoomId(@PathVariable long chatRoomId) {
        List<ChatLog> chatLogs = chatLogService.getMessagesByChatRoomId(chatRoomId);
        return ResponseEntity.ok(chatLogs); // 200 OK 응답과 함께 데이터 반환
    }

    @DeleteMapping("delete/{chatRoomId}")
    public ResponseEntity<Void> deleteChatRoomByChatRoomId(@PathVariable long chatRoomId) {
        // chatRoomId로 해당하는 챗룸을 삭제하는 서비스 호출
        chatLogService.deleteChatLogsByChatRoomId(chatRoomId);
        conversationSummaryService.deleteConversationSummaryByChatRoomId(chatRoomId);
        chatRoomService.deleteChatRoomById(chatRoomId);
        // 삭제가 완료된 후 204 No Content 반환

        // 마인드맵 삭제
        topicService.deleteMindMapByChatRoomId(chatRoomId);
        log.info("해당 chatRoom의 마인드맵이 삭제되었습니다!!!!!!!!");

        return ResponseEntity.noContent().build();
    }
}
