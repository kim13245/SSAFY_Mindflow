//package com.swissclassic.mindflow_server.export.service;
//
//import com.swissclassic.mindflow_server.conversation.model.entity.AnswerSentence;
//import com.swissclassic.mindflow_server.conversation.model.entity.ChatLog;
//import com.swissclassic.mindflow_server.conversation.repository.ChatLogRepository;
//import com.swissclassic.mindflow_server.conversation.repository.LlmProvidersRepository;
//import com.swissclassic.mindflow_server.conversation.repository.ModelVersionRepository;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDateTime;
//import java.time.format.DateTimeFormatter;
//import java.util.List;
//import java.util.stream.Collectors;
//
//@Service
//@Slf4j
//public class ExportMarkdownService {
//    @Autowired
//    private ChatLogRepository chatLogRepository;
//    @Autowired
//    private ModelVersionRepository modelVersionRepository;
//    @Autowired
//    private LlmProvidersRepository llmProvidersRepository;
//
//    public String exportChatToMarkdown(Long chatRoomId) {
//        List<ChatLog> chatLogs = chatLogRepository.findByChatRoomIdOrderByCreatedAtAsc(chatRoomId);
//        if (chatLogs.isEmpty()) {
//            return "No chats available";
//        }
//        StringBuilder markdown = new StringBuilder();
//
//        // Add title
//        markdown.append("# Chat Log\n\n");
//        markdown.append("*Exported on: ")
//                .append(LocalDateTime.now())
//                .append("*\n\n");
//
//        // Add messages
//        for (ChatLog log : chatLogs) {
//
//            String modelSpecificName = modelVersionRepository.findFirstById(log.getModelVersionId())
//                                                             .getName();
//            long llmProviderId = modelVersionRepository.findFirstById(log.getModelVersionId())
//                                                       .getProviderId();
//            String providerName = llmProvidersRepository.findFirstById(llmProviderId)
//                                                        .getName();
//            List<AnswerSentence> sentences = log.getAnswerSentences();
//            String content = sentences.stream()
//                                      .map(AnswerSentence::getContent)
//                                      .filter(str -> str != null && !str.trim()
//                                                                        .isEmpty())
//                                      .collect(Collectors.joining(" "));
//
//            markdown.append("**User:**\n")
//                    // Add content
//                    .append(log.getQuestion())
//                    .append("\n")
//                    // Add timestamp
//                    .append("<sub>")
//                    .append(log.getCreatedAt()
//                               .format(
//                                       DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
//                               ))
//                    .append("</sub>\n")
//                    .append("---\n")
//                    .append("**AI (")
//                    .append(providerName)
//                    .append(" ")
//                    .append(modelSpecificName)
//                    .append("):**\n")
//                    .append(content)
//                    .append("\n")
//                    // Add separator
//                    .append("---\n");
//        }
//
//        return markdown.toString();
//    }
//}
