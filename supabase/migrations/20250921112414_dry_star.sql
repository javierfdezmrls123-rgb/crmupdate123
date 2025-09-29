/*
  # Create notification automation system

  1. Functions
    - Auto-generate notifications for overdue leads
    - Trigger notifications when leads become overdue
  
  2. Triggers
    - Automatically check for overdue leads
    - Generate admin notifications
*/

-- Create function to auto-generate notifications
CREATE OR REPLACE FUNCTION auto_generate_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  overdue_count INTEGER;
  stale_count INTEGER;
BEGIN
  -- Clear old notifications (older than 24 hours)
  DELETE FROM admin_notifications 
  WHERE created_at < NOW() - INTERVAL '24 hours';

  -- Process each user with leads
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM leads 
    WHERE user_id IS NOT NULL
  LOOP
    -- Count overdue leads (4+ days)
    SELECT COUNT(*) INTO overdue_count
    FROM leads
    WHERE user_id = user_record.user_id
      AND last_contact < NOW() - INTERVAL '4 days'
      AND status NOT IN ('closed-won', 'closed-lost');

    -- Count stale leads (2+ weeks)
    SELECT COUNT(*) INTO stale_count
    FROM leads
    WHERE user_id = user_record.user_id
      AND last_contact < NOW() - INTERVAL '14 days'
      AND status NOT IN ('closed-won', 'closed-lost');

    -- Create notification for overdue leads
    IF overdue_count > 0 THEN
      INSERT INTO admin_notifications (
        type, title, message, salesman_id, salesman_email, priority, data, is_read
      )
      SELECT 
        'stale_lead',
        overdue_count || ' Overdue Leads - ' || COALESCE(ur.email, 'Unknown User'),
        COALESCE(ur.email, 'Unknown User') || ' has ' || overdue_count || ' leads not contacted in 4+ days',
        user_record.user_id,
        COALESCE(ur.email, 'unknown@example.com'),
        CASE WHEN overdue_count > 10 THEN 'high' ELSE 'medium' END,
        json_build_object('count', overdue_count, 'type', 'overdue'),
        false
      FROM (SELECT user_record.user_id as uid) u
      LEFT JOIN user_roles ur ON ur.user_id = u.uid;
    END IF;

    -- Create notification for stale leads
    IF stale_count > 0 THEN
      INSERT INTO admin_notifications (
        type, title, message, salesman_id, salesman_email, priority, data, is_read
      )
      SELECT 
        'stale_lead',
        '🚨 CRITICAL: ' || stale_count || ' Stale Leads - ' || COALESCE(ur.email, 'Unknown User'),
        COALESCE(ur.email, 'Unknown User') || ' has ' || stale_count || ' leads not contacted in 2+ weeks',
        user_record.user_id,
        COALESCE(ur.email, 'unknown@example.com'),
        'high',
        json_build_object('count', stale_count, 'type', 'stale'),
        false
      FROM (SELECT user_record.user_id as uid) u
      LEFT JOIN user_roles ur ON ur.user_id = u.uid;
    END IF;
  END LOOP;
END;
$$;

-- Create function to trigger notification generation
CREATE OR REPLACE FUNCTION trigger_notification_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger if last_contact changed or status changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.last_contact IS DISTINCT FROM NEW.last_contact OR
    OLD.status IS DISTINCT FROM NEW.status
  )) OR TG_OP = 'INSERT' THEN
    -- Schedule notification generation (async)
    PERFORM pg_notify('generate_notifications', NEW.user_id::text);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on leads table
DROP TRIGGER IF EXISTS leads_notification_trigger ON leads;
CREATE TRIGGER leads_notification_trigger
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notification_check();

-- Create a scheduled job to run notification generation every 30 minutes
-- Note: This requires pg_cron extension which may not be available in all Supabase plans
-- Alternative: Use a cron job or scheduled function call from your application