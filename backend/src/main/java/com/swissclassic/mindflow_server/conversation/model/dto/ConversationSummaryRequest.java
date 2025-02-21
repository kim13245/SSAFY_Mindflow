package com.swissclassic.mindflow_server.conversation.model.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationSummaryRequest {
    private String userInput;
    private String answer;
    private Long creatorId;
    String model;
    String detailModel;
}
