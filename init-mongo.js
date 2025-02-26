// root 계정이 있는지 확인 후 생성 (이미 존재하면 오류 방지)
db.createUser({
  user: "root",
  pwd: "1234",
  roles: [{ role: "root", db: "admin" }]
});

db = db.getSiblingDB("mindflow_db");

// mindflow_db에 "ssafy" 계정 추가
db.createUser({
  user: "ssafy",
  pwd: "ssafy",
  roles: [{ role: "readWrite", db: "mindflow_db" }]
});

// chat_logs 컬렉션 생성
db.createCollection("chat_logs");
