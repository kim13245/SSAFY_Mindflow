package com.swissclassic.mindflow_server.conversation.model.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TitleRequest {
    private String userInput;
}