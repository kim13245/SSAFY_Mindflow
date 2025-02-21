package com.swissclassic.mindflow_server.mindmap.model.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
@Data
public class TopicDTO {

    private String accountId;
    private String chatRoomId;
    private List<NodeDTO> nodes;
    private List<RelationshipDTO> relationships;

    private String userId;


    // NodeDTO
    @Data
    public static class NodeDTO {
        private String id;
        private String title;
        private String content;
        private String mongoRef;
//        private String accountId;
        private String chatRoomId;
        private LocalDateTime createdAt;

        private Long creatorId;
        private String userId;

    }

    // RelationshipDTO
    @Data
    public static class RelationshipDTO {
        private String source;
        private String target;
        private String type;
    }
}