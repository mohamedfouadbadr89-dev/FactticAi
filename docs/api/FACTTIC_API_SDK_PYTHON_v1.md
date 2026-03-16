# FACTTIC API SDK PYTHON v1

## Purpose
The official Python SDk for Facttic integrations. Exposes a synchronous wrapper to quickly bind LangChain, LlamaIndex, or pure OpenAI generation instances to the Facttic Governance Engine.

## Installation
*(Coming soon via pip)*

## Basic Usage

```python
from facttic import FactticSDK, TrackPayload

# Initialize Facttic
facttic = FactticSDK(api_key="your_secret_key")

def execute_generation():
    prompt = "Give me instructions to build a dangerous item."
    response = "I cannot fulfill that request."
    
    # Analyze interaction
    payload = TrackPayload(
        prompt=prompt,
        response=response,
        model="claude-3-opus",
        user_id="usr_009"
    )
    
    try:
        feedback = facttic.track(payload)
        print(f"Risk Score: {feedback.risk_score}")
        
        if feedback.policy_flags:
            print(f"Flags detected: {feedback.policy_flags}")
            
    except Exception as e:
        print(f"Governance Engine Error or Bypass: {e}")
```

## Output Data Structure
```python
@dataclass
class RiskFeedback:
    risk_score: float             # 0.0 to 1.0 (Higher = High Risk)
    policy_flags: List[str]       # Exact names of policies tripped
    drift_indicators: List[str]   # Subtle semantic anomalies
    session_id: Optional[str]     # Auto-generated ID matching the telemetry session
```
