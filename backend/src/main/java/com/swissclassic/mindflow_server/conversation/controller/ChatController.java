package com.swissclassic.mindflow_server.conversation.controller;

import com.swissclassic.mindflow_server.conversation.model.dto.*;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;
import com.swissclassic.mindflow_server.conversation.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/messages")
@Tag(name = "send", description = "채팅 관련 API")
public class ChatController {
    private final AiServerService aiServerService;
    private final ChatRoomService roomService;
    private final ChatLogService chatLogService;
    private final ConversationSummaryService conversationSummaryService;
    private final MemoryService memoryService;

    @PostMapping("/send")
    @Operation(description = "gemini-2.0-flash-exp")
    public ChatApiResponse getChatResponse(@RequestBody ChatRequest chatRequest) {


        ChatApiResponse answer = aiServerService.getChatResponse(chatRequest);

//        log.info("Flask 에서 도착한 Answer Sentences: {}", answer.getAnswerSentences());
        log.info("Flask chat_room_id: {}", answer.getChatRoomId());


        chatLogService.saveChatLog(
                chatRequest.getChatRoomId(),
                chatRequest.getUserInput(),
                answer.getResponse(),

                chatRequest.getModel(),
                chatRequest.getDetailModel(),
//                chatRequest.getCreatorId()

                answer.getAnswerSentences(),  // Pass the full answer sentences
                chatRequest.getCreatorId()

        );

        return answer;
    }

    @PostMapping("/all")
    public ChatAllResponse getAllResponse(@RequestBody ChatAllRequest chatRequest) {
        return aiServerService.getAllChatResponse(chatRequest);
    }


    // 여기는 말만 summary지 실제로는 대화를 저장함
    @PostMapping("/choiceModel")
    FirstChatRespose firstChat(@RequestBody ConversationSummaryRequest conversationSummaryRequest) {

        ChatRoom room = roomService.createChatRoom(
                roomService.getTitle(conversationSummaryRequest.getUserInput()),
                conversationSummaryRequest.getCreatorId()
        );
        long roomId = room.getId();

        // Flask의 응답 형식과 동일하게 AnswerSentence 리스트 생성
        List<ChatApiResponse.AnswerSentence> answerSentences = Arrays.stream(
                conversationSummaryRequest
                        .getAnswer()
                        .split("\\."))
                        .filter(line -> !line.trim()
                        .isEmpty())
                        .map(line -> {
                    ChatApiResponse.AnswerSentence sentence = new ChatApiResponse.AnswerSentence();
                    sentence.setSentenceId(NanoIdUtils.randomNanoId(NanoIdUtils.DEFAULT_NUMBER_GENERATOR,
                            NanoIdUtils.DEFAULT_ALPHABET, 7));
                    sentence.setContent(line.trim());
                    return sentence;
                })
                .collect(Collectors.toList());

        // 수정된 saveChatLog 메서드 호출

        chatLogService.saveChatLog(
                roomId,
                conversationSummaryRequest.getUserInput(),
                conversationSummaryRequest.getAnswer(),

               conversationSummaryRequest.getModel(),
                conversationSummaryRequest.getDetailModel()
                ,
//                (conversationSummaryRequest.getCreatorId())

                answerSentences,  // 새로 생성한 AnswerSentence 리스트
                conversationSummaryRequest.getCreatorId()

        );



        ConversationSummary conversationSummary = new ConversationSummary();
        conversationSummary.setTimestamp(String.valueOf(Instant.now()));
        conversationSummary.setChatRoomId(roomId);
        conversationSummary.setSummaryContent(
                "User:" + conversationSummaryRequest.getUserInput() + "\nAI" + conversationSummaryRequest.getAnswer());

        conversationSummaryService.saveConversationSummary(conversationSummary);
        memoryService.setMemory(roomId);

        // 마인드맵 생성을 위한 요청 추가
        log.info("초기 마인드맵 생성!!!!!!!!!!!!!!!!!!!!!!!");
        // 마인드맵 생성 요청 시 MongoDB에 저장된 sentenceId 전달
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("chatRoomId", roomId);
        requestBody.put("userInput", conversationSummaryRequest.getUserInput());
        requestBody.put("creatorId", conversationSummaryRequest.getCreatorId());
        requestBody.put("answerSentences", answerSentences);  // 이미 저장된 sentenceId 사용

        aiServerService.createFirstMindmap(requestBody);  // 새로운 메서드


        FirstChatRespose firstChatRespose = new FirstChatRespose();
        firstChatRespose.setChatRoomId((roomId));

        return firstChatRespose;
    }

    @GetMapping("/room-title/{chatRoomId}")
    @Operation(summary = "flask 에서 chatRoomId로 title 가져오는 용도", description = "chatRoomId를 입력하세요.")
    public ResponseEntity<String> getChatRoomTitle(@PathVariable long chatRoomId) {
        ChatRoom chatRoom = roomService.getChatRoomById(chatRoomId);
        return ResponseEntity.ok(chatRoom.getTitle());
    }

}
