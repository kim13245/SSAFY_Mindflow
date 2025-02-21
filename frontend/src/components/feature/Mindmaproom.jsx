import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { ForceGraph2D } from "react-force-graph"
import ForceGraph3D from "react-force-graph-3d"
import SpriteText from "three-spritetext"
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer"
import { fetchMindmapData, deleteNode } from '../../api/mindmap'
import PropTypes from "prop-types"
import { useNavigate, useParams } from "react-router-dom"
import * as d3 from "d3"


const extraRenderers = [new CSS2DRenderer()]

// 모드 상태를 저장하기 위한 전역 변수나 localStorage 사용
const setViewMode = (is3D) => {
  localStorage.setItem('viewMode', is3D ? '3d' : '2d');
};

const getViewMode = () => {
  return localStorage.getItem('viewMode') === '3d';
};

const Mindmaproomdetail = ({ data }) => {
  const { chatRoomId, id } = useParams();
  const [is3D, setIs3D] = useState(getViewMode())
  const graphRef = useRef()
  const navigate = useNavigate()
  const [hoverNode, setHoverNode] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [isNodeFocused, setIsNodeFocused] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [hoverLegend, setHoverLegend] = useState(false)
  const [localData, setLocalData] = useState(data);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [fixedPosition, setFixedPosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef(null);
  const clickTimerRef = useRef(null);
  const [fixedNode, setFixedNode] = useState(null);
  const doubleClickTimerRef = useRef(null);
  const [lastClickedNode, setLastClickedNode] = useState(null);
  const [isGraphStable, setIsGraphStable] = useState(false);
  const [isCameraMoving, setIsCameraMoving] = useState(false);
  const lastCameraPositionRef = useRef(null);
  const stabilityTimeoutRef = useRef(null);
  const cameraTimeoutRef = useRef(null);

  // is3D 상태가 변경될 때마다 저장
  useEffect(() => {
    setViewMode(is3D);
  }, [is3D]);

  // 데이터가 변경될 때 localData 업데이트
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const processedData = useMemo(() => {
    // localData를 사용하도록 변경
    const filteredNodes = localData.nodes.filter(node => 
      node.chatRoomId === chatRoomId
    );

    // 필터링된 노드들의 ID Set 생성
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

    // 필터링된 노드들 간의 관계만 추출
    const filteredRelationships = localData.relationships.filter(rel =>
      filteredNodeIds.has(rel.source) && filteredNodeIds.has(rel.target)
    );

    // 노드의 깊이(depth) 계산 함수
    const calculateDepth = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return 0;
      visited.add(nodeId);

      const relationships = localData.relationships.filter(rel => rel.source === nodeId);
      if (relationships.length === 0) return 0;

      const childDepths = relationships.map(rel => calculateDepth(rel.target, visited));
      return 1 + Math.max(...childDepths);
    };

    // 노드의 레벨(level) 계산 함수
    const calculateLevel = (nodeId, parentId = null, level = 0, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = localData.nodes.find(n => n.id === nodeId);
      if (node) {
        node.level = level;
      }

      const children = localData.relationships
        .filter(rel => rel.source === nodeId)
        .map(rel => rel.target);

      children.forEach(childId => {
        calculateLevel(childId, nodeId, level + 1, visited);
      });
    };

    // 루트 노드 찾기 (필터링된 노드들 중에서)
    const rootNodes = filteredNodes
      .filter(node => !filteredRelationships.some(rel => rel.target === node.id))
      .map(node => node.id);

    rootNodes.forEach(rootId => calculateLevel(rootId));

    // 색상 배열 정의
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const rootColor = '#FF6B6B';

    const nodes = filteredNodes.map(node => {
      const isRoot = !filteredRelationships.some(rel => rel.target === node.id);
      return {
        ...node,
        color: isRoot ? rootColor : colors[node.level % colors.length],
        isRoot
      }
    });

    const links = filteredRelationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      type: rel.type
    }));

    // cross-link node objects
    links.forEach(link => {
      const a = nodes.find(node => node.id === link.source);
      const b = nodes.find(node => node.id === link.target);

      !a.neighbors && (a.neighbors = []);
      !b.neighbors && (b.neighbors = []);
      a.neighbors.push(b);
      b.neighbors.push(a);

      !a.links && (a.links = []);
      !b.links && (b.links = []);
      a.links.push(link);
      b.links.push(link);
    });

    return { nodes, links };
  }, [localData, chatRoomId]);

  // 루트 노드까지의 경로를 찾는 함수 추가
  const findPathToRoot = useCallback((nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    // 현재 노드가 루트 노드인지 확인
    const isRoot = !localData.relationships.some(rel => rel.target === nodeId);
    if (isRoot) return [nodeId];

    // 부모 노드들 찾기
    const parentRels = localData.relationships.filter(rel => rel.target === nodeId);
    
    for (const rel of parentRels) {
      const path = findPathToRoot(rel.source, visited);
      if (path) {
        return [...path, nodeId];
      }
    }
    
    return null;
  }, [localData.relationships]);

  // 노드 선택 시 해당 노드로 카메라 이동하는 함수 수정
  const handleNodeSelect = useCallback((node) => {
    // 선택된 노드 상태 업데이트
    setSelectedNode(node);
    // 검색창 초기화
    setSearchTerm("");
    setSearchResults([]);

    // 그래프 참조가 존재할 경우에만 카메라 이동 실행
    if (graphRef.current) {
      if (is3D) {
        // 3D 모드에서의 카메라 이동 - 확대 없이 중앙 이동만
        const distance = 100; // 기존 40에서 100으로 증가하여 더 멀리서 보기
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

        graphRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          2000
        );
      } else {
        // 2D 모드에서의 카메라 이동 - 확대 없이 중앙 이동만
        graphRef.current.centerAt(node.x, node.y, 1000);
        // zoom 관련 코드 제거
      }
    }
  }, [is3D]); // is3D 상태가 변경될 때마다 함수 재생성

  // 노드 크기를 텍스트 길이에 따라 동적으로 계산
  const getNodeSize = (text, ctx, fontSize) => {
    ctx.font = `${fontSize}px Sans-Serif`
    const textWidth = ctx.measureText(text || "").width
    const padding = 16 // 텍스트 좌우 패딩
    return {
      width: textWidth + padding,
      height: fontSize + padding / 2, // 텍스트 높이 + 상하 패딩
    }
  }

  // 노드 크기 캐시
  const nodeSizes = useMemo(() => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    const fontSize = 12

    return processedData.nodes.reduce((sizes, node) => {
      sizes[node.id] = getNodeSize(node.title, context, fontSize)
      return sizes
    }, {})
  }, [processedData.nodes])

  // 노드 클릭 핸들러 수정
  const handleNodeClick = useCallback((node, event) => {
    // Ctrl + 클릭으로 노드 고정/해제
    if (event.ctrlKey) {
      if (node.fx !== undefined && node.fy !== undefined) {
        // 고정 해제
        node.fx = undefined;
        node.fy = undefined;
        if (is3D) {
          node.fz = undefined;
        }
      } else {
        // 현재 위치에 고정
        node.fx = node.x;
        node.fy = node.y;
        if (is3D) {
          node.fz = node.z;
        }
      }
      return;
    }

    // 기존의 더블클릭 및 클릭 로직
    if (lastClickedNode && lastClickedNode.id === node.id) {
      if (doubleClickTimerRef.current) {
        clearTimeout(doubleClickTimerRef.current);
        doubleClickTimerRef.current = null;
        
        // 루트 노드(chatroom)인 경우
        if (node.isRoot) {
          const chatRoomId = node.id.replace('root_', '');
          navigate(`/mindmap/node/${node.id}`);
        } else {
          // 일반 노드인 경우
          navigate(`/mindmap/node/${node.id}`);
        }
        
        setLastClickedNode(null);
        return;
      }
    }

    // 첫 번째 클릭 또는 단일 클릭
    setLastClickedNode(node);
    doubleClickTimerRef.current = setTimeout(() => {
      doubleClickTimerRef.current = null;
      setLastClickedNode(null);
      
      // 카메라 이동
      if (graphRef.current) {
        if (is3D) {
          const distance = 100;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
          graphRef.current.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
            node,
            2000
          );
        } else {
          graphRef.current.centerAt(node.x, node.y, 1000);
        }
      }
      
      // 설명창 고정/해제 토글 및 위치 저장
      setFixedNode(prev => prev?.id === node.id ? null : node);
      setFixedPosition({ x: mousePosition.x, y: mousePosition.y });
    }, 300);
  }, [lastClickedNode, navigate, is3D, mousePosition, graphRef]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (doubleClickTimerRef.current) {
        clearTimeout(doubleClickTimerRef.current);
      }
    };
  }, []);

  // 노드 분리 핸들러 수정
  const handleNodeSplit = useCallback(async () => {
    try {
      if (!selectedNodeForEdit) {
        console.error('선택된 노드가 없습니다.');
        return;
      }

      // 먼저 UI에서 노드를 분리
      setLocalData(prevData => {
        const updatedRelationships = prevData.relationships.filter(rel => 
          !(rel.target === selectedNodeForEdit.id)
        );

        return {
          nodes: prevData.nodes,
          relationships: updatedRelationships
        };
      });

      // UI 업데이트 후 서버에 분리 요청
      await splitNode(selectedNodeForEdit.id);
      setSelectedNodeForEdit(null);
      setShowNodeModal(false);
    } catch (error) {
      console.error('노드 분리 중 오류 발생:', error);
      setLocalData(data);
      alert('노드 분리에 실패했습니다.');
    }
  }, [selectedNodeForEdit, data]);

  // 노드 삭제 핸들러 수정
  const handleNodeDelete = useCallback(async () => {
    try {
      if (!fixedNode) return;

      // 먼저 UI에서 노드를 제거
      setLocalData(prevData => {
        const updatedNodes = prevData.nodes.filter(node => node.id !== fixedNode.id);
        const updatedRelationships = prevData.relationships.filter(rel => 
          rel.source !== fixedNode.id && rel.target !== fixedNode.id
        );

        return {
          nodes: updatedNodes,
          relationships: updatedRelationships
        };
      });

      // UI 업데이트 후 서버에 삭제 요청
      await deleteNode(fixedNode.id);
      setFixedNode(null);
    } catch (error) {
      console.error('노드 삭제 중 오류 발생:', error);
      // 삭제 실패 시 원래 데이터로 복구
      setLocalData(data);
      alert('노드 삭제에 실패했습니다.');
    }
  }, [fixedNode, data]);

  // 노드 색상을 원래대로 되돌리기
  const getNodeColor = (node) => {
    if (node.isRoot) {
      return "rgba(255,107,107,0.9)";  // 루트 노드 색상
    }
    
    const isDirectlyConnectedToChatRoom = processedData.links.some(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const isChatRoomNode = sourceId.startsWith('root_') || targetId.startsWith('root_');
      return isChatRoomNode && (sourceId === node.id || targetId === node.id);
    });
    
    return isDirectlyConnectedToChatRoom 
      ? "rgba(147,51,234,0.5)"   // chatroom 노드와 연결된 노드 색상
      : "rgba(66,153,225,0.5)";  // 일반 노드 색상
  };

  // 링크 색상을 관계 타입에 따라 설정
  const getLinkColor = (link) => {
    const isChatRoomLink = 
      (typeof link.source === 'object' && link.source.id.startsWith('root_')) ||
      (typeof link.target === 'object' && link.target.id.startsWith('root_')) ||
      (typeof link.source === 'string' && link.source.startsWith('root_')) ||
      (typeof link.target === 'string' && link.target.startsWith('root_'));

    if (isChatRoomLink) {
      return 'rgba(255,255,255,0.5)';
    }

    switch (link.type) {
      case "RELATED_TO":
        return "rgba(52,211,153,0.6)";
      case "HAS_SUBTOPIC":
        return "rgba(99,102,241,0.6)";
      case "COMPARE_TO":
        return "rgba(236,72,153,0.6)";
      default:
        return "rgba(255,255,255,0.8)";
    }
  };

  // 링크 두께 설정 함수 추가
  const getLinkWidth = (link, isHighlighted) => {
    if (!isHighlighted) {
      return 1; // 하이라이트되지 않은 링크는 기본 두께
    }
    return 3; // 하이라이트된 링크는 두껍게
  };

  // 마우스 이동 이벤트 핸들러
  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  // 컴포넌트 마운트 시 이벤트 리스너 추가
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // useEffect 수정: 카메라를 그래프 중앙에 위치시키기
  useEffect(() => {
    if (graphRef.current && !is3D) {
      // 2D 모드일 때 초기 줌 레벨 설정
      graphRef.current.zoom(0.7);
      
      // 그래프의 중심점 계산
      if (processedData.nodes.length > 0) {
        const xSum = processedData.nodes.reduce((sum, node) => sum + (node.x || 0), 0);
        const ySum = processedData.nodes.reduce((sum, node) => sum + (node.y || 0), 0);
        const xCenter = xSum / processedData.nodes.length;
        const yCenter = ySum / processedData.nodes.length;
        
        // 계산된 중심점으로 카메라 이동
        graphRef.current.centerAt(xCenter, yCenter, 1000);
      }
    }
  }, [is3D, processedData.nodes]); // processedData.nodes 의존성 추가

  // 키보드 이벤트 핸들러 추가
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFixedNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 설명창 외부 클릭 핸들러
  const handleOutsideClick = useCallback((e) => {
    if (fixedNode && !e.target.closest('.node-info-popup')) {
      setFixedNode(null);
    }
  }, [fixedNode]);

  useEffect(() => {
    if (fixedNode) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [fixedNode, handleOutsideClick]);

  // 그래프 안정성 체크 함수
  const checkGraphStability = useCallback((positions) => {
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current);
    }
    
    stabilityTimeoutRef.current = setTimeout(() => {
      setIsGraphStable(true);
    }, 300); // 300ms 동안 움직임이 없으면 안정된 것으로 간주
    
    setIsGraphStable(false);
  }, []);

  // 카메라 움직임 체크 함수
  const checkCameraMovement = useCallback((cameraPosition) => {
    if (cameraTimeoutRef.current) {
      clearTimeout(cameraTimeoutRef.current);
    }

    if (!lastCameraPositionRef.current) {
      lastCameraPositionRef.current = cameraPosition;
      return;
    }

    const hasChanged = JSON.stringify(lastCameraPositionRef.current) !== JSON.stringify(cameraPosition);
    if (hasChanged) {
      setIsCameraMoving(true);
      lastCameraPositionRef.current = cameraPosition;

      cameraTimeoutRef.current = setTimeout(() => {
        setIsCameraMoving(false);
      }, 300); // 300ms 동안 카메라 움직임이 없으면 정지된 것으로 간주
    }
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current);
      }
      if (cameraTimeoutRef.current) {
        clearTimeout(cameraTimeoutRef.current);
      }
    };
  }, []);

  // 3D 그래프의 nodeThreeObject 수정
  const nodeThreeObject = useCallback((node) => {
    if (!isGraphStable || isCameraMoving) {
      // 움직이는 동안에는 기본 구체만 표시
      return null;
    }

    const sprite = new SpriteText(node.title);
    const isHighlighted = false;
    
    const baseSize = node.isRoot ? 10 : 8;
    
    sprite.backgroundColor = getNodeColor(node);
    sprite.textHeight = baseSize;
    sprite.padding = baseSize * 0.5;
    sprite.borderRadius = baseSize;
    
    if (node.title.length > 10) {
      sprite.text = node.title.substring(0, 10) + '...';
    }
    
    return sprite;
  }, [isGraphStable, isCameraMoving]);

  // 2D 그래프의 nodeCanvasObject 수정
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const fontSize = node.isRoot ? 32 : 26;
    const { width, height } = getNodeSize(node.title, ctx, fontSize);
    const isHighlighted = false;
    const radius = 16;

    ctx.save();

    // 노드 배경 그리기
    ctx.beginPath();
    ctx.roundRect(
      node.x - width / 2 - radius,
      node.y - height / 2 - radius,
      width + radius * 2,
      height + radius * 2,
      radius
    );
    
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();

    // 테두리 설정
    if (isHighlighted || (node.fx !== undefined && node.fy !== undefined)) {
      ctx.strokeStyle = node === hoverNode 
        ? "#ff4444"
        : node.fx !== undefined 
          ? "#FFD700"
          : "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 2D 모드에서는 항상 텍스트 표시
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(node.title, node.x, node.y);

    ctx.restore();

    node.size = Math.max(width, height);
    node.width = width;
    node.height = height;
  }, [hoverNode, getNodeSize]);

  // useEffect 수정: 2D/3D 모드에 따른 힘 설정
  useEffect(() => {
    if (graphRef.current) {
      if (is3D) {
        // 3D 모드: 기존 설정 유지
        graphRef.current.d3Force("charge").strength(-60);
        graphRef.current.d3Force("link").distance(100);
      } else {
        // 2D 모드: 노드 간 거리 증가
        graphRef.current.d3Force("charge").strength(-800);  // 반발력 증가
        graphRef.current.d3Force("link").distance(200);     // 링크 길이 증가
        
        // 추가적인 반발력 설정
        graphRef.current.d3Force("repulsion", d3.forceManyBody().strength((node) => {
          const hasLinks = processedData.links.some(
            link => link.source === node || link.target === node
          );
          return hasLinks ? -800 : -1600;  // 연결된 노드와 연결되지 않은 노드의 반발력 차등 적용
        }));
      }
    }
  }, [is3D, processedData.links]);

  // 검색어 변경 시 결과 필터링을 위한 useEffect 추가
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchLowerCase = searchTerm.toLowerCase();
    const filteredNodes = processedData.nodes.filter(node => 
      node.title?.toLowerCase().includes(searchLowerCase) ||
      node.content?.toLowerCase().includes(searchLowerCase)
    );

    setSearchResults(filteredNodes.slice(0, 10)); // 최대 10개 결과만 표시
  }, [searchTerm, processedData.nodes]);

  // 검색창 입력 핸들러 수정
  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
  };

  // 현재 노드 정보 찾기
  const currentNode = useMemo(() => {
    return data.nodes.find(node => node.id === id);
  }, [data.nodes, id]);

  return (
    <div className="relative w-full h-full">
      {/* 검색창 컨테이너 수정 */}
      <div className="absolute left-4 top-4 z-50">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchInput}
            placeholder="노드 검색..."
            className="w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
              {searchResults.map((node) => (
                <div
                  key={node.id}
                  onClick={() => handleNodeSelect(node)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{node.title}</div>
                  {node.content && (
                    <div className="text-sm text-gray-600 truncate">
                      {node.content.length > 50 
                        ? `${node.content.substring(0, 50)}...` 
                        : node.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 편집 모드 체크박스 추가 */}
      <div className="absolute right-4 top-4 z-50">
        {/* ? 버튼 */}
        <button
          className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-gray-700 hover:bg-opacity-100 shadow-lg font-bold"
          onMouseEnter={() => setHoverLegend(true)}
          onMouseLeave={() => setHoverLegend(false)}
          onClick={() => setShowLegend(!showLegend)}
        >
          ?
        </button>

        {/* 색상 범례 - 호버 또는 클릭 시 표시 */}
        {(hoverLegend || showLegend) && (
          <div 
            className="absolute right-10 top-0 bg-white rounded-lg shadow-lg"
            style={{ 
              backgroundColor: showLegend ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
              minWidth: 'max-content'
            }}
          >
            <div className="p-4">
              <h3 className="text-gray-800 font-bold mb-2">연결선 관계 색상 설명</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">루트까지의 경로</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(52,211,153,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">관련 관계</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">하위 주제</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(236,72,153,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">비교 관계</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2D/3D 전환 버튼 */}
      <button
        className="absolute bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg"
        onClick={() => setIs3D(!is3D)}
      >
        {is3D ? '2D로 보기' : '3D로 보기'}
      </button>

      {/* 뒤로가기 버튼 - 현재 노드의 chatRoomId 사용 */}
      <button 
        className="absolute top-4 right-4 z-50 bg-gray-500 text-white px-4 py-2 rounded-lg"
        onClick={() => navigate(`/mindmap/`)}
      >
        전체
      </button>

      {/* 조건부 렌더링으로 2D/3D 그래프 전환 */}
      {is3D ? (
        <ForceGraph3D
          ref={graphRef}
          graphData={processedData}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          width={window.innerWidth - 256}
          height={window.innerHeight - 64}
          backgroundColor="#353A3E"
          nodeColor={getNodeColor}
          linkWidth={2}
          linkColor={getLinkColor}
          linkOpacity={0.8}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.005}
          onNodeHover={node => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }

            if (node) {
              setHoverNode(node);
              document.body.style.cursor = "pointer";
            } else {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverNode(prev => {
                  if (document.querySelector('.fixed:hover')) {
                    return prev;
                  }
                  return null;
                });
                hoverTimeoutRef.current = null;
              }, 100);
              document.body.style.cursor = "default";
            }
          }}
          onNodeClick={(node, event) => handleNodeClick(node, event)}
          enableNavigationControls={true}
          controlType="trackball"
          d3Force="charge"
          d3ForceStrength={-30}
          linkDistance={100}
          cooldownTime={2000}
          cooldownTicks={50}
          nodeResolution={8}
          warmupTicks={50}
          dagMode={null}
          dagLevelDistance={50}
          d3VelocityDecay={0.4}
          d3AlphaMin={0.001}
          d3AlphaDecay={0.02}
          rendererConfig={{
            antialias: false,
            precision: 'lowp'
          }}
          onEngineStop={() => setIsGraphStable(true)}
          onNodeDragStart={() => setIsGraphStable(false)}
          onNodeDrag={() => setIsGraphStable(false)}
          onCameraOrbit={() => setIsCameraMoving(true)}
          onCameraMove={(cameraPosition) => checkCameraMovement(cameraPosition)}
        />
      ) : (
        <ForceGraph2D
          ref={graphRef}
          graphData={processedData}
          width={window.innerWidth - 256}
          height={window.innerHeight - 64}
          nodeRelSize={1}
          nodeVal={1}
          nodeColor={getNodeColor}
          nodeOpacity={1}
          nodeCanvasObjectMode={() => "replace"}
          nodeCanvasObject={nodeCanvasObject}
          linkWidth={1}
          linkColor={getLinkColor}
          linkOpacity={0.8}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={4}
          linkDirectionalParticleSpeed={0.005}
          onNodeHover={(node) => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
              hoverTimeoutRef.current = null;
            }

            if (node) {
              setHoverNode(node);
              document.body.style.cursor = "pointer";
            } else {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverNode(prev => {
                  if (document.querySelector('.fixed:hover')) {
                    return prev;
                  }
                  return null;
                });
                hoverTimeoutRef.current = null;
              }, 100);
              document.body.style.cursor = "default";
            }
          }}
          d3Force="charge"
          d3ForceStrength={-200} // 확산형 배치를 위한 강한 반발력
          linkDistance={200}     // 긴 링크 거리
          nodeLabel={(node) => ""}
          backgroundColor="#353A3E"
          nodePointerAreaPaint={(node, color, ctx) => {
            const fontSize = node.isRoot ? 32 : 26;
            const { width, height } = getNodeSize(node.title, ctx, fontSize);
            const radius = 16;

            ctx.beginPath();
            // 노드의 전체 영역(배경 포함)을 포인터 영역으로 설정
            ctx.roundRect(
              node.x - width / 2 - radius,
              node.y - height / 2 - radius,
              width + radius * 2,
              height + radius * 2,
              radius
            );
            ctx.fillStyle = color;
            ctx.fill();
          }}
          onNodeClick={(node, event) => handleNodeClick(node, event)}
          cooldownTime={2000}
          cooldownTicks={50}
          nodeResolution={8}
          warmupTicks={50}
          d3VelocityDecay={0.4}
          d3AlphaMin={0.001}
          d3AlphaDecay={0.02}
          onEngineStop={() => setIsGraphStable(true)}
          onNodeDragStart={() => setIsGraphStable(false)}
          onNodeDrag={() => setIsGraphStable(false)}
          onZoom={() => setIsCameraMoving(true)}
          onZoomEnd={() => setIsCameraMoving(false)}
        />
      )}

      {/* 호버 노드 설명창 */}
      {hoverNode && !fixedNode && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs node-info-popup"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y + 10,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.5)', // 배경색에 투명도 적용
          }}
        >
          <h3 className="font-bold text-lg mb-2">{hoverNode.title}</h3>
          <p className="text-gray-600 mb-4">{hoverNode.content}</p>
        </div>
      )}

      {/* 고정된 노드 설명창 - 위치 유지 */}
      {fixedNode && (
        <div
          className="fixed bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs node-info-popup"
          style={{
            right: '2rem',
            bottom: '4rem',
            zIndex: 1000,
          }}
        >
          <h3 className="font-bold text-lg mb-2">{fixedNode.title}</h3>
          <p className="text-gray-600 mb-4">{fixedNode.content}</p>
          {/* chatroom 노드가 아닌 경우에만 버튼 표시 */}
          {!fixedNode.id.startsWith('root_') && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigate('/');  // 임시로로 메인 페이지로 이동
                }}
                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
              >
                링크
              </button>
              <button
                onClick={() => handleNodeSplit(fixedNode)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                분리
              </button>
              <button
                onClick={() => handleNodeDelete()}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      {/* 도움말 텍스트 */}
      <div className="absolute left-4 bottom-4 z-50 text-white text-sm bg-gray-800 bg-opacity-75 p-2 rounded">
        <p>클릭: 카메라 이동 및 설명창 고정</p>
        <p>ESC/외부 클릭: 설명창 닫기</p>
        <p>더블클릭: 상세페이지 이동</p>
        <p>Ctrl + 클릭 시 노드의 위치 고정</p>
      </div>
    </div>
  )
}

const CustomNodeComponent = ({ data }) => {
  return (
    <div className="min-w-[150px] p-2">
      <div className="font-bold text-gray-800 mb-1">{data.label}</div>
      {data.description && <div className="text-sm text-gray-600">{data.description}</div>}
      {data.tags && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

CustomNodeComponent.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
}

Mindmaproomdetail.propTypes = {
  data: PropTypes.shape({
    nodes: PropTypes.array,
    relationships: PropTypes.array
  })
};

export default Mindmaproomdetail
