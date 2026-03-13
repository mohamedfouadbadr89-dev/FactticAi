CREATE OR REPLACE FUNCTION broadcast_governance_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM realtime.broadcast(
    'telemetry',
    json_build_object(
      'event', 'governance_event',
      'session_id', NEW.session_id,
      'org_id', NEW.org_id,
      'decision', NEW.decision,
      'risk_score', NEW.risk_score,
      'timestamp', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS governance_event_broadcast
ON facttic_governance_events;

CREATE TRIGGER governance_event_broadcast
AFTER INSERT ON facttic_governance_events
FOR EACH ROW
EXECUTE FUNCTION broadcast_governance_event();
