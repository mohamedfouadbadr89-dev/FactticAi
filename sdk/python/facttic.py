import requests
import json
from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class TrackPayload:
    prompt: str
    response: str
    model: str
    user_id: str

@dataclass
class RiskFeedback:
    risk_score: float
    policy_flags: List[str]
    drift_indicators: List[str]
    session_id: Optional[str] = None

class FactticSDK:
    def __init__(self, api_key: str, endpoint: str = "https://api.facttic.ai/api/v1/governance/evaluate"):
        if not api_key:
            raise ValueError("Facttic SDK requires an api_key")
        self.api_key = api_key
        self.endpoint = endpoint
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    def track(self, payload: TrackPayload) -> RiskFeedback:
        """
        Submit prompts and responses to Facttic Governance API synchronously.
        Creates sessions automatically remotely.
        """
        data = {
            "prompt": payload.prompt,
            "response": payload.response,
            "model": payload.model,
            "user_id": payload.user_id
        }

        resp = requests.post(self.endpoint, headers=self.headers, json=data)
        
        if resp.status_code >= 200 and resp.status_code < 300:
            result = resp.json()
            return RiskFeedback(
                risk_score=result.get("risk_score", 0.0),
                policy_flags=result.get("policy_flags", []),
                drift_indicators=result.get("drift_indicators", []),
                session_id=result.get("session_id")
            )
        else:
            raise Exception(f"Facttic API Error {resp.status_code}: {resp.text}")
