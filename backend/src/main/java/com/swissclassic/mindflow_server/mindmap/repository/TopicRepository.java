package com.swissclassic.mindflow_server.mindmap.repository;

import com.swissclassic.mindflow_server.mindmap.model.entity.Topic;

import com.swissclassic.mindflow_server.mindmap.model.entity.TopicRefs;

import jakarta.transaction.Transactional;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface TopicRepository extends Neo4jRepository<Topic, String> {

    @Query("""
        MATCH (n:Topic)
        WHERE n.creator_id = $userId
        OPTIONAL MATCH (n)-[r]->(m:Topic)
        RETURN {
            userId: $userId, 
            nodes: collect(DISTINCT {
                id: elementId(n),
                title: n.title,
                content: n.content,
                mongoRef: n.mongo_ref,
                accountId: n.account_id,
                chatRoomId: n.chat_room_id,
                chatRoomTitle: n.chat_room_title,
                createdAt: n.created_at
            }),
            relationships: collect(
                CASE 
                    WHEN r IS NOT NULL 
                    THEN {
                        source: elementId(startNode(r)),
                        target: elementId(endNode(r)),
                        type: type(r)
                    }
                    ELSE null
                END
            )
        } AS result
    """)
    List<Map<String, Object>> getTopicByUserId(String userId);

    @Query("""
    MATCH (n:Topic)
    WHERE n.creator_id = $userId AND n.chat_room_id = $chatRoomId
    OPTIONAL MATCH (n)-[r]->(m:Topic)
    RETURN {
        userId: $userId, 
        chatRoomId: $chatRoomId,
        nodes: collect(DISTINCT {
            id: elementId(n),
            title: n.title,
            content: n.content,
            mongoRef: n.mongo_ref,
            accountId: n.account_id,
            chatRoomId: n.chat_room_id,
            chatRoomTitle: n.chat_room_title,
            createdAt: n.created_at
        }),
        relationships: collect(
            CASE 
                WHEN r IS NOT NULL 
                THEN {
                    source: elementId(startNode(r)),
                    target: elementId(endNode(r)),
                    type: type(r)
                }
                ELSE null
            END
        )
    } AS result
""")
    List<Map<String, Object>> getMindMapByUserAndChatRoom(String userId, String chatRoomId);

    @Query("""
            MATCH (n)-[r:HAS_SUBTOPIC*0..]->(m) 
            WHERE elementId(n) = $elementId 
            DETACH DELETE m
            """)
    void deleteSubtopicsByElementId(String elementId);


    // 주제 분리

    // 선택한 노드의 mongo_ref와 chatRoomId 조회
    @Query("""
        MATCH (n:Topic)
        WHERE elementId(n) = $elementId
        RETURN n.mongo_ref as mongo_ref, n.chat_room_id as chat_room_id
    """)
    TopicRefs findMongoRefAndChatRoomId(String elementId);


    // 선택한 노드와 그 하위 노드들의 chatRoomId 업데이트 및 부모와의 관계 제거
    @Query("""
        MATCH (n:Topic)
        WHERE elementId(n) = $elementId
        // 부모 노드와의 관계 찾기
        OPTIONAL MATCH (parent:Topic)-[r]->(n)
        // 하위 노드들 찾기 (n 포함)
        WITH n, r, parent
        MATCH (n)-[*0..]->(descendant:Topic)
        WITH COLLECT(descendant) as nodesToUpdate, r
        // 1. 부모와의 관계 삭제
        DELETE r
        // 2. 모든 연관 노드의 chat_room_id 업데이트
        WITH nodesToUpdate
        UNWIND nodesToUpdate as node
        SET node.chat_room_id = $newChatRoomId
        RETURN COUNT(node) as updatedNodes
    """)
    void separateTopicAndUpdateChatRoom(String elementId, String newChatRoomId);

    @Transactional
    @Query("MATCH (n:YourLabel {userId: $userId}) DETACH DELETE n")
    void deleteAllByUserId(Long userId);

    @Query("""
            MATCH (n:Topic)
            WHERE n.chat_room_id = toString($chatRoomId)
            WITH n
            OPTIONAL MATCH (n)-[r]-()
            DELETE r, n
            """)
    void deleteMindMapByChatRoomId(long chatRoomId);

}
