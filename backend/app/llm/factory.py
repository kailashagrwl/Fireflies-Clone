"""
llm/factory.py – Provider factory.

Reads LLM_PROVIDER from Settings and returns the correct concrete instance.
"""

from __future__ import annotations

import logging

from app.config import get_settings
from app.llm.base import LLMProvider

logger = logging.getLogger(__name__)

_PROVIDER_CACHE: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    """
    Return a configured LLMProvider instance.

    The instance is cached after first creation so OpenAI client connections
    are reused across requests.
    """
    global _PROVIDER_CACHE
    if _PROVIDER_CACHE is not None:
        return _PROVIDER_CACHE

    settings = get_settings()
    provider_name = settings.llm_provider.strip().lower()

    if provider_name in ("openai", "gemini"):
        from app.llm.openai_provider import OpenAIProvider

        api_key = settings.gemini_api_key or settings.openai_api_key
        _PROVIDER_CACHE = OpenAIProvider(
            api_key=api_key,
            model=settings.openai_model,
            timeout=settings.llm_timeout_seconds,
        )
    elif provider_name == "mock":
        from app.llm.mock_provider import MockProvider

        _PROVIDER_CACHE = MockProvider()
    else:
        raise ValueError(
            f"Unknown LLM_PROVIDER={provider_name!r}. "
            "Supported values: 'mock', 'openai', 'gemini'."
        )

    logger.info("LLM provider initialised: %s", _PROVIDER_CACHE.provider_name)
    return _PROVIDER_CACHE
