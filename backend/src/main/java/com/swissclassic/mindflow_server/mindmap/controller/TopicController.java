package com.swissclassic.mindflow_server.mindmap.controller;

import com.swissclassic.mindflow_server.mindmap.model.dto.TopicDTO;
import com.swissclassic.mindflow_server.mindmap.service.TopicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/mindmaps")
@Tag(name="MindMap API", description = "마인드맵 관련 API 입니다.")
@Slf4j
public class TopicController {

    @Autowired
    private TopicService topicService;

    @GetMapping("/{userId}")
    @Operation(summary = "유저 전체 마인드맵 조회", description = "userId 입력하세요")
    public TopicDTO getTopicByUserId(@PathVariable String userId) {
        return topicService.getTopicByUserId(userId);
    }

    @GetMapping("/{userId}/{chatRoomId}")
    @Operation(summary = "유저의 해당 채팅방 마인드맵 조회", description = "userId, chatRoomId 입력")
    public TopicDTO getTopicByUserIdAndChatRoom(
            @PathVariable String userId,
            @PathVariable String chatRoomId) {

        return topicService.getMindMapByUserAndChatRoom(userId, chatRoomId);
    }

    @DeleteMapping("/deleteSubTopic/{elementId}")
    @Operation(summary = "해당 노드와 하위 노드 삭제", description = "노드의 id 를 받아서 해당 branch 삭제")
    public void deleteSubtopics(@PathVariable String elementId) {
        topicService.deleteSubtopics(elementId);
    }


    // 주제 분리
    @PostMapping("/seperateTopic/{elementId}/{creatorId}")
    @Operation(summary = "마인드맵 주제 분리",
            description = "선택한 노드와 자식 노드들을 새로운 주제로 분리합니다.")
    public ResponseEntity<Map<String, Long>> separateTopic(@PathVariable String elementId,
                                                           @PathVariable Long creatorId) {
        Long newChatRoomId = topicService.seperateTopic(elementId, creatorId);

        return ResponseEntity.ok()
                .body(Map.of("newChatRoomId", newChatRoomId));
    }
}


