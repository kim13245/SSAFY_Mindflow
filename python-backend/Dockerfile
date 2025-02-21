# Python 3.11 이미지 사용
FROM python:3.11

# 작업 디렉토리 설정
WORKDIR /app

# 필요한 패키지 설치를 위한 requirements.txt 복사
COPY requirements.txt requirements.txt

# 필요한 패키지 설치 (Flask-SocketIO 및 eventlet 포함)
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# Gunicorn을 eventlet로 실행 (WebSocket 지원)
CMD ["gunicorn", "-k", "eventlet", "-b", "0.0.0.0:5001", "app:app"]

