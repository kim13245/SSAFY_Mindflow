package com.swissclassic.mindflow_server.mindmap.service;

import com.swissclassic.mindflow_server.conversation.model.entity.AnswerSentence;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
import com.swissclassic.mindflow_server.conversation.model.entity.ChatRoom;
import com.swissclassic.mindflow_server.conversation.model.entity.ConversationSummary;
import com.swissclassic.mindflow_server.conversation.service.ChatLogService;
import com.swissclassic.mindflow_server.conversation.service.ChatRoomService;
import com.swissclassic.mindflow_server.conversation.service.ConversationSummaryService;
import com.swissclassic.mindflow_server.mindmap.model.dto.TopicDTO;
import com.swissclassic.mindflow_server.mindmap.model.entity.Topic;
import com.swissclassic.mindflow_server.mindmap.model.entity.TopicRefs;
import com.swissclassic.mindflow_server.mindmap.repository.TopicRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
public class TopicService {

    private final ChatRoomService chatRoomService;
    private final ChatLogService chatLogService;
    private final TopicRepository topicRepository;
    private final ConversationSummaryService conversationSummaryService;


    @Autowired
    public TopicService(ChatRoomService chatRoomService,
                        ChatLogService chatLogService,
                        TopicRepository topicRepository,
                        ConversationSummaryService conversationSummaryService) {
        this.chatRoomService = chatRoomService;
        this.chatLogService = chatLogService;
        this.topicRepository = topicRepository;
        this.conversationSummaryService = conversationSummaryService;
    }

    public TopicDTO getTopicByUserId(String userId) {
        List<Map<String, Object>> results = topicRepository.getTopicByUserId(userId);

        if (results.isEmpty()) {
            return null;
        }

        Map<String, Object> result = results.get(0);

        TopicDTO dto = new TopicDTO();
        dto.setAccountId((String) result.get("accountId"));
        dto.setNodes((List<TopicDTO.NodeDTO>) result.get("nodes"));
        dto.setRelationships((List<TopicDTO.RelationshipDTO>) result.get("relationships"));
        dto.setUserId(userId);

        return dto;
    }

    public TopicDTO getMindMapByUserAndChatRoom(String userId, String chatRoomId) {
        List<Map<String, Object>> results = topicRepository.getMindMapByUserAndChatRoom(userId, chatRoomId);

        if (results.isEmpty()) {
            return null;
        }

        Map<String, Object> result = results.get(0);

        TopicDTO dto = new TopicDTO();
        dto.setAccountId((String) result.get("accountId"));
        dto.setChatRoomId((String) result.get("chatRoomId"));
        dto.setNodes((List<TopicDTO.NodeDTO>) result.get("nodes"));
        dto.setRelationships((List<TopicDTO.RelationshipDTO>) result.get("relationships"));
        dto.setUserId(userId);

        return dto;
    }

    public void deleteSubtopics(String elementId) {
        topicRepository.deleteSubtopicsByElementId(elementId);
    }


    // 주제 분리
    @Transactional
    public Long seperateTopic(String elementId, Long creatorId) {
        log.info("Starting topic separation for elementId: {}", elementId);

        // 1. 선택한 노드의 mongo_ref와 chatRoomId 가져오기
        TopicRefs refs = topicRepository.findMongoRefAndChatRoomId(elementId);
        log.info("Found TopicRefs - mongoRef: {}, chatRoomId: {}",
                refs.getMongo_ref(), refs.getChat_room_id());

        // MongoDB에서 원본 대화 내용 가져오기
        ChatLog chatLog = chatLogService.findByMongoRef(refs.getMongo_ref());
        if (chatLog == null) {
            log.error("Original chat log not found for mongoRef: {}", refs.getMongo_ref());
            throw new RuntimeException("Original chat log not found");
        }

        log.info("------------------------------------------------------------------------------");

        // 2. 새로운 채팅방 생성 - getTitle 사용하고 creatorId 전달
        String newTitle = chatRoomService.getTitle(chatLog.getQuestion());
        ChatRoom newChatRoom = chatRoomService.createChatRoom(
                newTitle,
                creatorId
        );
        Long newChatRoomId = newChatRoom.getId();
        log.info("Created new chat room with ID: {} and title: {}", newChatRoomId, newTitle);

        log.info("-------------------------------------------------------------------------------");

        // ChatController의 /choiceModel처럼 ConversationSummary 저장
        try {

            if (chatLog != null) {
                ConversationSummary summary = new ConversationSummary();
                summary.setChatRoomId(newChatRoomId);
                summary.setTimestamp(String.valueOf(Instant.now()));

                // /choiceModel처럼 User와 AI 대화 형식으로 저장
                String summaryContent = String.format("User:%s\nAI:%s",
                        chatLog.getQuestion(),
                        chatLog.getAnswerSentences().stream()
                                .map(AnswerSentence::getContent)
                                .collect(Collectors.joining("\n"))
                );
                summary.setSummaryContent(summaryContent);

                // MongoDB의 conversation_summaries 컬렉션에 저장
                conversationSummaryService.saveConversationSummary(summary);
                log.info("Saved conversation summary for new chat room: {}", newChatRoomId);
            }
        } catch (Exception e) {
            log.error("Error saving conversation summary", e);
        }

        log.info("--------------------------------------------------------------------------");

        // 3. MongoDB 데이터 복사 및 업데이트
        if (refs.getMongo_ref() != null && refs.getChat_room_id() != null) {
            try {
                long oldChatRoomId = Long.parseLong(refs.getChat_room_id());

                chatLogService.copyAndUpdateChatLog(
                        refs.getMongo_ref(),
                        oldChatRoomId,
                        newChatRoomId
                );
                log.info("Successfully copied chat log");
            } catch (NumberFormatException e) {
                log.error("Error parsing chatRoomId: {}", refs.getChat_room_id(), e);
                throw e;
            } catch (Exception e) {
                log.error("Error copying chat log", e);
                throw e;
            }
        } else {
            log.warn("Missing mongoRef or chatRoomId. mongoRef: {}, chatRoomId: {}",
                    refs.getMongo_ref(), refs.getChat_room_id());
        }

        // 4. Neo4j 토픽 분리 및 chat_room_id 업데이트
        topicRepository.separateTopicAndUpdateChatRoom(
                elementId,
                String.valueOf(newChatRoomId)
        );
        log.info("Successfully updated Neo4j relationships");

        return newChatRoomId;
    }


    public void deleteMindMapByChatRoomId(long chatRoomId) {
        topicRepository.deleteMindMapByChatRoomId(chatRoomId);
    }



}