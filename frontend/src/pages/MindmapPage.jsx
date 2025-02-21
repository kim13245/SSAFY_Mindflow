import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMindmapData } from "../api/mindmap";
import Mindmap from "../components/feature/Mindmap";
import Mindmaproom from "../components/feature/Mindmaproom";
import Mindmaproomdetail from "../components/feature/Mindmaproomdetail";

const MindmapPage = () => {
  const { chatRoomId, id } = useParams();
  const [mindmapData, setMindmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMindmapData = async () => {
      try {
        setLoading(true);
        const data = await fetchMindmapData(chatRoomId);
        setMindmapData(data);
      } catch (error) {
        console.error('마인드맵 데이터 로딩 실패:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    loadMindmapData();
  }, [chatRoomId]);

  // const handleDataUpdate = async () => {
  //   const updatedData = await fetchMindmapData(chatRoomId);
  //   setMindmapData(updatedData);
  // };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러가 발생했습니다.</div>;
  if (!mindmapData) return null;

  // URL 패턴에 따라 적절한 컴포넌트 렌더링
  if (id) {
    // /mindmap/node/:id 패턴
    return <Mindmaproomdetail data={mindmapData} />;
  } else if (chatRoomId) {
    // /mindmap/room/:chatRoomId 패턴
    return <Mindmaproom data={mindmapData} />;
  } else {
    // /mindmap/ 패턴
    return <Mindmap data={mindmapData} />;
  }
};

export default MindmapPage;
