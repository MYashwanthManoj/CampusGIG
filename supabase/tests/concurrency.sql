-- Run separately as local supabase_admin (dblink requires a privileged local
-- connection); ordinary CLI postgres runs report these tests as skipped.
-- Real independent PostgreSQL sessions. Lock waits prove RPC lock ordering;
-- uniqueness and duplicate calls are additionally covered by workflow.sql.
begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
set search_path=public,extensions;
select plan(4);
select rolsuper as run_concurrency from pg_roles where rolname=current_user \gset
\if :run_concurrency
select dblink_connect('locker','user=supabase_admin dbname='||current_database());
select dblink_connect('contender','user=supabase_admin dbname='||current_database());
select dblink_exec('locker','begin');
select * from dblink('locker','select id from public.tasks where id=md5(''campusgig:completed-task:1'')::uuid for update') as t(id uuid);
select dblink_exec('contender','set lock_timeout=''200ms''');
select * from dblink('contender','select set_config(''request.jwt.claim.sub'',md5(''campusgig:client:1'')::uuid::text,false)') as t(value text);
select throws_ok('select * from dblink(''contender'',''select public.hire_application(md5(''''campusgig:application:1'''')::uuid)'') as t(id uuid)','55P03',null,'concurrent hire must acquire task lock');
select dblink_exec('locker','rollback');
select throws_ok('select * from dblink(''contender'',''select public.hire_application(md5(''''campusgig:application:1'''')::uuid)'') as t(id uuid)','P0001',null,'after lock acquired, existing completed hire is rejected');
select dblink_exec('locker','begin');
select * from dblink('locker','select id from public.contracts where id=md5(''campusgig:contract:1'')::uuid for update') as t(id uuid);
select throws_ok('select * from dblink(''contender'',''select public.approve_work(md5(''''campusgig:contract:1'''')::uuid)'') as t(result text)','55P03',null,'approval must acquire contract lock');
select dblink_exec('locker','rollback');
select throws_ok('select * from dblink(''contender'',''select public.approve_work(md5(''''campusgig:contract:1'''')::uuid)'') as t(result text)','P0001',null,'after lock acquired, duplicate approval is rejected');
select dblink_disconnect('locker');
select dblink_disconnect('contender');
\else
select skip('Run concurrency.sql separately as local supabase_admin for dblink sessions',4);
\endif
select * from finish();
rollback;