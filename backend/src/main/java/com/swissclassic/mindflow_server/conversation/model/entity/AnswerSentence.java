package com.swissclassic.mindflow_server.conversation.model.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.UUID;

@Data
@AllArgsConstructor
public class AnswerSentence {
    private String sentenceId;
    private String content;
}
