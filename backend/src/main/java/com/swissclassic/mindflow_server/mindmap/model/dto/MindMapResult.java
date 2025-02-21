package com.swissclassic.mindflow_server.mindmap.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class MindMapResult {
    private String userId; // ✅ 최상위 userId 유지
    private String chatRoomId;
    private List<TopicDTO.NodeDTO> nodes;
    private List<TopicDTO.RelationshipDTO> relationships;
}