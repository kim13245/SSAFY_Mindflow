package com.swissclassic.mindflow_server.conversation.model.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatAllResponse {

    private List<String> models; // "models" 필드 매핑
    @JsonProperty("user_input")
    private String userInput; // "user_input" 필드 매핑
    private Map<String, ModelResponse> responses; // "responses" 필드 매핑

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelResponse {
        private String response;
        @JsonProperty("detail_model")
        private String detailModel;
    }
}
