"""
llm/base.py – Abstract base class for LLM providers.
"""

from abc import ABC, abstractmethod
from app.schemas import MeetingAnalysisResponse

class LLMProvider(ABC):
    """
    Abstract base class for all LLM providers (OpenAI, Mock, etc.).
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the identifier name of the provider."""
        pass

    @abstractmethod
    async def analyze_meeting(self, transcript: str) -> MeetingAnalysisResponse:
        """
        Analyze a prepared meeting transcript and return structured analysis.
        """
        pass
