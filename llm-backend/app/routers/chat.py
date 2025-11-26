import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse, FieldMetadata, AskRequest, AskResponse, PostRequest, PostResponse
from app.services.bedrock_service import BedrockService
from app.services.api_backend_service import APIBackendService

logger = logging.getLogger(__name__)
router = APIRouter()

bedrock_service = BedrockService()
api_backend_service = APIBackendService()

# In-memory cache for AI answers (conversationId → AI answer)
ai_answer_cache = {}


def get_field_metadata():
    """Return UI metadata for frontend"""
    return {
        "fields": [
            {
                "name": "originalQuestion",
                "label": "질문",
                "required": True,
                "type": "text",
                "enabled": True,
            },
            {
                "name": "wantsToPost",
                "label": "게시 여부",
                "required": True,
                "type": "toggle",
                "enabled": True,
            },
            {
                "name": "postData.title",
                "label": "제목",
                "required": True,
                "type": "text",
                "enabled": "{{wantsToPost}}",
            },
            {
                "name": "postData.password",
                "label": "비밀번호",
                "required": True,
                "type": "password",
                "enabled": "{{wantsToPost}}",
            },
            {
                "name": "postData.isAnonymous",
                "label": "익명",
                "required": True,
                "type": "toggle",
                "enabled": "{{wantsToPost}}",
            },
            {
                "name": "postData.isPrivate",
                "label": "비공개",
                "required": True,
                "type": "toggle",
                "enabled": "{{wantsToPost}}",
            },
            {
                "name": "postData.authorName",
                "label": "이름",
                "required": "{{!postData.isAnonymous}}",
                "type": "text",
                "enabled": "{{wantsToPost && !postData.isAnonymous}}",
            },
            {
                "name": "postData.email",
                "label": "이메일",
                "required": False,
                "type": "email",
                "enabled": "{{wantsToPost}}",
            },
        ]
    }


@router.get("/llm")
def l_ch():
    logger.info("hello")
    return "welcome to LLM backend"


@router.post("/llm/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Single-shot chat endpoint
    1. Generate AI answer via Bedrock
    2. If wantsToPost=true, create post and auto-comment
    3. Return complete response
    """

    logger.info(f"Chat request: conversationId={request.conversationId if hasattr(request, 'conversationId') else 'N/A'}, wantsToPost={request.wantsToPost}")

    # Step 1: Generate AI answer
    try:
        ai_answer = await bedrock_service.generate_answer(
            request.originalQuestion, is_error=request.isError
        )
    except Exception as e:
        logger.error(f"Bedrock failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))

    response_data = {
        "reply": ai_answer,
        "aiAnswer": ai_answer,
        "postCreated": None,
        "commentCreated": False,
        "commentError": None,
        "nextStep": "completed",
        "meta": get_field_metadata(),
    }

    # Step 2: If user wants to post
    if not request.wantsToPost or not request.postData:
        return ChatResponse(**response_data)

    # Step 3: Create post
    post_result = await api_backend_service.create_post(
        title=request.postData.title,
        content=request.originalQuestion,
        password=request.postData.password,
        is_anonymous=request.postData.isAnonymous,
        is_private=request.postData.isPrivate,
        author_name=request.postData.authorName,
        email=request.postData.email,
    )

    if not post_result:
        logger.error("Failed to create post")
        raise HTTPException(
            status_code=502,
            detail="글 작성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
        )

    response_data["postCreated"] = post_result

    # Step 4: Auto-create AI comment
    comment_success = await api_backend_service.create_comment(
        post_id=post_result["id"], content=ai_answer, is_ai_generated=True
    )

    response_data["commentCreated"] = comment_success

    if not comment_success:
        response_data["commentError"] = "댓글 작성에 실패했습니다"
        logger.warning(f"Comment creation failed for post {post_result['id']}")

    # Update reply message
    if post_result:
        reply_message = (
            f"{ai_answer}\n\n글이 생성되었습니다. 글 번호: {post_result['postId']}"
        )
        if comment_success:
            reply_message += "\nAI 답변이 댓글로 등록되었습니다."
        response_data["reply"] = reply_message

    return ChatResponse(**response_data)


@router.post("/llm/chat/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    Step 1: Generate AI answer only
    - Generate AI answer via Bedrock
    - Cache the answer with conversationId
    - Return answer for display
    """
    logger.info(f"Ask request: conversationId={request.conversationId}, question={request.originalQuestion[:50]}...")

    # Generate AI answer
    try:
        ai_answer = await bedrock_service.generate_answer(
            request.originalQuestion, is_error=request.isError
        )
    except Exception as e:
        logger.error(f"Bedrock failed: {e}")
        raise HTTPException(status_code=502, detail=str(e))

    # Cache the answer
    ai_answer_cache[request.conversationId] = ai_answer
    logger.info(f"Cached AI answer for conversationId={request.conversationId}")

    return AskResponse(
        conversationId=request.conversationId,
        aiAnswer=ai_answer,
        reply=ai_answer,
    )


@router.post("/llm/chat/post", response_model=PostResponse)
async def post(request: PostRequest):
    """
    Step 2: Create post with cached AI answer
    - Retrieve cached AI answer (or regenerate if not found)
    - Create post
    - Create AI comment automatically
    """
    logger.info(f"Post request: conversationId={request.conversationId}")

    # Retrieve cached AI answer
    ai_answer = ai_answer_cache.get(request.conversationId)

    if not ai_answer:
        logger.warning(f"No cached answer for conversationId={request.conversationId}, regenerating...")
        try:
            ai_answer = await bedrock_service.generate_answer(request.originalQuestion)
        except Exception as e:
            logger.error(f"Bedrock failed: {e}")
            raise HTTPException(status_code=502, detail=str(e))

    # Create post
    post_result = await api_backend_service.create_post(
        title=request.postData.title,
        content=request.originalQuestion,
        password=request.postData.password,
        is_anonymous=request.postData.isAnonymous,
        is_private=request.postData.isPrivate,
        author_name=request.postData.authorName,
        email=request.postData.email,
    )

    if not post_result:
        logger.error("Failed to create post")
        raise HTTPException(
            status_code=502,
            detail="글 작성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
        )

    # Auto-create AI comment
    comment_success = await api_backend_service.create_comment(
        post_id=post_result["id"], content=ai_answer, is_ai_generated=True
    )

    # Build response message
    reply_message = f"글이 생성되었습니다. 글 번호: {post_result['postId']}"
    if comment_success:
        reply_message += "\nAI 답변이 댓글로 등록되었습니다."

    # Clean up cache
    if request.conversationId in ai_answer_cache:
        del ai_answer_cache[request.conversationId]
        logger.info(f"Cleaned up cache for conversationId={request.conversationId}")

    return PostResponse(
        reply=reply_message,
        aiAnswer=ai_answer,
        postCreated=post_result,
        commentCreated=comment_success,
        commentError="댓글 작성에 실패했습니다" if not comment_success else None,
    )
