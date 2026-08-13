"""
llm/mock_provider.py – Mock LLM provider for testing and development.
"""

import logging
from app.llm.base import LLMProvider
from app.schemas import MeetingAnalysisResponse, ActionItemAnalysis, TopicAnalysis

logger = logging.getLogger(__name__)

class MockProvider(LLMProvider):
    @property
    def provider_name(self) -> str:
        return "mock"

    async def analyze_meeting(self, transcript: str) -> MeetingAnalysisResponse:
        logger.info("Generating mock meeting analysis...")
        
        return MeetingAnalysisResponse(
            summary="This is a mock summary of the meeting. The team discussed the API endpoints, database structure, and the integration of the OpenAI LLM provider.",
            key_points=[
                "Discussed FastAPI backend routing structure and SQLAlchemy ORM models.",
                "Agreed to implement modular LLMProvider abstraction with OpenAI and Mock implementations.",
                "Planned to reuse existing tables without creating unnecessary schema changes."
            ],
            action_items=[
                ActionItemAnalysis(
                    task="Create LLM base, OpenAI, and Mock providers",
                    assignee="engineer@firefiles.com",
                    due_date=None
                ),
                ActionItemAnalysis(
                    task="Implement GET/POST router endpoints in backend",
                    assignee="developer@firefiles.com",
                    due_date=None
                ),
                ActionItemAnalysis(
                    task="Integrate summary generation buttons in frontend meeting details page",
                    assignee="frontend-dev@firefiles.com",
                    due_date=None
                )
            ],
            topics=[
                TopicAnalysis(
                    title="Introduction and Project Structure Review",
                    description="The team began by reviewing the existing code structure, including the FastAPI application, routes, models, and frontend client service."
                ),
                TopicAnalysis(
                    title="LLM Integration Strategy",
                    description="A discussion on how to modularize the LLM client using base classes and concrete provider classes, with a configuration system using pydantic-settings."
                ),
                TopicAnalysis(
                    title="Frontend Controls & toast notifications",
                    description="Ensuring loading states, disabling buttons, and showing success or error messages on failure."
                )
            ]
        )
