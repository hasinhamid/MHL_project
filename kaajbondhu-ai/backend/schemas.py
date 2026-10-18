from enum import Enum
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Trade(str, Enum):
    plumber = "plumber"
    electrician = "electrician"
    locksmith = "locksmith"
    carpenter = "carpenter"
    ac_technician = "ac_technician"
    appliance_repair = "appliance_repair"
    home_helper = "home_helper"


class CleanModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class ChatMessage(CleanModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantRequest(CleanModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)


class AssistantResult(CleanModel):
    intent: Literal["clarification", "recommendation", "unsupported"]
    problem_summary: str = Field(min_length=1, max_length=1000)
    recommended_trade: Trade | Literal["other"]
    urgency: Literal["normal", "urgent", "emergency"]
    confidence: float = Field(ge=0, le=1)
    follow_up_question: str | None = Field(default=None, max_length=500)
    safety_warning: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def consistent_result(self):
        if self.intent == "recommendation" and self.recommended_trade == "other":
            raise ValueError("Recommendations require a supported trade")
        if self.intent == "clarification" and not self.follow_up_question:
            raise ValueError("Clarification requires a question")
        return self


class AssistantResponse(AssistantResult):
    source: Literal["demo", "live"]


def normalize_phone(value: str) -> str:
    value = re.sub(r"[\s()-]", "", value)
    if not re.fullmatch(r"(?:\+?88)?01[3-9]\d{8}", value):
        raise ValueError("Use a Bangladesh mobile number, e.g. 01712345678")
    return "+88" + value[-11:]


class WorkerApplication(CleanModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(max_length=24)
    trade: Trade
    areas: list[str] = Field(min_length=1, max_length=8)
    experience_years: int = Field(ge=0, le=60)
    fee_min: int = Field(ge=0, le=100000)
    fee_max: int = Field(ge=0, le=100000)
    note: str = Field(default="", max_length=1000)

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, value):
        return normalize_phone(value)

    @model_validator(mode="after")
    def ordered_fees(self):
        if self.fee_max < self.fee_min:
            raise ValueError("Maximum fee must be at least the minimum fee")
        return self


class Provider(CleanModel):
    id: str
    name: str
    trade: Trade
    areas: list[str]
    fee_min: int = Field(ge=0)
    fee_max: int = Field(ge=0)
    experience_years: int = Field(ge=0, le=60)
    available: bool
    phone: str | None = None
    note: str = ""
    source: Literal["seed", "registered"] = "seed"
    demo: bool = True
    created_at: str | None = None
    match_reason: str | None = None
    coverage: Literal["local", "adjacent", "other", "unspecified"] = "unspecified"
