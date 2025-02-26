import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { ForceGraph2D, ForceGraph3D } from "react-force-graph"
import SpriteText from "three-spritetext"
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer"
import { fetchMindmapData, deleteNode, splitNode } from "../../api/mindmap"
import PropTypes from "prop-types"
import { useNavigate, useLocation } from "react-router-dom"
import * as d3 from "d3"
import { toast } from "react-toastify"
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

// 모드 상태를 저장하기 위한 전역 변수나 localStorage 사용
const setViewMode = (is3D) => {
  localStorage.setItem("viewMode", is3D ? "3d" : "2d")
}

const getViewMode = () => {
  return localStorage.getItem("viewMode") === "3d"
}

const Mindmap = ({ data, onChatRoomSelect, setRefreshTrigger }) => {
  const [is3D, setIs3D] = useState(getViewMode()) // 2D/3D 모드 상태
  const graphRef = useRef() // 그래프 참조
  const navigate = useNavigate() // 라우터 네비게이션
  const location = useLocation() // 현재 경로 가져오기
  const [hoverNode, setHoverNode] = useState(null) // 마우스 오버된 노드
  const [searchTerm, setSearchTerm] = useState("") // 검색어
  const [searchResults, setSearchResults] = useState([]) // 검색 결과 목록
  const [selectedNode, setSelectedNode] = useState(null) // 선택된 노드
  const [isNodeFocused, setIsNodeFocused] = useState(false) // 노드 포커스 상태
  const [showLegend, setShowLegend] = useState(false) // 범례 표시 여부
  const [hoverLegend, setHoverLegend] = useState(false) // 범례에 마우스 오버 상태
  const [localData, setLocalData] = useState(data) // 로컬 데이터 상태
  const [showNodeModal, setShowNodeModal] = useState(false) // 노드 모달 표시 여부
  const [selectedNodeForEdit, setSelectedNodeForEdit] = useState(null) // 편집을 위해 선택된 노드
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }) // 마우스 위치
  const [fixedPosition, setFixedPosition] = useState({ x: 0, y: 0 }) // 고정된 위치
  const hoverTimeoutRef = useRef(null) // 호버 타임아웃 참조
  const clickTimerRef = useRef(null) // 클릭 타이머 참조
  const [fixedNode, setFixedNode] = useState(null) // 고정된 노드
  const doubleClickTimerRef = useRef(null) // 더블클릭 타이머 참조
  const [lastClickedNode, setLastClickedNode] = useState(null) // 마지막으로 클릭된 노드
  const [isGraphStable, setIsGraphStable] = useState(false) // 그래프 안정화 상태
  const [isCameraMoving, setIsCameraMoving] = useState(false) // 카메라 이동 상태
  const lastCameraPositionRef = useRef(null) // 마지막 카메라 위치 참조
  const stabilityTimeoutRef = useRef(null) // 안정화 타임아웃 참조
  const cameraTimeoutRef = useRef(null) // 카메라 타임아웃 참조
  const [isHelpVisible, setIsHelpVisible] = useState(false)

  // is3D 상태가 변경될 때마다 저장
  useEffect(() => {
    setViewMode(is3D)
  }, [is3D])

  // 데이터가 변경될 때 localData 업데이트
  useEffect(() => {
    setLocalData(data)
  }, [data])

  const processedData = useMemo(() => {
    // 노드의 깊이(depth) 계산 함수
    const calculateDepth = (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return 0
      visited.add(nodeId)

      const relationships = localData.relationships.filter((rel) => rel.source === nodeId)
      if (relationships.length === 0) return 0

      const childDepths = relationships.map((rel) => calculateDepth(rel.target, visited))
      return 1 + Math.max(...childDepths)
    }

    // 노드의 레벨(level) 계산 함수
    const calculateLevel = (nodeId, parentId = null, level = 0, visited = new Set()) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = localData.nodes.find((n) => n.id === nodeId)
      if (node) {
        node.level = level
      }

      const children = localData.relationships.filter((rel) => rel.source === nodeId).map((rel) => rel.target)

      children.forEach((childId) => {
        calculateLevel(childId, nodeId, level + 1, visited)
      })
    }

    // 기존 루트 노드 찾기
    const originalRootNodes = localData.nodes.filter((node) => !localData.relationships.some((rel) => rel.target === node.id))

    // chatRoomId별로 루트 노드 그룹화
    const rootNodeGroups = originalRootNodes.reduce((groups, node) => {
      const chatRoomId = node.chatRoomId || "default"
      if (!groups[chatRoomId]) {
        groups[chatRoomId] = []
      }
      groups[chatRoomId].push(node)
      return groups
    }, {})

    // 새로운 노드와 관계 배열 생성
    let newNodes = [...localData.nodes]
    let newRelationships = [...localData.relationships]

    // 각 chatRoom 그룹별로 새로운 루트 노드 생성
    Object.entries(rootNodeGroups).forEach(([chatRoomId, groupNodes]) => {
      // '/mindmap' 경로일 때만 새로운 루트 노드 생성
      if (location.pathname === "/mindmap" && groupNodes.length >= 1) {
        // 채팅방 제목 가져오기 및 길이 제한 (20자)
        const fullTitle = groupNodes[0].chatRoomTitle || `CR ${chatRoomId}`
        const chatRoomTitle = fullTitle.length > 10 ? fullTitle.substring(0, 10) + "..." : fullTitle

        // 새로운 루트 노드 생성
        const newRootNode = {
          id: `root_${chatRoomId}`,
          title: chatRoomTitle, // 실제 채팅방 제목 사용
          content: `Group of ${groupNodes.length} root nodes`,
          chatRoomId: chatRoomId,
          isRoot: true,
          level: 0,
        }

        // 새로운 루트 노드 추가
        newNodes.push(newRootNode)

        // 기존 루트 노드들을 새로운 루트 노드와 연결
        groupNodes.forEach((node) => {
          newRelationships.push({
            source: newRootNode.id,
            target: node.id,
            type: "HAS_SUBTOPIC",
          })
        })
      }
    })

    // 색상 배열 정의
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
    const rootColor = "#FF6B6B"

    // 노드에 색상 할당
    const nodes = newNodes.map((node) => {
      const isRoot =
        node.id.startsWith("root_") || // 새로 생성된 루트 노드
        (!newRelationships.some((rel) => rel.target === node.id) && // 들어오는 관계가 없는 노드
          (location.pathname === "/mindmap" ? !rootNodeGroups[node.chatRoomId]?.length > 1 : true)) // '/mindmap'에서만 추가 조건 확인

      return {
        ...node,
        color: isRoot ? rootColor : colors[node.level % colors.length],
        isRoot,
      }
    })

    // 링크 처리
    const links = newRelationships.map((rel) => ({
      source: rel.source,
      target: rel.target,
      type: rel.type,
    }))

    // cross-link node objects
    links.forEach((link) => {
      const a = nodes.find((node) => node.id === link.source)
      const b = nodes.find((node) => node.id === link.target)

      !a.neighbors && (a.neighbors = [])
      !b.neighbors && (b.neighbors = [])
      a.neighbors.push(b)
      b.neighbors.push(a)

      !a.links && (a.links = [])
      !b.links && (b.links = [])
      a.links.push(link)
      b.links.push(link)
    })

    return { nodes, links }
  }, [localData, is3D, location.pathname])
  //}, [is3D]); // 노드의 멀어짐 해결책책

  // 루트 노드까지의 경로를 찾는 함수 추가
  const findPathToRoot = useCallback(
    (nodeId, visited = new Set()) => {
      if (visited.has(nodeId)) return null
      visited.add(nodeId)

      // 현재 노드가 루트 노드인지 확인
      const isRoot = !localData.relationships.some((rel) => rel.target === nodeId)
      if (isRoot) return [nodeId]

      // 부모 노드들 찾기
      const parentRels = localData.relationships.filter((rel) => rel.target === nodeId)

      for (const rel of parentRels) {
        const path = findPathToRoot(rel.source, visited)
        if (path) {
          return [...path, nodeId]
        }
      }

      return null
    },
    [localData.relationships]
  )

  // 노드 선택 시 해당 노드로 카메라 이동하는 함수 수정
  const handleNodeSelect = useCallback(
    (node) => {
      // 선택된 노드 상태 업데이트
      setSelectedNode(node)
      // 검색창 초기화
      setSearchTerm("")
      setSearchResults([])

      // 그래프 참조가 존재할 경우에만 카메라 이동 실행
      if (graphRef.current) {
        if (is3D) {
          // 3D 모드에서의 카메라 이동 - 확대 없이 중앙 이동만
          const distance = 100 // 기존 40에서 100으로 증가하여 더 멀리서 보기
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z)

          graphRef.current.cameraPosition({ x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, node, 2000)
        } else {
          // 2D 모드에서의 카메라 이동 - 확대 없이 중앙 이동만
          graphRef.current.centerAt(node.x, node.y, 1000)
          // zoom 관련 코드 제거
        }
      }
    },
    [is3D]
  ) // is3D 상태가 변경될 때마다 함수 재생성

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
  const handleNodeClick = useCallback(
    (node, event) => {
      // Ctrl + 클릭으로 노드 고정/해제
      if (event.ctrlKey) {
        if (node.fx !== undefined && node.fy !== undefined) {
          // 고정 해제
          node.fx = undefined
          node.fy = undefined
          if (is3D) {
            node.fz = undefined
          }
        } else {
          // 현재 위치에 고정
          node.fx = node.x
          node.fy = node.y
          if (is3D) {
            node.fz = node.z
          }
        }
        // 강제 리렌더링을 위해 그래프 데이터 업데이트
        if (graphRef.current) {
          graphRef.current.refresh()
        }
        return
      }

      // 기존의 더블클릭 및 클릭 로직
      if (lastClickedNode && lastClickedNode.id === node.id) {
        if (doubleClickTimerRef.current) {
          clearTimeout(doubleClickTimerRef.current)
          doubleClickTimerRef.current = null

          // 루트 노드(chatroom)인 경우
          if (node.isRoot) {
            if (location.pathname.startsWith("/mindmap/room/") || location.pathname.startsWith("/mindmap/node/")) {
              // const chatRoomId = node.id.replace('root_', '');
              navigate(`/mindmap/node/${node.id}`)
            } else {
              const chatRoomId = node.id.replace("root_", "")
              navigate(`/mindmap/room/${chatRoomId}`)
            }
          } else {
            // 일반 노드인 경우
            navigate(`/mindmap/node/${node.id}`)
          }

          setLastClickedNode(null)
          return
        }
      }

      // 첫 번째 클릭 또는 단일 클릭
      setLastClickedNode(node)
      doubleClickTimerRef.current = setTimeout(() => {
        doubleClickTimerRef.current = null
        setLastClickedNode(null)

        // 카메라 이동
        if (graphRef.current) {
          if (is3D) {
            const distance = 100
            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z)
            graphRef.current.cameraPosition({ x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, node, 2000)
          } else {
            graphRef.current.centerAt(node.x, node.y, 1000)
          }
        }

        // 설명창 고정/해제 토글 및 위치 저장
        setFixedNode((prev) => (prev?.id === node.id ? null : node))
        setFixedPosition({ x: mousePosition.x, y: mousePosition.y })
      }, 300)
    },
    [lastClickedNode, navigate, is3D, mousePosition, graphRef, location.pathname]
  )

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (doubleClickTimerRef.current) {
        clearTimeout(doubleClickTimerRef.current)
      }
    }
  }, [])

  // 노드 위치 보존 함수 추가
  const preserveNodePositions = useCallback(
    (currentNodes) => {
      const positions = {}
      currentNodes.forEach((node) => {
        positions[node.id] = {
          x: node.x,
          y: node.y,
          z: is3D ? node.z : undefined,
          vx: node.vx,
          vy: node.vy,
          vz: is3D ? node.vz : undefined,
        }
      })
      return positions
    },
    [is3D]
  )

  // 노드 위치 복원 함수 추가
  const restoreNodePositions = useCallback(
    (nodes, savedPositions) => {
      return nodes.map((node) => {
        const pos = savedPositions[node.id]
        if (pos) {
          return {
            ...node,
            x: pos.x,
            y: pos.y,
            z: is3D ? pos.z : undefined,
            vx: pos.vx,
            vy: pos.vy,
            vz: is3D ? pos.vz : undefined,
          }
        }
        return node
      })
    },
    [is3D]
  )

  // 카메라 위치 저장 함수 수정
  const preserveCameraPosition = useCallback(() => {
    if (!graphRef.current) return null

    try {
      if (is3D) {
        const pos = graphRef.current.cameraPosition()
        return {
          ...pos,
          lookAt: graphRef.current.controls().target,
          is3D: true,
        }
      } else {
        const transform = graphRef.current.zoom().transform
        if (!transform) {
          // 2D 기본값 반환
          return { x: 0, y: 0, k: 1, is3D: false }
        }
        return {
          x: transform.x,
          y: transform.y,
          k: transform.k,
          is3D: false,
        }
      }
    } catch (error) {
      console.warn("카메라 위치 저장 중 오류:", error)
      // 기본값 반환
      return is3D ? { x: 0, y: 0, z: 0, lookAt: { x: 0, y: 0, z: 0 }, is3D: true } : { x: 0, y: 0, k: 1, is3D: false }
    }
  }, [is3D])

  // 카메라 위치 복원 함수 수정
  const restoreCameraPosition = useCallback((position) => {
    if (!position || !graphRef.current) return

    try {
      if (position.is3D) {
        const { x, y, z, lookAt } = position
        graphRef.current.cameraPosition({ x, y, z }, lookAt, 3000)
      } else {
        const { x, y, k } = position
        if (graphRef.current.zoom) {
          const zoom = graphRef.current.zoom()
          if (zoom && zoom.transform) {
            zoom.transform({ x, y, k })
          }
        }
      }
    } catch (error) {
      console.warn("카메라 위치 복원 중 오류:", error)
    }
  }, [])

  // 링크 버튼 핸들러 함수를 먼저 선언
  const handleLinkButtonClick = useCallback(
    (nodeId) => {
      // 노드의 chatRoomId 찾기
      const node = processedData.nodes.find((n) => n.id === nodeId)

      if (!node) return

      let chatRoomId
      if (node.id.startsWith("root_")) {
        // root_ 접두사가 있는 경우 제거
        chatRoomId = node.id.replace("root_", "")
      } else {
        // 일반 노드의 경우 해당 노드의 chatRoomId 사용
        chatRoomId = node.chatRoomId
      }

      if (chatRoomId) {
        // 채팅방 선택
        onChatRoomSelect(chatRoomId)

        // MainPage로 이동하면서 필요한 정보 전달
        navigate("/main")
      }
    },
    [processedData.nodes, navigate, onChatRoomSelect]
  )

  // 분리 버튼 클릭 핸들러
  const handleSplitButtonClick = useCallback(
    async (node) => {
      try {
        if (!node) {
          console.error("선택된 노드가 없습니다.")
          return
        }

        // 1. 서버에 분리 요청 보내고 새로운 chatRoomId 받기
        const newChatRoomId = await splitNode(node.id)

        // 2. 상태 초기화
        setFixedNode(null)
        setShowNodeModal(false)

        // 3. 새로운 chatRoomId로 main 페이지 이동
        if (newChatRoomId) {
          // 채팅방 선택
          onChatRoomSelect(newChatRoomId)

          // MainPage로 이동하면서 필요한 정보 전달
          navigate("/main")
        }
        setRefreshTrigger((prev) => !prev)
      } catch (error) {
        console.error("노드 분리 중 오류 발생:", error)
        toast.error("노드 분리에 실패했습니다.")
      }
    },
    [navigate, onChatRoomSelect]
  )

  // 노드 삭제 핸들러 수정
  const handleNodeDelete = useCallback(async () => {
    try {
      if (!fixedNode) {
        console.error("선택된 노드가 없습니다.")
        return
      }

      // 현재 상태 저장
      const savedNodePositions = preserveNodePositions(processedData.nodes)
      const savedCameraPosition = preserveCameraPosition()

      // 낙관적 업데이트
      setLocalData((prevData) => {
        const updatedNodes = prevData.nodes.filter((node) => node.id !== fixedNode.id)
        const updatedRelationships = prevData.relationships.filter((rel) => rel.source !== fixedNode.id && rel.target !== fixedNode.id)

        const nodesWithPositions = restoreNodePositions(updatedNodes, savedNodePositions)
        return {
          nodes: nodesWithPositions,
          relationships: updatedRelationships,
        }
      })

      // 서버 요청
      await deleteNode(fixedNode.id)

      setFixedNode(null)
      setShowNodeModal(false)
    } catch (error) {
      console.error("노드 삭제 중 오류 발생:", error)
      // 에러 발생 시에만 서버에서 새로운 데이터를 가져옴
      const newData = await fetchMindmapData()
      setLocalData(newData)
      toast.error("노드 삭제에 실패했습니다.")
    }
  }, [fixedNode, processedData, preserveNodePositions, preserveCameraPosition, restoreNodePositions])

  // 노드 색상을 원래대로 되돌리기
  const getNodeColor = (node) => {
    if (node.isRoot) {
      return "rgba(255,107,107,0.9)" // 루트 노드 색상
    }

    const isDirectlyConnectedToChatRoom = processedData.links.some((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target
      const isChatRoomNode = sourceId.startsWith("root_") || targetId.startsWith("root_")
      return isChatRoomNode && (sourceId === node.id || targetId === node.id)
    })

    return isDirectlyConnectedToChatRoom
      ? "rgba(147,51,234,0.5)" // chatroom 노드와 연결된 노드 색상
      : "rgba(66,153,225,0.5)" // 일반 노드 색상
  }

  // 링크 색상을 관계 타입에 따라 설정
  const getLinkColor = (link) => {
    const isChatRoomLink =
      (typeof link.source === "object" && link.source.id.startsWith("root_")) ||
      (typeof link.target === "object" && link.target.id.startsWith("root_")) ||
      (typeof link.source === "string" && link.source.startsWith("root_")) ||
      (typeof link.target === "string" && link.target.startsWith("root_"))

    if (isChatRoomLink) {
      return "rgba(255,255,255,0.5)"
    }

    switch (link.type) {
      case "RELATED_TO":
        return "rgba(52,211,153,0.6)"
      case "HAS_SUBTOPIC":
        return "rgba(99,102,241,0.6)"
      case "COMPARE_TO":
        return "rgba(236,72,153,0.6)"
      default:
        return "rgba(255,255,255,0.8)"
    }
  }

  // 마우스 이동 이벤트 핸들러
  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
  }, [])

  // 컴포넌트 마운트 시 이벤트 리스너 추가
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove])

  // useEffect 수정: 카메라를 그래프 중앙에 위치시키기
  useEffect(() => {
    if (graphRef.current && !is3D) {
      // 2D 모드일 때 초기 줌 레벨 설정
      graphRef.current.zoom(0.2)

      // 그래프의 중심점 계산
      if (processedData.nodes.length > 0) {
        const xSum = processedData.nodes.reduce((sum, node) => sum + (node.x || 0), 0)
        const ySum = processedData.nodes.reduce((sum, node) => sum + (node.y || 0), 0)
        const xCenter = xSum / processedData.nodes.length
        const yCenter = ySum / processedData.nodes.length

        // 계산된 중심점으로 카메라 이동
        graphRef.current.centerAt(xCenter, yCenter, 1000)
      }
    }
  }, [is3D]) // processedData.nodes 의존성 추가

  // 키보드 이벤트 핸들러 추가
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setFixedNode(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // 설명창 외부 클릭 핸들러
  const handleOutsideClick = useCallback(
    (e) => {
      if (fixedNode && !e.target.closest(".node-info-popup")) {
        setFixedNode(null)
      }
    },
    [fixedNode]
  )

  useEffect(() => {
    if (fixedNode) {
      document.addEventListener("click", handleOutsideClick)
      return () => document.removeEventListener("click", handleOutsideClick)
    }
  }, [fixedNode, handleOutsideClick])

  // 그래프 안정성 체크 함수
  const checkGraphStability = useCallback((positions) => {
    if (stabilityTimeoutRef.current) {
      clearTimeout(stabilityTimeoutRef.current)
    }

    stabilityTimeoutRef.current = setTimeout(() => {
      setIsGraphStable(true)
    }, 300) // 300ms 동안 움직임이 없으면 안정된 것으로 간주

    setIsGraphStable(false)
  }, [])

  // 카메라 움직임 체크 함수
  const checkCameraMovement = useCallback((cameraPosition) => {
    if (cameraTimeoutRef.current) {
      clearTimeout(cameraTimeoutRef.current)
    }

    if (!lastCameraPositionRef.current) {
      lastCameraPositionRef.current = cameraPosition
      return
    }

    const hasChanged = JSON.stringify(lastCameraPositionRef.current) !== JSON.stringify(cameraPosition)
    if (hasChanged) {
      setIsCameraMoving(true)
      lastCameraPositionRef.current = cameraPosition

      cameraTimeoutRef.current = setTimeout(() => {
        setIsCameraMoving(false)
      }, 300) // 300ms 동안 카메라 움직임이 없으면 정지된 것으로 간주
    }
  }, [])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (stabilityTimeoutRef.current) {
        clearTimeout(stabilityTimeoutRef.current)
      }
      if (cameraTimeoutRef.current) {
        clearTimeout(cameraTimeoutRef.current)
      }
    }
  }, [])

  // 3D 그래프의 nodeThreeObject 수정
  const nodeThreeObject = useCallback(
    (node) => {
      if (!isGraphStable || isCameraMoving) {
        // 움직이는 동안에는 기본 구체만 표시
        return null
      }

      const sprite = new SpriteText(node.title)
      const isHighlighted = false

      const baseSize = node.isRoot ? 10 : 8

      sprite.backgroundColor = getNodeColor(node)
      sprite.textHeight = baseSize
      sprite.padding = baseSize * 0.5
      sprite.borderRadius = baseSize

      // 노드가 고정되었을 때 테두리 추가
      if (node.fx !== undefined && node.fy !== undefined) {
        sprite.borderWidth = baseSize * 0.2
        sprite.borderColor = "#FFD700" // 금색 테두리
      }

      if (node.title.length > 10) {
        sprite.text = node.title.substring(0, 10) + "..."
      }

      return sprite
    },
    [isGraphStable, isCameraMoving]
  )

  // 2D 그래프의 nodeCanvasObject 수정
  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const fontSize = node.isRoot ? 32 : 26
      const { width, height } = getNodeSize(node.title, ctx, fontSize)
      const isHighlighted = false
      const radius = 16

      ctx.save()

      // 노드 배경 그리기
      ctx.beginPath()
      ctx.roundRect(node.x - width / 2 - radius, node.y - height / 2 - radius, width + radius * 2, height + radius * 2, radius)

      ctx.fillStyle = getNodeColor(node)
      ctx.fill()

      // 테두리 설정
      if (isHighlighted || (node.fx !== undefined && node.fy !== undefined)) {
        ctx.strokeStyle = node === hoverNode ? "#ff4444" : node.fx !== undefined ? "#FFD700" : "#ffffff"
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // 2D 모드에서는 항상 텍스트 표시
      ctx.font = `${fontSize}px Sans-Serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "#ffffff"
      ctx.fillText(node.title, node.x, node.y)

      ctx.restore()

      node.size = Math.max(width, height)
      node.width = width
      node.height = height
    },
    [hoverNode, getNodeSize]
  )

  // useEffect 수정: 2D/3D 모드에 따른 힘 설정
  useEffect(() => {
    if (graphRef.current) {
      if (is3D) {
        // 3D 모드: 기존 설정 유지
        graphRef.current.d3Force("charge").strength(-60)
        graphRef.current.d3Force("link").distance(100)
      } else {
        // 2D 모드: 노드 간 거리 증가
        graphRef.current.d3Force("charge").strength(-800) // 반발력 증가
        graphRef.current.d3Force("link").distance(200) // 링크 길이 증가

        // 추가적인 반발력 설정
        graphRef.current.d3Force(
          "repulsion",
          d3.forceManyBody().strength((node) => {
            const hasLinks = processedData.links.some((link) => link.source === node || link.target === node)
            return hasLinks ? -800 : -1600 // 연결된 노드와 연결되지 않은 노드의 반발력 차등 적용
          })
        )
      }
    }
  }, [is3D, processedData.links])

  // 검색어 변경 시 결과 필터링을 위한 useEffect 추가
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const searchLowerCase = searchTerm.toLowerCase()
    const filteredNodes = processedData.nodes.filter((node) => node.title?.toLowerCase().includes(searchLowerCase) || node.content?.toLowerCase().includes(searchLowerCase))

    setSearchResults(filteredNodes.slice(0, 10)) // 최대 10개 결과만 표시
  }, [searchTerm, processedData.nodes])

  // 검색창 입력 핸들러 수정
  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value)
  }

  // 2D/3D 전환 버튼 클릭 핸들러 수정
  const handleDimensionToggle = useCallback(() => {
    // 모든 노드의 고정 해제
    setLocalData((prevData) => ({
      ...prevData,
      nodes: prevData.nodes.map((node) => ({
        ...node,
        fx: undefined,
        fy: undefined,
        fz: undefined,
      })),
    }))

    // 2D/3D 모드 전환
    setIs3D(!is3D)
  }, [is3D])

  // 이전 페이지로 이동하는 함수
  const handleBackButtonClick = () => {
    if (location.pathname.startsWith("/mindmap/node/")) {
      const nodeId = location.pathname.split("/").pop()
      const node = processedData.nodes.find((n) => n.id === nodeId)
      if (node && node.chatRoomId) {
        navigate(`/mindmap/room/${node.chatRoomId}`)
      }
    } else if (location.pathname.startsWith("/mindmap/room/")) {
      navigate("/mindmap")
    }
  }

  // 현재 chatRoomTitle 및 추가 정보 가져오기
  const getCurrentChatRoomTitle = () => {
    if (location.pathname.startsWith("/mindmap/node/")) {
      const nodeId = location.pathname.split("/").pop()
      const node = processedData.nodes.find((n) => n.id === nodeId)
      if (node && node.chatRoomId) {
        const chatRoomNode = processedData.nodes.find((n) => n.id === `root_${node.chatRoomId}`)
        if (chatRoomNode) {
          return `${chatRoomNode.title} - ${node.title}`
        } else {
          // 루트 노드가 없을 경우에도 chatRoomTitle을 찾기
          const anyNodeInRoom = processedData.nodes.find((n) => n.chatRoomId === node.chatRoomId)
          return anyNodeInRoom ? `${anyNodeInRoom.chatRoomTitle} - ${node.title}` : node.title
        }
      }
    } else if (location.pathname.startsWith("/mindmap/room/")) {
      const chatRoomId = location.pathname.split("/").pop()
      const chatRoomNode = processedData.nodes.find((n) => n.id === `root_${chatRoomId}`)
      if (chatRoomNode) {
        return `${chatRoomNode.title} - room`
      } else {
        // 루트 노드가 없을 경우에도 chatRoomTitle을 찾기
        const anyNodeInRoom = processedData.nodes.find((n) => n.chatRoomId === chatRoomId)
        return anyNodeInRoom ? `${anyNodeInRoom.chatRoomTitle} - room` : "room"
      }
    }
    return ""
  }

  useEffect(() => {
    if (graphRef.current && is3D) {
      const controls = new TrackballControls(graphRef.current.camera(), graphRef.current.renderer().domElement);
      controls.rotateSpeed = 1.0; // 회전 속도 조절
      controls.zoomSpeed = 1.2; // 줌 속도 조절
      controls.panSpeed = 0.0001; // 팬 속도 조절

      const animate = () => {
        controls.update();
        requestAnimationFrame(animate);
      };
      animate();

      return () => {
        controls.dispose();
      };
    }
  }, [is3D, graphRef]);

  return (
    <div className="relative w-full h-full">
      {/* 검색창 컨테이너 수정 */}
      <div className="absolute left-4 top-4 z-50 flex items-center">
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
                <div key={node.id} onClick={() => handleNodeSelect(node)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <div className="font-medium">{node.title}</div>
                  {node.content && <div className="text-sm text-gray-600 truncate">{node.content.length > 50 ? `${node.content.substring(0, 50)}...` : node.content}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* 이전 페이지로 이동 버튼 및 chatRoomTitle 표시 */}
        {(location.pathname.startsWith("/mindmap/room/") || location.pathname.startsWith("/mindmap/node/")) && (
          <div className="flex items-center">
            <button onClick={handleBackButtonClick} className="ml-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              {"<<"}
            </button>
            <span className="ml-2 text-white">{getCurrentChatRoomTitle()}</span>
          </div>
        )}
      </div>

      {/* 편집 모드 체크박스 추가 */}
      <div className="absolute right-4 top-4 z-40">
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
            className="absolute right-10 top-0 bg-white rounded-lg shadow-lg z-40"
            style={{
              backgroundColor: showLegend ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.5)",
              minWidth: "max-content",
            }}
          >
            <div className="p-4">
              <h3 className="text-gray-800 font-bold mb-2">연결선 관계 색상 설명</h3>
              <div className="flex flex-col gap-2">
                {/* <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.9)" }}></div>
                  <span className="text-sm text-gray-700 whitespace-nowrap">루트까지의 경로</span>
                </div> */}
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
        className="absolute bottom-4 right-4 z-50 text-white transform hover:scale-105 transition-transform duration-200"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: is3D ? '8px' : '50%',
          background: is3D 
            ? 'linear-gradient(to right, #4f93ce, #1c3b57)' 
            : 'radial-gradient(circle, #4f93ce, #1c3b57)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          textAlign: 'center',
        }}
        onClick={handleDimensionToggle}
      >
        {is3D ? '2D' : '3D'}
      </button>

      {/* 조건부 렌더링으로 2D/3D 그래프 전환 */}
      {is3D ? (
        <ForceGraph3D
          ref={graphRef}
          graphData={processedData}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          width={window.innerWidth - 296}
          height={window.innerHeight - 64}
          backgroundColor="#171717"
          nodeColor={getNodeColor}
          linkWidth={2}
          linkColor={getLinkColor}
          linkOpacity={0.8}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.005}
          onNodeHover={(node) => {
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current)
              hoverTimeoutRef.current = null
            }

            if (node) {
              setHoverNode(node)
              document.body.style.cursor = "pointer"
            } else {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverNode((prev) => {
                  if (document.querySelector(".fixed:hover")) {
                    return prev
                  }
                  return null
                })
                hoverTimeoutRef.current = null
              }, 100)
              document.body.style.cursor = "default"
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
            precision: "lowp",
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
          width={window.innerWidth - 296}
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
              clearTimeout(hoverTimeoutRef.current)
              hoverTimeoutRef.current = null
            }

            if (node) {
              setHoverNode(node)
              document.body.style.cursor = "pointer"
            } else {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoverNode((prev) => {
                  if (document.querySelector(".fixed:hover")) {
                    return prev
                  }
                  return null
                })
                hoverTimeoutRef.current = null
              }, 100)
              document.body.style.cursor = "default"
            }
          }}
          d3Force="charge"
          d3ForceStrength={-200} // 확산형 배치를 위한 강한 반발력
          linkDistance={200} // 긴 링크 거리
          nodeLabel={(node) => ""}
          backgroundColor="#171717"
          nodePointerAreaPaint={(node, color, ctx) => {
            const fontSize = node.isRoot ? 32 : 26
            const { width, height } = getNodeSize(node.title, ctx, fontSize)
            const radius = 16

            ctx.beginPath()
            // 노드의 전체 영역(배경 포함)을 포인터 영역으로 설정
            ctx.roundRect(node.x - width / 2 - radius, node.y - height / 2 - radius, width + radius * 2, height + radius * 2, radius)
            ctx.fillStyle = color
            ctx.fill()
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
            backgroundColor: "rgba(255, 255, 255, 0.5)", // 배경색에 투명도 적용
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
            right: "2rem",
            bottom: "4rem",
            zIndex: 1000,
          }}
        >
          <h3 className="font-bold text-lg mb-2">{fixedNode.title}</h3>
          <p className="text-gray-600 mb-4">{fixedNode.content}</p>
          {/* chatroom 노드가 아닌 경우에만 버튼 표시 */}
          {!fixedNode.id.startsWith("root_") && (
            <div className="flex justify-end gap-2">
              <button onClick={() => handleLinkButtonClick(fixedNode.id)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">
                링크
              </button>
              <button onClick={() => handleSplitButtonClick(fixedNode)} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                분리
              </button>
              <button onClick={() => handleNodeDelete()} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      {/* 설명창 토글 버튼 */}
      <button
        className="absolute left-4 bottom-4 bg-gray-700 text-white p-1 rounded"
        onClick={() => setIsHelpVisible(!isHelpVisible)}
      >
        조작법
      </button>

      {/* 도움말 텍스트 */}
      {isHelpVisible && (
        <div className="absolute left-4 bottom-16 z-50 text-white text-sm bg-gray-800 bg-opacity-75 p-2 rounded"
             style={{ width: '300px', height: '90px', overflowY: 'auto' }}>
          <p>클릭: 카메라 이동 및 설명창 고정</p>
          <p>더블클릭: 상세페이지 이동</p>
          <p>Ctrl + 클릭: 노드의 위치 고정</p>
          <p>ESC/외부 클릭: 설명창 닫기</p>
          <p>마우스 휠: 그래프 확대/축소</p>
          <p>===3D===</p>
          <p>마우스 왼쪽 버튼 드래그: 그래프 회전</p>
          <p>마우스 오른쪽 버튼 드래그: 그래프 이동</p>
        </div>
      )}
    </div>
  )
}

const CustomNodeComponent = ({ data }) => {
  // ... component code ...
}

CustomNodeComponent.propTypes = {
  // ... prop types ...
}

Mindmap.propTypes = {
  data: PropTypes.shape({
    nodes: PropTypes.array,
    relationships: PropTypes.array,
  }),
  onChatRoomSelect: PropTypes.func.isRequired, // 사용되지 않음
}

export default Mindmap
