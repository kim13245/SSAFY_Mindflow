import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMindmapData } from "../api/mindmap";
import Mindmap from "../components/feature/Mindmap";

const MindmapPage = ({ setRefreshTrigger, onChatRoomSelect }) => {
  const { chatRoomId, id } = useParams();
  const [mindmapData, setMindmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMindmapData = async () => {
      try {
        setLoading(true);
        let data;
        
        if (id) {
          // /mindmap/node/:id 패턴일 때
          data = await fetchMindmapData(null, id);
        } else if (chatRoomId) {
          // /mindmap/room/:chatRoomId 패턴일 때
          data = await fetchMindmapData(chatRoomId);
        } else {
          // /mindmap/ 패턴일 때
          data = await fetchMindmapData();
        }

        setMindmapData({
          ...data,
          viewType: id ? 'node' : chatRoomId ? 'room' : 'all'
        });
      } catch (error) {
        console.error('마인드맵 데이터 로딩 실패:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    loadMindmapData();
  }, [chatRoomId, id]);

  // const handleDataUpdate = async () => {
  //   const updatedData = await fetchMindmapData(chatRoomId);
  //   setMindmapData(updatedData);
  // };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러가 발생했습니다.</div>;
  if (!mindmapData) return null;

  // 모든 경우에 Mindmap 컴포넌트 사용
  return <Mindmap data={mindmapData} setRefreshTrigger={setRefreshTrigger} onChatRoomSelect={onChatRoomSelect} />;
};

export default MindmapPage;
