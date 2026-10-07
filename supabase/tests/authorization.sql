-- Self-contained transaction; pgTAP tests are rollback-only. Requires seed.sql.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(27);

select is((select count(*)::integer from pg_tables where schemaname='public' and tablename in
 ('profiles','skills','student_skills','tasks','task_skills','applications','contracts','submissions','reviews','payments','notifications','verification_records','reputation_events')),13,'13 canonical tables');
select is((select count(*)::integer from public.profiles where role='student'),24,'24 fictional students');
select is((select count(*)::integer from public.profiles where role='client'),8,'8 fictional clients');
select is((public.get_career_proof(md5('campusgig:student:1')::uuid)->>'completedCount')::integer,47,'primary completed count derived');
select is((public.get_career_proof(md5('campusgig:student:1')::uuid)->>'earnedAmount')::numeric,28400::numeric,'primary released money INR');
select is(round((public.get_career_proof(md5('campusgig:student:1')::uuid)->>'averageRating')::numeric,1),4.8::numeric,'primary rating display 4.8');
select is((select count(*)::integer from public.contracts where student_id=md5('campusgig:student:1')::uuid and submitted_at<=due_at),45,'45 first submissions on time');

set local role anon;
select is((select count(*)::integer from public.tasks),30,'anon only sees open tasks');
select is((select count(*)::integer from public.public_student_profiles),24,'public safe profiles readable');
select throws_ok('select * from public.profiles','42501',null,'anonymous private profiles denied');
select throws_ok('select public.apply_to_task(null,''This is a valid cover note.'')','42501',null,'anonymous RPC denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',md5('campusgig:student:2')::uuid::text,true);
select is((select count(*)::integer from public.profiles),1,'fresh student sees own private profile only');
select is((select count(*)::integer from public.payments),0,'student cannot see others payments');
select is((select count(*)::integer from public.submissions),0,'student cannot see others submissions');
select throws_ok('update public.profiles set role=''client''','42501',null,'role not editable');
select throws_ok('update public.profiles set verified_status=true','42501',null,'verification not editable');
select throws_ok('insert into public.applications(task_id,student_id,cover_note,match_score,match_breakdown,evidence_snapshot) values(null,null,''x'',100,''{}'',''{}'')','42501',null,'direct score forgery denied');
select lives_ok('select public.declare_skill(''python'')','declare canonical skill');
select is((select evidence_score from public.student_skills where student_id=auth.uid() and skill_id=md5('campusgig:skill:python')::uuid),0,'declaration has zero work evidence');
select lives_ok('select public.apply_to_task(md5(''campusgig:open-task:1'')::uuid,''I will deliver the requested artifact and documentation.'')','student can apply');
select throws_ok('select public.apply_to_task(md5(''campusgig:open-task:1'')::uuid,''I will deliver the requested artifact and documentation.'')','23505',null,'unique application prevents duplicates');
select is((select match_score from public.applications where student_id=auth.uid()),15,'new student deterministic availability only score');
select throws_ok('select public.hire_application(null)','42501',null,'student cannot hire');
select throws_ok('update public.reputation_events set payload=''{}''','42501',null,'event edits forbidden');
select throws_ok('delete from public.reviews','42501',null,'review deletes forbidden');
select throws_ok('select public.declare_skill(''React.js'')','P0001',null,'aliases not accepted as skill slug');
select throws_ok('select public.approve_work(md5(''campusgig:contract:1'')::uuid)','42501',null,'student cannot approve');
reset role;
select * from finish();
rollback;