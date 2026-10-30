BEGIN;
-- Preserve immutable adjustment request identity independently of later decisions.
CREATE FUNCTION hwf_adjustment_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.id<>OLD.id OR NEW.reference<>OLD.reference OR NEW.collection_id<>OLD.collection_id OR NEW.branch_id<>OLD.branch_id OR NEW.requested_by_id<>OLD.requested_by_id OR NEW.created_at<>OLD.created_at THEN RAISE EXCEPTION 'immutable adjustment request identity' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER adjustment_identity BEFORE UPDATE ON financial_adjustments FOR EACH ROW EXECUTE FUNCTION hwf_adjustment_identity();
-- Historical collections may remain associated with an Inactive member, but a
-- new association cannot be introduced through an edit to bypass status checks.
CREATE FUNCTION hwf_collection_member_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.member_id IS DISTINCT FROM OLD.member_id AND NEW.member_id IS NOT NULL THEN
  PERFORM 1 FROM members WHERE id=NEW.member_id AND branch_id=NEW.branch_id AND status='ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'new association requires Active own-branch member' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER collection_member_change BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION hwf_collection_member_change();
COMMIT;
