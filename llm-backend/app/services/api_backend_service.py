import os
import logging
import httpx
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class APIBackendService:
    def __init__(self):
        self.base_url = os.getenv("API_BACKEND_URL", "http://localhost:3001")
        self.admin_password = os.getenv("ADMIN_PASSWORD", "panopticon")
        self.timeout = 30.0

    async def create_post(
        self,
        title: str,
        content: str,
        password: str,
        is_anonymous: bool,
        is_private: bool,
        author_name: Optional[str] = None,
        email: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create a post in API Backend
        Returns: {"id": "post-uuid", "message": "..."}
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "title": title,
                    "content": content,
                    "password": password,
                    "isAnonymous": is_anonymous,
                    "isPrivate": is_private,
                }

                if author_name:
                    payload["authorName"] = author_name
                if email:
                    payload["email"] = email

                response = await client.post(f"{self.base_url}/posts", json=payload)

                if response.status_code in [200, 201]:
                    data = response.json()
                    # API returns { id (UUID), postId (number), message }
                    return {
                        "id": data.get("id"),  # UUID for comment creation
                        "postId": data.get("postId"),  # Display number for user
                        "message": data.get("message", "글이 작성되었습니다"),
                    }
                else:
                    logger.error(
                        f"Failed to create post: {response.status_code} - {response.text}"
                    )
                    return None

        except Exception as e:
            logger.error(f"Error creating post: {e}", exc_info=True)
            return None

    async def create_comment(
        self, post_id: str, content: str, is_ai_generated: bool = True
    ) -> bool:
        """
        Create a comment on a post
        Returns: True if successful, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "content": content,
                    "adminPassword": self.admin_password,
                    "isAiGenerated": is_ai_generated,
                }

                response = await client.post(
                    f"{self.base_url}/posts/{post_id}/comments", json=payload
                )

                if response.status_code in [200, 201]:
                    return True
                else:
                    logger.error(
                        f"Failed to create comment: {response.status_code} - {response.text}"
                    )
                    return False

        except Exception as e:
            logger.error(f"Error creating comment: {e}", exc_info=True)
            return False
