import axios from "axios"
// import testchatroomData from './testchatroom.json';
import { store } from "../store/store" // store.js에서 store import

const BASE_URL = import.meta.env.VITE_API_BASE_URL


export const fetchMindmapData = async (chatRoomId = null, nodeId = null) => {
  try {
    // Redux store에서 auth 상태 가져오기
    const authState = store.getState().auth
    console.log('유저정보:', authState);
    console.log('BASE_URL:', BASE_URL); 

    // // 사용자 정보 상세 출력
    // if (authState.user) {
    //   console.log('User ID:', authState.user.userId);
    //   console.log('Display Name:', authState.user.displayName);
    //   console.log('Access Token:', authState.user.accessToken);
    // }

    const endpoint = `/api/mindmaps/${authState.user.userId}`
    console.log(`Fetching from: ${BASE_URL}${endpoint}`)

    const response = await axios.get(`${BASE_URL}${endpoint}`)
    console.log("Response data:", response.data)

    // mindmap 객체에서 data를 추출하고 기본값 설정
    const mindmapData = response.data.data || response.data || { nodes: [], relationships: [] }

    // 노드 ID가 이상한 경우를 걸러내기
    const validNodes = mindmapData.nodes.filter(node => node.id && node.id.trim() !== '');
    const validNodeIds = new Set(validNodes.map(node => node.id));

    // 연결 관계를 통해 누락된 노드 복구
    mindmapData.relationships.forEach(rel => {
      if (!validNodeIds.has(rel.source)) {
        const missingNode = mindmapData.nodes.find(node => node.id === rel.source);
        if (missingNode) {
          validNodes.push(missingNode);
          validNodeIds.add(missingNode.id);
        }
      }
      if (!validNodeIds.has(rel.target)) {
        const missingNode = mindmapData.nodes.find(node => node.id === rel.target);
        if (missingNode) {
          validNodes.push(missingNode);
          validNodeIds.add(missingNode.id);
        }
      }
    });

    // 유효한 노드와 관계로 데이터 구성
    const validRelationships = mindmapData.relationships.filter(rel => 
      validNodeIds.has(rel.source) && validNodeIds.has(rel.target)
    );

    if (nodeId) {
      // 특정 노드와 연결된 모든 노드 복구
      const connectedNodes = new Set();
      const findAllConnectedNodes = (currentId) => {
        if (connectedNodes.has(currentId)) return;
        connectedNodes.add(currentId);

        mindmapData.relationships
          .filter(rel => rel.source === currentId || rel.target === currentId)
          .forEach(rel => {
            findAllConnectedNodes(rel.source);
            findAllConnectedNodes(rel.target);
          });
      };

      findAllConnectedNodes(nodeId);

      return {
        nodes: validNodes.filter(node => connectedNodes.has(node.id)),
        relationships: validRelationships.filter(rel => 
          connectedNodes.has(rel.source) && connectedNodes.has(rel.target)
        )
      };
    } else if (chatRoomId) {
      // 특정 채팅방과 연결된 모든 노드 복구
      return {
        nodes: validNodes.filter(node => node.chatRoomId === chatRoomId),
        relationships: validRelationships.filter(rel => {
          const sourceNode = validNodes.find(node => node.id === rel.source);
          return sourceNode && sourceNode.chatRoomId === chatRoomId;
        }),
      };
    }

    return {
      nodes: validNodes,
      relationships: validRelationships
    };
  } catch (error) {
    console.error("마인드맵 데이터 가져오기 실패:", error)
    return { nodes: [], relationships: [] }  // 에러 시 빈 객체 반환
  }
}

// 노드 분리 API
export const splitNode = async (nodeId) => {
  try {
    const authState = store.getState().auth;
    const elementId = nodeId;

    const response = await axios.post(
      `${BASE_URL}/api/mindmaps/seperateTopic/${elementId}/${authState.user.userId}`
    );

    // 서버에서 반환된 newChatRoomId를 반환
    return response.data.newChatRoomId;
  } catch (error) {
    console.error("노드 분리 실패:", error);
    throw error;
  }
};

// 노드 삭제 API
export const deleteNode = async (nodeId) => {
  try {
    // DELETE /api/mindmaps/nodes/{nodeId}
    const response = await axios.delete(`${BASE_URL}/api/mindmaps/deleteSubTopic/${nodeId}`)
    return response.data
  } catch (error) {
    console.error("노드 삭제 실패:", error)
    throw error
  }
}
