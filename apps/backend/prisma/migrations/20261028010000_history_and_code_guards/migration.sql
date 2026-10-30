BEGIN;
-- AlterTable
ALTER TABLE "member_histories" ADD COLUMN     "new_branch_id" UUID;

-- AddForeignKey
ALTER TABLE "member_histories" ADD CONSTRAINT "member_histories_previous_branch_id_fkey" FOREIGN KEY ("previous_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_histories" ADD CONSTRAINT "member_histories_new_branch_id_fkey" FOREIGN KEY ("new_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- On creation, code prefix comes from authoritative city. City moves retain the
-- original code under the already installed immutable-identity trigger.
CREATE FUNCTION hwf_initial_branch_prefix() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM cities WHERE id=NEW.city_id AND code=split_part(NEW.code,'-',1)) THEN RAISE EXCEPTION 'branch code must use authoritative city prefix' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER branch_initial_prefix BEFORE INSERT ON branches FOR EACH ROW EXECUTE FUNCTION hwf_initial_branch_prefix();
COMMIT;
