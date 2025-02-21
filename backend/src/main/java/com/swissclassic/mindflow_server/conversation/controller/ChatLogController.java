package com.swissclassic.mindflow_server.conversation.controller;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.service.ChatLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("api/chat-log")
public class ChatLogController {

    @Autowired
    private ChatLogService service;

    @GetMapping("/search/{keyword}/{creatorId}")
    public List<ChatLog> search(@PathVariable String keyword, @PathVariable long creatorId) {
        return service.findBySentenceContent(keyword, creatorId);
    }
}
