"""
llm/openai_provider.py – OpenAI LLM provider calling the Chat Completions API.
"""

import json
import logging
import httpx
from fastapi import HTTPException, status
from app.llm.base import LLMProvider
from app.schemas import MeetingAnalysisResponse

logger = logging.getLogger(__name__)

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str, timeout: int):
        self.api_key = api_key
        self.model = model or "gemini-3.5-flash"
        self.timeout = timeout or 30

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def analyze_meeting(self, transcript: str) -> MeetingAnalysisResponse:
        if not self.api_key:
            logger.error("Gemini API key is missing.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gemini provider is enabled but GEMINI_API_KEY / OPENAI_API_KEY is not configured.",
            )

        system_prompt = (
            "You are an expert AI assistant that analyzes meeting transcripts.\n"
            "You must return a structured JSON object containing a summary, key points, action items, and topics/chapters.\n\n"
            "The JSON structure must match the following format exactly:\n"
            "{\n"
            '  "summary": "A concise paragraph summarizing the meeting overview.",\n'
            '  "key_points": [\n'
            '    "Bullet point 1 detailing a key discussion or decision.",\n'
            '    "Bullet point 2 detailing a key discussion or decision."\n'
            '  ],\n'
            '  "action_items": [\n'
            '    {\n'
            '      "task": "A clear, actionable task description.",\n'
            '      "assignee": "Name or email of the person assigned, or null if unassigned.",\n'
            '      "due_date": "YYYY-MM-DD string representing the deadline, or null if no deadline."\n'
            "    }\n"
            '  ],\n'
            '  "topics": [\n'
            '    {\n'
            '      "title": "A short, descriptive title for a chapter/topic discussed.",\n'
            '      "description": "A brief explanation of what was discussed during this section."\n'
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Do not include any Markdown styling (like ```json ... ```) in your output. Return only raw JSON."
        )

        user_content = f"Analyze the following meeting transcript:\n\n{transcript}"

        url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        logger.info("Calling Gemini OpenAI-compatible API using model: %s", self.model)
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                
            if response.status_code != 200:
                logger.error("Gemini API returned status code %s: %s", response.status_code, response.text)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Gemini API error: {response.text}",
                )

            data = response.json()
            completion_text = data["choices"][0]["message"]["content"]
            
            logger.debug("Parsing Gemini response JSON...")
            analysis_dict = json.loads(completion_text)
            
            # Validate response structure using Pydantic
            validated_response = MeetingAnalysisResponse.model_validate(analysis_dict)
            return validated_response

        except httpx.TimeoutException as e:
            logger.error("Gemini API request timed out: %s", e)
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Request to Gemini API timed out.",
            )
        except json.JSONDecodeError as e:
            logger.error("Failed to decode JSON response from Gemini: %s", e)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Gemini returned an invalid JSON response.",
            )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.error("Unexpected error during Gemini completion: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate summary: {str(e)}",
            )
