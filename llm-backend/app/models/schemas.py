from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator, model_validator
import re


class PostData(BaseModel):
    email: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        # 이메일은 선택사항이므로 형식 검증 안함
        return v if v else None


class ChatRequest(BaseModel):
    conversationId: str
    originalQuestion: str = Field(..., min_length=1)
    wantsToPost: bool
    postData: Optional[PostData] = None
    isError: bool = False  # 에러 시나리오 시연용 (기본값: False)

    @model_validator(mode='after')
    def validate_post_data_required(self):
        if self.wantsToPost is True and not self.postData:
            raise ValueError('게시를 원하는 경우 postData가 필요합니다')
        return self


class FieldMetadata(BaseModel):
    name: str
    label: str
    required: Union[bool, str]
    type: str
    enabled: Union[bool, str]


class PostCreatedResponse(BaseModel):
    id: str  # UUID
    postId: int  # Display number
    message: str


class ChatResponse(BaseModel):
    reply: str
    aiAnswer: str
    postCreated: Optional[PostCreatedResponse] = None
    commentCreated: bool = False
    commentError: Optional[str] = None
    nextStep: str = "completed"
    meta: Dict[str, List[Dict[str, Any]]]


# New schemas for split endpoints
class AskRequest(BaseModel):
    conversationId: str
    originalQuestion: str = Field(..., min_length=1)
    isError: bool = False  # 에러 시나리오 시연용


class AskResponse(BaseModel):
    conversationId: str
    aiAnswer: str
    reply: str


class PostRequest(BaseModel):
    conversationId: str
    originalQuestion: str
    postData: PostData


class PostResponse(BaseModel):
    reply: str
    aiAnswer: str
    postCreated: Optional[PostCreatedResponse] = None
    commentCreated: bool = False
    commentError: Optional[str] = None
