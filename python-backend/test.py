
import json
import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit

import mysql.connector
from dotenv import load_dotenv
from flask import Flask, request
from flask import make_response
from flask_restx import Api, Resource, fields
from langchain.chains import ConversationChain
from langchain.memory import ConversationSummaryBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain_anthropic import ChatAnthropic
from langchain_community.chat_models import ChatClovaX
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from mysql.connector import Error


from pymongo import MongoClient

from tasks import create_mindmap

load_dotenv()

print("환경변수 확인:")
for key in ['MONGODB_URI', 'GOOGLE_API_KEY', 'NCP_CLOVASTUDIO_API_KEY', 'NCP_APIGW_API_KEY', 'OPENAI_API_KEY',
            'ANTHROPIC_API_KEY']:
    value = os.getenv(key)
    print(f"{key}: {'설정됨' if value else '설정되지 않음'}")


# 환경 변수로 API 키 설정 (Google, CLOVA Studio, OpenAI, Anthropic)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
NCP_CLOVASTUDIO_API_KEY = os.getenv("NCP_CLOVASTUDIO_API_KEY")
NCP_APIGW_API_KEY = os.getenv("NCP_APIGW_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
# MongoDB 클라이언트 초기화

client = MongoClient(
    os.getenv('MONGODB_URI'),
    username=os.getenv('MONGODB_USERNAME'),
    password=os.getenv('MONGODB_PASSWORD'),
    authSource='admin'  # 인증 데이터베이스 지정
)

db = client['mindflow_db']

# 컬렉션 정의
chat_rooms = db['chat_rooms']
chat_logs = db['chat_logs']
conversation_summaries = db['conversation_summaries']

google_llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp", temperature=0.5, max_tokens=4096,streaming=True)
clova_llm = ChatClovaX(model="HCX-003", max_tokens=4096, temperature=0.5,streaming=True)
chatgpt_llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.5, max_tokens=4096,streaming=True)
claude_llm = ChatAnthropic(model="claude-3-5-sonnet-latest", temperature=0.5, max_tokens=4096,streaming=True)

memory = None


# 첫 입력 여부를 추적하는 변수

# MongoDB에서 메모리 로드 함수 수정 (디버깅 메시지 포함)
def load_memory_from_db(chat_room_id):
    summary_doc = conversation_summaries.find_one({"chat_room_id": chat_room_id})
    if summary_doc:
        print(f"Loaded summary content for chat_room_id ")

    else:
        print(f"No summary content found for chat_room_id {chat_room_id}.")
    return summary_doc["summary_content"] if summary_doc else ""


# 메모리 초기화 함수 수정 (메모리가 비어 있을 경우에만 DB에서 로드)
def initialize_memory(chat_room_id):
    # ConversationSummaryBufferMemory를 초기화할 때 메모리가 비어 있는지 확인
    global memory
    memory = ConversationSummaryBufferMemory(llm=clova_llm, max_token_limit=500, human_prefix="User", ai_prefix="AI")

    # 메모리가 비어 있을 경우에만 DB에서 기존 요약 데이터를 가져옴
    if not memory.load_memory_variables({}).get("history"):
        existing_summary = load_memory_from_db(chat_room_id)
        if existing_summary:
            print("DB에서 기존 요약 데이터를 불러옵니다.")
            memory.save_context({"input": ""}, {"output": existing_summary})
        else:
            print("이전에 저장된 대화 내용이 없습니다. 새로 시작합니다.")

    return memory



def generate_response_for_model(user_input, model_class, detail_model):
    history = memory.load_memory_variables({}).get("history", "")
    prompt = ChatPromptTemplate.from_messages([
        ("system", "너는 한국말로 10줄 정도로 대답해. 시스템은 언급 하지마\n\nChat history:\n{history}\n\nUser: {user_input}\nAssistant:"),
        ("human", "{user_input}")])

    formatted_prompt = prompt.format_messages(history=history, user_input=user_input)   
    model = model_class(model=detail_model, temperature=0.5, max_tokens=4096)
    seen_chunks = set()
    full_response = "" 
    for chunk in model.stream(formatted_prompt):  # 실시간으로 청크 단위 출력
        print(chunk.content, end="", flush=True)
        seen_chunks.add(chunk.content)  # 새로운 청크 저장
        full_response += chunk.content  # 전체 응답에 추가
        socketio.emit('response', {
                    'content': chunk.content
                })
    memory.save_context(
        {"input": user_input},  # 사용자 입력 저장
        {"output": full_response}  # 모델 응답 저장
        )
    return full_response



def chatbot_response(user_input, model="google", detail_model="gemini-2.0-flash-exp"):
    model_classes = {"google": ChatGoogleGenerativeAI, "clova": ChatClovaX, "chatgpt": ChatOpenAI,
                     "claude": ChatAnthropic}
    model_class = model_classes.get(model)
    if model_class:
        return generate_response_for_model(user_input, model_class, detail_model)
    return {"error": "Invalid model"}


def save_conversation_summary(chat_room_id, memory_content):
    updated_summary = memory_content

    conversation_summaries.update_one({"chat_room_id": chat_room_id}, {
        "$set": {"summary_content": updated_summary.strip(), "timestamp": datetime.now().isoformat()}}, upsert=True)


def generate_room_title(user_input):
    # ChatPromptTemplate 생성
    tile_prompt = ChatPromptTemplate.from_messages(
        [("system", "입력을 받은걸로 짧은 키워드나 한 문장으로 제목을 만들어줘. 제목만 말해줘."), ("human", "{user_input}")])
    # 프롬프트를 포맷팅
    formatted_prompt = tile_prompt.format_messages(user_input=user_input)
    # Google LLM을 사용하여 응답 생성
    response = google_llm(formatted_prompt)
    # 응답 내용 반환
    return response.content.strip()


def all_re(model=google_llm,user_input="input",model_name="name"):
    prompt = ChatPromptTemplate.from_messages([("system", "한국말 10줄 정도로 대답"), ("human", "{user_input}")])
    formatted_prompt = prompt.format_messages(user_input=user_input)
    seen_chunks = set()
    full_response = "" 
    for chunk in model.stream(formatted_prompt):  # 실시간으로 청크 단위 출력
            print(chunk.content, end="", flush=True)
            seen_chunks.add(chunk.content)  # 새로운 청크 저장
            full_response += chunk.content  # 전체 응답에 추가
            socketio.emit('response', {
                        'content': chunk.content,
                        'model_name':model_name
                    })
    return full_response


# 모델이 지정되지 않은 경우의 응답 생성 함수
def generate_model_responses(user_input):
    google_response = all_re(google_llm,user_input,"google")
    clova_response = all_re(clova_llm,user_input,"clova")
    chatgpt_response = all_re(chatgpt_llm,user_input,"chatgpt")
    claude_response = all_re(claude_llm,user_input,"claude")

    return {
        'google':{
            'response':google_response,
            'detail_model':"gemini-2.0-flash-exp"
        } ,
        'clova': {
            'response':clova_response,
            'detail_model':"HCX-003"
        },
        'chatgpt':{
            'response': chatgpt_response,
            'detail_model':"gpt-3.5-turbo"
        },
        'claude': {
           'response': claude_response,
            'detail_model':"claude-3-5-sonnet-latest"
        }
    }

def serialize_message(message):
    if hasattr(message, 'to_dict'):  # 객체에 to_dict 메서드가 있는 경우
        message_dict = message.to_dict()
        # 'content' 키만 반환
        return message_dict.get('content', '')
    # 'to_dict' 메서드가 없을 경우, 'content' 속성을 직접 반환
    return getattr(message, 'content', '') if hasattr(message, 'content') else str(message)


app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

api = Api(app, version='1.0', title='다중 AI 챗봇 API', description='다양한 AI 모델을 활용한 챗봇 API')

ns_chatbot = api.namespace('chatbot', description='Chatbot 관련 API')

# 모델 입력/출력 스키마 정의 (Swagger 문서용)
message_model = api.model('message', {'chatRoomId': fields.Integer(required=False, description='채팅방 ID'),
                                      'model': fields.String(required=False, description='사용할 모델 (예: google, clova)'),
                                      'userInput': fields.String(required=True, description='사용자 입력 메시지'),
                                      'creatorId': fields.Integer(required=False, description='생성자 ID'),
                                      'detailModel': fields.String(required=False, description='사용할 세부모델'), })
message_all = api.model('title', {'userInput': fields.String(required=True, description='사용자 입력 메시지'), })
message_title = api.model('all', {'userInput': fields.String(required=True, description='사용자 입력 메시지'), })


@ns_chatbot.route('/all')
class AlleAPI(Resource):
    @ns_chatbot.expect(message_all)  # 요청 스키마 정의 연결
    @ns_chatbot.response(200, '성공적인 응답')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '내부 서버 오류')
    def post(self):

        try:
            data = request.get_json()
            print(data)

            user_input = data.get('userInput')
            responses = generate_model_responses(user_input)
            response_data = {'models': ['google', 'clova', 'chatgpt', 'claude'], 'user_input': user_input,
                             'responses': responses, }
            response_json = json.dumps(response_data, ensure_ascii=False)
            return response_data

        except Exception as e:
            error_response = {'error': str(e)}

            # 에러 응답도 ensure_ascii=False로 처리
            return make_response(json.dumps(error_response, ensure_ascii=False), 500)


@ns_chatbot.route('/title')
class TitleAPI(Resource):
    @ns_chatbot.expect(message_title)  # 요청 스키마 정의 연결
    @ns_chatbot.response(200, '성공적인 응답')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '내부 서버 오류')
    def post(self):
        try:
            data = request.get_json()
            user_input = data.get('userInput')
            responses = generate_room_title(user_input)
            response_data = {"response": responses}
            response_json = json.dumps(response_data, ensure_ascii=False)
            return make_response(response_json, 200, {"Content-Type": "application/json"})


        except Exception as e:
            error_response = {'error': str(e)}

            # 에러 응답도 ensure_ascii=False로 처리
            return make_response(json.dumps(error_response, ensure_ascii=False), 500)


def escape_cypher_quotes(text):
    """Neo4j Cypher 쿼리용 문자열 이스케이프 개선"""
    if text is None:
        return text

    # 축약형(I'm, don't 등)과 따옴표를 포함한 텍스트를 처리하기 위해
    # 작은따옴표를 두 개의 작은따옴표로 이스케이프 처리
    escaped_text = ""
    prev_char = None

    for char in text:
        if char == "'":
            # 이전 문자가 알파벳이고 다음 문자가 m, s, t, ve, ll 등인 경우를 처리하기 위해
            # 그대로 작은따옴표 하나만 사용
            if (prev_char and prev_char.isalpha()) and len(escaped_text) < len(text) - 1:
                escaped_text += "'"
            else:
                escaped_text += "''"
        else:
            escaped_text += char
        prev_char = char

    return escaped_text


@ns_chatbot.route('/massage')
class MassageAPI(Resource):

    @ns_chatbot.expect(message_model)  # 요청 스키마 정의 연결
    @ns_chatbot.response(200, '성공적인 응답')
    @ns_chatbot.response(400, '필수 필드 누락')
    @ns_chatbot.response(500, '내부 서버 오류')
    def post(self):
        """Massage API"""
        global memory

        try:
            data = request.get_json()
            print(f"Received data: {data}")  # 데이터를 받아서 출력
            chat_room_id = data.get('chatRoomId')
            model = data.get('model')
            user_input = data.get('userInput')
            creator_id = data.get('creatorId')
            detail_model = data.get('detailModel')

            # 메모리 초기화
            # global memory
            memory = initialize_memory(chat_room_id)
            print(f"Initialized memory: {memory}")  # 메모리 초기화 결과 출력

            if not user_input:
                print("user_input is missing")  # user_input이 없을 경우 출력
                return make_response(json.dumps({'error': 'user_input은 필수입니다'}, ensure_ascii=False), 400)

            # 챗봇 응답 생성
            response_obj = chatbot_response(user_input, model=model, detail_model=detail_model)
            # print(f"Response object: {response_obj}")  # 챗봇 응답 출력

            response_content_serialized = (response_obj)
            # print(f"Serialized response content: {response_content_serialized}")  # 직렬화된 응답 내용 출력

            answer_sentences = [line.strip() for line in response_content_serialized.split('\n') if
                                line.strip()]
            # print(f"Answer sentences: {answer_sentences}")  # 응답 문장 출력

            memory_content = memory.load_memory_variables({})["history"]
            # print(f"Memory content: {memory_content}")  # 메모리 내용 출력

            # 각 문장에 sentenceId 부여 및 Cypher 이스케이프 처리
            sentences_with_ids = [
                {'sentenceId': str(uuid.uuid4()), 'content': escape_cypher_quotes(sentence)  # Cypher 이스케이프 처리
                 } for sentence in answer_sentences]
            # print(f"Sentences with IDs: {sentences_with_ids}")  # 문장에 ID와 Cypher 이스케이프 적용된 결과 출력

            task = create_mindmap.delay(  # account_id=data.get('accountId'),
                account_id="ssafy123", chat_room_id=data.get('chatRoomId'), chat_id="chat_id", question=user_input,
                answer_sentences=sentences_with_ids)
            print(f"Celery task created with id: {task.id}")

            save_conversation_summary(chat_room_id, memory_content)
            print("Conversation summary saved.")  # 대화 요약 저장 완료 출력

            response_data = {
                'chat_room_id': chat_room_id,
                'model': model,
                'detail_model':detail_model,
                'response': response_content_serialized,
            }

            response_json = json.dumps(response_data, ensure_ascii=False)
            print(f"Response JSON: {response_json}")  # 최종 응답 JSON 출력
            return make_response(response_json, 200, {"Content-Type": "application/json"})

        except Exception as e:
            print(f"Error: {e!r}")  # 예외 발생 시 오류 출력
            error_response = {'error': str(e)}
            return make_response(json.dumps(error_response, ensure_ascii=False), 500)


def run_this():
    with app.app_context():
        app.run(debug=True, port=5001)


if __name__ == "__main__":
    run_this()