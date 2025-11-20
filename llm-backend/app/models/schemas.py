from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
import re


class PostData(BaseModel):
    title: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    isAnonymous: bool
    isPrivate: bool
    authorName: Optional[str] = None
    email: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, v):
                raise ValueError('유효한 이메일 형식이 아닙니다')
            return v
        return None

    @field_validator('authorName')
    @classmethod
    def validate_author_name(cls, v: Optional[str], info) -> Optional[str]:
        if info.data.get('isAnonymous') is False:
            if not v or not v.strip():
                raise ValueError('익명이 아닌 경우 작성자 이름이 필요합니다')
        return v


class ChatRequest(BaseModel):
    conversationId: str
    originalQuestion: str = Field(..., min_length=1)
    wantsToPost: bool
    postData: Optional[PostData] = None

    @field_validator('postData')
    @classmethod
    def validate_post_data(cls, v: Optional[PostData], info) -> Optional[PostData]:
        if info.data.get('wantsToPost') is True:
            if not v:
                raise ValueError('게시를 원하는 경우 postData가 필요합니다')
        return v


class FieldMetadata(BaseModel):
    name: str
    label: str
    required: bool | str
    type: str
    enabled: bool | str


class PostCreatedResponse(BaseModel):
    id: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    aiAnswer: str
    postCreated: Optional[PostCreatedResponse] = None
    commentCreated: bool = False
    commentError: Optional[str] = None
    nextStep: str = "completed"
    meta: Dict[str, List[Dict[str, Any]]]
