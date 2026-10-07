-- P0: all money is INR rupees, never paise; server-authoritative workflow.
create schema if not exists private;
revoke all on schema private from public;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','client','admin')),
  full_name text not null check (char_length(full_name) between 1 and 100),
  college text, headline text check(char_length(headline)<=160), bio text check (char_length(bio) <= 2000), avatar_path text,
  verified_status boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.skills (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  name text not null unique
);
create table public.student_skills (
  student_id uuid not null references public.profiles(id),
  skill_id uuid not null references public.skills(id),
  evidence_score integer not null default 0 check (evidence_score between 0 and 100),
  completed_count integer not null default 0 check (completed_count >= 0),
  source_type text not null default 'DECLARED' check(source_type in ('DECLARED','VERIFIED_WORK')),
  declared_at timestamptz not null default now(),
  primary key(student_id,skill_id)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), client_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 5 and 160),
  description text not null check (char_length(description) between 20 and 10000),
  fixed_price numeric(12,2) not null check (fixed_price > 0 and fixed_price <= 1000000),
  currency text not null default 'INR' check(currency = 'INR'), deadline timestamptz not null,
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','SUBMITTED','REVISION_REQUESTED','COMPLETED','CANCELLED')),
  difficulty text check(difficulty in ('Beginner','Intermediate','Advanced')), ai_category text,
  publish_request_id uuid,
  ai_analysis jsonb not null default '{}'::jsonb check (jsonb_typeof(ai_analysis)='object'),
  ai_source text not null default 'fallback' check (ai_source in ('live','fallback','mock')),
  ai_hours_min numeric(8,2), ai_hours_max numeric(8,2),
  ai_deliverables jsonb, ai_requirements jsonb,
  created_at timestamptz not null default now(),
  check (ai_hours_min is null or ai_hours_min >= 0),
  check (ai_hours_max is null or ai_hours_max >= coalesce(ai_hours_min,0)),
  check (ai_deliverables is null or jsonb_typeof(ai_deliverables)='array'),
  check (ai_requirements is null or jsonb_typeof(ai_requirements)='array'),
  unique(client_id,publish_request_id)
);
create table public.task_skills (
  task_id uuid not null references public.tasks(id) on delete cascade,
  skill_id uuid not null references public.skills(id), primary key(task_id,skill_id)
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id),
  student_id uuid not null references public.profiles(id), cover_note text not null,
  status text not null default 'PENDING' check(status in ('PENDING','SHORTLISTED','ACCEPTED','REJECTED','WITHDRAWN')),
  match_score integer not null check(match_score between 0 and 100),
  match_breakdown jsonb not null, evidence_snapshot jsonb not null, match_explanation text not null default 'Score computed deterministically from verified work evidence, availability, reviews, and reliability.',
  created_at timestamptz not null default now(), unique(task_id,student_id)
);
create table public.contracts (
  id uuid primary key default gen_random_uuid(), task_id uuid not null unique references public.tasks(id),
  application_id uuid not null unique references public.applications(id),
  student_id uuid not null references public.profiles(id), client_id uuid not null references public.profiles(id),
  status text not null default 'ACTIVE' check(status in ('ACTIVE','SUBMITTED','REVISION_REQUESTED','COMPLETED','CANCELLED')),
  agreed_amount numeric(12,2) not null check(agreed_amount > 0 and agreed_amount<=1000000), due_at timestamptz not null, submitted_at timestamptz,
  revision_count integer not null default 0 check(revision_count between 0 and 1), revision_feedback text,
  started_at timestamptz not null default now(), completed_at timestamptz,
  check((status='COMPLETED') = (completed_at is not null)), check(student_id <> client_id)
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(), contract_id uuid not null references public.contracts(id),
  student_id uuid not null references public.profiles(id),
  attempt_number integer not null check(attempt_number between 1 and 2),
  work_url text not null check(work_url ~ '^https?://[^[:space:]]+$'), summary text not null,
  submitted_at timestamptz not null default now(), unique(contract_id,attempt_number)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), contract_id uuid not null unique references public.contracts(id),
  amount numeric(12,2) not null check(amount > 0), currency text not null default 'INR' check(currency='INR'),
  status text not null default 'HELD' check(status in ('HELD','RELEASED','REFUNDED','FAILED')),
  is_simulated boolean not null default true check(is_simulated),
  created_at timestamptz not null default now(), released_at timestamptz,
  check((status='RELEASED') = (released_at is not null))
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), contract_id uuid not null unique references public.contracts(id),
  student_id uuid not null references public.profiles(id), client_id uuid not null references public.profiles(id),
  rating integer not null check(rating between 1 and 5), comment text not null default '',
  created_at timestamptz not null default now()
);
create table public.reputation_events (
  id uuid primary key default gen_random_uuid(), contract_id uuid not null references public.contracts(id),
  student_id uuid not null references public.profiles(id),
  actor_id uuid not null references public.profiles(id),
  event_type text not null check(event_type in ('HIRED','WORK_SUBMITTED','REVISION_REQUESTED','WORK_COMPLETED','REVIEW_RECEIVED','CONTRACT_CANCELLED','PAYMENT_REFUNDED')),
  payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
  kind text not null, message text not null, task_id uuid references public.tasks(id),
  contract_id uuid references public.contracts(id), read_at timestamptz, created_at timestamptz not null default now()
);
create table public.verification_records (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id),
  status text not null check(status in ('PENDING','VERIFIED','REJECTED')),
  verified_by uuid references public.profiles(id), verified_at timestamptz,
  method text not null default 'MANUAL',
  created_at timestamptz not null default now()
);

create index tasks_client_idx on public.tasks(client_id);
create index tasks_open_idx on public.tasks(status,deadline);
create index applications_student_idx on public.applications(student_id);
create index contracts_student_idx on public.contracts(student_id,status);
create index contracts_client_idx on public.contracts(client_id,status);
create index task_skills_skill_idx on public.task_skills(skill_id);
create index notifications_user_idx on public.notifications(user_id,created_at desc);
create index reputation_events_contract_idx on public.reputation_events(contract_id,created_at);

create function private.on_signup() returns trigger language plpgsql security definer set search_path = '' as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','student');
begin
  if r not in ('student','client') then raise exception 'INVALID_INPUT: Invalid role'; end if;
  insert into public.profiles(id,role,full_name,college) values(new.id,r,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'CampusGig member'),100),left(new.raw_user_meta_data->>'college',200));
  return new;
end $$;
create trigger campusgig_signup after insert on auth.users for each row execute function private.on_signup();

create function private.protect_profile() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id or new.role <> old.role or new.created_at <> old.created_at then
    raise exception 'INVALID_STATE: Identity and role are immutable';
  end if;
  if new.verified_status <> old.verified_status and current_user not in ('postgres','supabase_admin') then
    raise exception 'INVALID_STATE: Verification is administrator controlled';
  end if;
  new.updated_at:=now();
  return new;
end $$;
create trigger protect_profile before update on public.profiles for each row execute function private.protect_profile();
create function private.event_student() returns trigger language plpgsql security definer set search_path='' as $$
begin select student_id into new.student_id from public.contracts where id=new.contract_id; return new; end $$;
create trigger event_student before insert on public.reputation_events for each row execute function private.event_student();
create function private.append_only() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'INVALID_STATE: Append-only record'; end $$;
create trigger reputation_events_append_only before update or delete on public.reputation_events for each row execute function private.append_only();
create trigger reviews_append_only before update or delete on public.reviews for each row execute function private.append_only();
create trigger submissions_append_only before update or delete on public.submissions for each row execute function private.append_only();

create function private.require_role(p_role text) returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null or not exists(select 1 from public.profiles where id=u and role=p_role) then
    raise exception 'FORBIDDEN: Not authorized' using errcode='42501';
  end if; return u;
end $$;
create function private.is_contract_participant(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.contracts where id=p_id and auth.uid() in (student_id,client_id))
$$;
create function private.can_read_profile(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid()=p_id or exists(select 1 from public.contracts where
 (student_id=p_id and client_id=auth.uid()) or (client_id=p_id and student_id=auth.uid()))
 or exists(select 1 from public.applications a join public.tasks t on t.id=a.task_id
 where a.student_id=p_id and t.client_id=auth.uid())
$$;
create function private.can_read_task(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.tasks t where t.id=p_id and
 (t.status='OPEN' or t.client_id=auth.uid() or exists(select 1 from public.contracts c where c.task_id=t.id and c.student_id=auth.uid())))
$$;

-- No direct workflow writes. Functions own authorization and immutable prices/scores.
do $$ declare t text; begin
  foreach t in array array['profiles','skills','student_skills','tasks','task_skills','applications','contracts','submissions','payments','reviews','reputation_events','notifications','verification_records'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;
grant select on public.skills,public.tasks,public.task_skills to anon;
grant update(full_name,college,headline,bio,avatar_path) on public.profiles to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(private.can_read_profile(id));
create policy profiles_edit on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy skills_read on public.skills for select to anon,authenticated using(true);
create policy student_skills_read on public.student_skills for select to authenticated using(private.can_read_profile(student_id));
create policy tasks_read on public.tasks for select to anon,authenticated using(private.can_read_task(id));
create policy task_skills_read on public.task_skills for select to anon,authenticated using(exists(select 1 from public.tasks t where t.id=task_id));
create policy applications_read on public.applications for select to authenticated using(student_id=auth.uid() or exists(select 1 from public.tasks t where t.id=task_id and t.client_id=auth.uid()));
create policy contracts_read on public.contracts for select to authenticated using(auth.uid() in (student_id,client_id));
create policy submissions_read on public.submissions for select to authenticated using(private.is_contract_participant(contract_id));
create policy payments_read on public.payments for select to authenticated using(private.is_contract_participant(contract_id));
create policy reviews_read on public.reviews for select to authenticated using(private.is_contract_participant(contract_id));
create policy events_read on public.reputation_events for select to authenticated using(private.is_contract_participant(contract_id));
create policy notifications_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy notifications_edit on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy verification_read on public.verification_records for select to authenticated using(student_id=auth.uid());
grant usage on schema private to authenticated,anon;
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_contract_participant(uuid),private.can_read_profile(uuid) to authenticated;
grant execute on function private.can_read_task(uuid) to anon,authenticated;

-- Public projection RPC rather than a view over private profile rows. Never exposes
-- auth email, applications, private submissions, metadata or privileged fields.
create function public.get_public_student_profiles()
returns table(id uuid,full_name text,headline text,college text,bio text,avatar_path text,verified_status boolean)
language sql stable security definer set search_path = '' as $$
 select id,full_name,headline,college,bio,avatar_path,verified_status from public.profiles where role='student'
$$;
create view public.public_student_profiles with (security_invoker=true) as select * from public.get_public_student_profiles();
grant select on public.public_student_profiles to anon,authenticated;

create function private.student_evidence(p_student_id uuid,p_task_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
 'studentId',p_student_id,
 'skills',coalesce((select jsonb_agg(jsonb_build_object('slug',s.slug,'name',s.name,'evidenceScore',ss.evidence_score) order by s.slug)
  from public.student_skills ss join public.skills s on s.id=ss.skill_id where ss.student_id=p_student_id),'[]'::jsonb),
 'completedCount',(select count(*) from public.contracts where student_id=p_student_id and status='COMPLETED'),
 'relevantCompletedCount',(select count(*) from public.contracts c where c.student_id=p_student_id and c.status='COMPLETED'
  and exists(select 1 from public.task_skills x join public.task_skills y on x.skill_id=y.skill_id where x.task_id=c.task_id and y.task_id=p_task_id)),
 'activeContractCount',(select count(*) from public.contracts where student_id=p_student_id and status in ('ACTIVE','SUBMITTED','REVISION_REQUESTED')),
 'averageRating',(select avg(r.rating)::numeric from public.reviews r join public.contracts c on c.id=r.contract_id where c.student_id=p_student_id and c.status='COMPLETED'),
 'onTimeRate',coalesce((select count(*) filter(where c.submitted_at <= c.due_at)::numeric/nullif(count(*),0)
 from public.contracts c
 where c.student_id=p_student_id and c.status='COMPLETED'),0))
$$;
create function public.get_student_evidence(p_student_id uuid,p_task_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'FORBIDDEN: Not authorized' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles where id=p_student_id and role='student') then raise exception 'NOT_FOUND: Student not found'; end if;
 if not exists(select 1 from public.tasks where id=p_task_id and (status='OPEN' or client_id=auth.uid() or exists(select 1 from public.contracts where task_id=p_task_id and student_id=auth.uid()))) then raise exception 'NOT_FOUND: Task not accessible'; end if;
 return private.student_evidence(p_student_id,p_task_id);
end $$;
create function private.match_score(p_evidence jsonb,p_task_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare skill integer; past integer; availability integer; experience integer; rating integer; reliability integer;
begin
 select coalesce(round(35*avg(coalesce((e.value->>'evidenceScore')::numeric,0)/100)),0)::integer into skill
 from public.task_skills ts join public.skills s on s.id=ts.skill_id
 left join lateral (select value from jsonb_array_elements(p_evidence->'skills') where value->>'slug'=s.slug) e on true
 where ts.task_id=p_task_id;
 past := round(25*least((p_evidence->>'relevantCompletedCount')::numeric/6,1));
 availability := case (p_evidence->>'activeContractCount')::integer when 0 then 15 when 1 then 8 else 0 end;
 experience := round(10*least(ln((p_evidence->>'completedCount')::numeric+1)/ln(2)/6,1));
 rating := round(coalesce((p_evidence->>'averageRating')::numeric,0)/5*10);
 reliability := round((p_evidence->>'onTimeRate')::numeric*5);
 return jsonb_build_object('skill',skill,'pastWork',past,'availability',availability,'experience',experience,'rating',rating,'reliability',reliability,'total',skill+past+availability+experience+rating+reliability);
end $$;

create function public.declare_skill(p_skill_slug text) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid := private.require_role('student'); sid uuid;
begin
 select id into sid from public.skills where slug=p_skill_slug;
 if sid is null then raise exception 'INVALID_INPUT: Unknown canonical skill'; end if;
 insert into public.student_skills(student_id,skill_id) values(u,sid) on conflict do nothing;
end $$;

create function public.publish_task(p_title text,p_description text,p_fixed_price numeric,p_deadline timestamptz,p_analysis jsonb,p_analysis_source text,p_skill_slugs text[],p_request_id uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := private.require_role('client'); tid uuid;
begin
 perform 1 from public.profiles where id=u for update;
 if p_request_id is not null then
   select id into tid from public.tasks where client_id=u and publish_request_id=p_request_id;
   if tid is not null then return tid; end if;
 end if;
 if char_length(trim(p_title)) not between 5 and 160 or char_length(trim(p_description)) not between 20 and 10000
 or p_title is null or p_description is null then raise exception 'INVALID_INPUT: Invalid task brief'; end if;
 if p_fixed_price is null or p_fixed_price<=0 or p_fixed_price>1000000 or p_fixed_price<>round(p_fixed_price,2) then raise exception 'INVALID_INPUT: Invalid INR price'; end if;
 if p_deadline is null or p_deadline<=now() then raise exception 'INVALID_INPUT: Deadline must be in future'; end if;
 if p_analysis is null or jsonb_typeof(p_analysis)<>'object' or p_analysis_source is null or p_analysis_source not in ('live','fallback','mock') then raise exception 'INVALID_INPUT: Invalid analysis'; end if;
 if (p_analysis ? 'hoursMin' and (jsonb_typeof(p_analysis->'hoursMin')<>'number' or (p_analysis->>'hoursMin')::numeric<0 or (p_analysis->>'hoursMin')::numeric>1000))
 or (p_analysis ? 'hoursMax' and (jsonb_typeof(p_analysis->'hoursMax')<>'number' or (p_analysis->>'hoursMax')::numeric<coalesce((p_analysis->>'hoursMin')::numeric,0) or (p_analysis->>'hoursMax')::numeric>1000))
 or (p_analysis ? 'deliverables' and jsonb_typeof(p_analysis->'deliverables')<>'array')
 or (p_analysis ? 'requirements' and jsonb_typeof(p_analysis->'requirements')<>'array') then raise exception 'INVALID_INPUT: Invalid hours or deliverable arrays'; end if;
 if (p_analysis ? 'deliverables' and jsonb_array_length(p_analysis->'deliverables')>8)
 or (p_analysis ? 'requirements' and jsonb_array_length(p_analysis->'requirements')>8)
 or exists(select 1 from jsonb_array_elements(coalesce(p_analysis->'deliverables','[]'::jsonb)) x where jsonb_typeof(x)<>'string' or char_length(x#>>'{}')>500)
 or exists(select 1 from jsonb_array_elements(coalesce(p_analysis->'requirements','[]'::jsonb)) x where jsonb_typeof(x)<>'string' or char_length(x#>>'{}')>500) then raise exception 'INVALID_INPUT: Invalid deliverables or requirements'; end if;
 if p_skill_slugs is null or cardinality(p_skill_slugs) not between 0 and 6
 or exists(select 1 from unnest(p_skill_slugs) s where s is null or not exists(select 1 from public.skills where slug=s)) then raise exception 'INVALID_INPUT: Invalid canonical skills'; end if;
 insert into public.tasks(client_id,title,description,fixed_price,deadline,ai_analysis,ai_source,ai_hours_min,ai_hours_max,ai_deliverables,ai_requirements,difficulty,ai_category,publish_request_id)
 values(u,trim(p_title),trim(p_description),p_fixed_price,p_deadline,p_analysis,p_analysis_source,
 nullif(p_analysis->>'hoursMin','')::numeric,nullif(p_analysis->>'hoursMax','')::numeric,
 p_analysis->'deliverables',p_analysis->'requirements',p_analysis->>'difficulty',p_analysis->>'category',p_request_id) returning id into tid;
 insert into public.task_skills(task_id,skill_id) select tid,id from public.skills where slug=any(p_skill_slugs);
 return tid;
end $$;

create function public.apply_to_task(p_task_id uuid,p_cover_note text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := private.require_role('student'); t public.tasks; aid uuid; e jsonb; m jsonb;
begin
 select * into t from public.tasks where id=p_task_id for update;
 if t.id is null or t.status<>'OPEN' or t.deadline<=now() then raise exception 'INVALID_STATE: Task not open'; end if;
 if p_cover_note is null or char_length(trim(p_cover_note)) not between 20 and 2000 then raise exception 'INVALID_INPUT: Invalid cover note'; end if;
 -- Lock profile to serialize all applications/hire evidence snapshots for this student.
 perform 1 from public.profiles where id=u for update;
 e:=private.student_evidence(u,t.id); m:=private.match_score(e,t.id);
 insert into public.applications(task_id,student_id,cover_note,match_score,match_breakdown,evidence_snapshot)
 values(t.id,u,trim(p_cover_note),(m->>'total')::integer,m,e) returning id into aid;
 insert into public.notifications(user_id,kind,message,task_id) values(t.client_id,'APPLICATION_RECEIVED','A student applied to your task.',t.id);
 return aid;
end $$;

create function public.hire_application(p_application_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := private.require_role('client'); a public.applications; t public.tasks; cid uuid;
begin
 select * into a from public.applications where id=p_application_id;
 if a.id is null then raise exception 'NOT_FOUND: Application not found'; end if;
 select * into t from public.tasks where id=a.task_id for update;
 if t.client_id<>u then raise exception 'FORBIDDEN: Not authorized' using errcode='42501'; end if;
 if t.status<>'OPEN' or t.deadline<=now() then raise exception 'INVALID_STATE: Task not open'; end if;
 select * into a from public.applications where id=p_application_id for update;
 if a.status<>'PENDING' then raise exception 'INVALID_STATE: Application not pending'; end if;
 perform 1 from public.profiles where id=a.student_id for update;
 insert into public.contracts(task_id,application_id,student_id,client_id,agreed_amount,due_at)
 values(t.id,a.id,a.student_id,u,t.fixed_price,t.deadline) returning id into cid;
 update public.tasks set status='IN_PROGRESS' where id=t.id;
 update public.applications set status=case when id=a.id then 'ACCEPTED' else 'REJECTED' end where task_id=t.id;
 insert into public.payments(contract_id,amount) values(cid,t.fixed_price);
 insert into public.reputation_events(contract_id,actor_id,event_type,payload) values(cid,u,'HIRED',jsonb_build_object('amount',t.fixed_price,'currency','INR','simulated',true));
 insert into public.notifications(user_id,kind,message,task_id,contract_id) values(a.student_id,'HIRED','Your application was accepted; simulated funds are held.',t.id,cid);
 return cid;
end $$;

create function public.submit_work(p_contract_id uuid,p_work_url text,p_summary text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := private.require_role('student'); c public.contracts; sid uuid; n integer;
begin
 select * into c from public.contracts where id=p_contract_id for update;
 if c.id is null or c.student_id<>u then raise exception 'FORBIDDEN: Not authorized' using errcode='42501'; end if;
 if c.status not in ('ACTIVE','REVISION_REQUESTED') then raise exception 'INVALID_STATE: Contract cannot receive submission'; end if;
 if p_work_url is null or char_length(p_work_url)>2048 or p_work_url !~ '^https?://[^[:space:]]+$' or p_summary is null or char_length(trim(p_summary)) not between 20 and 4000 then raise exception 'INVALID_INPUT: Invalid submission'; end if;
 select coalesce(max(attempt_number),0)+1 into n from public.submissions where contract_id=c.id;
 if n>2 then raise exception 'INVALID_STATE: Submission limit reached'; end if;
 insert into public.submissions(contract_id,student_id,attempt_number,work_url,summary) values(c.id,u,n,p_work_url,trim(p_summary)) returning id into sid;
 update public.contracts set status='SUBMITTED',submitted_at=coalesce(submitted_at,now()) where id=c.id;
 update public.tasks set status='SUBMITTED' where id=c.task_id;
 insert into public.reputation_events(contract_id,actor_id,event_type,payload) values(c.id,u,'WORK_SUBMITTED',jsonb_build_object('submissionId',sid,'attempt',n));
 insert into public.notifications(user_id,kind,message,task_id,contract_id) values(c.client_id,'WORK_SUBMITTED','Work is ready for review.',c.task_id,c.id);
 return sid;
end $$;

create function public.request_revision(p_contract_id uuid,p_feedback text) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid := private.require_role('client'); c public.contracts;
begin
 select * into c from public.contracts where id=p_contract_id for update;
 if c.id is null or c.client_id<>u then raise exception 'FORBIDDEN: Not authorized' using errcode='42501'; end if;
 if c.status<>'SUBMITTED' or c.revision_count>=1 then raise exception 'INVALID_STATE: Revision not available'; end if;
 if p_feedback is null or char_length(trim(p_feedback)) not between 10 and 2000 then raise exception 'INVALID_INPUT: Invalid revision feedback'; end if;
 update public.contracts set status='REVISION_REQUESTED',revision_count=revision_count+1,revision_feedback=trim(p_feedback) where id=c.id;
 update public.tasks set status='REVISION_REQUESTED' where id=c.task_id;
 insert into public.reputation_events(contract_id,actor_id,event_type,payload) values(c.id,u,'REVISION_REQUESTED',jsonb_build_object('feedback',trim(p_feedback)));
 insert into public.notifications(user_id,kind,message,task_id,contract_id) values(c.student_id,'REVISION_REQUESTED','The client requested one revision.',c.task_id,c.id);
end $$;

create function private.recompute_evidence(p_student_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.student_skills(student_id,skill_id,completed_count,evidence_score,source_type)
 select p_student_id,ts.skill_id,count(*)::integer,round(100*least(count(*)::numeric/6,1))::integer,'VERIFIED_WORK'
 from public.contracts c join public.task_skills ts on ts.task_id=c.task_id
 where c.student_id=p_student_id and c.status='COMPLETED' group by ts.skill_id
 on conflict(student_id,skill_id) do update set completed_count=excluded.completed_count,evidence_score=excluded.evidence_score,source_type=excluded.source_type;
end $$;

create function public.approve_work(p_contract_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid := private.require_role('client'); c public.contracts;
begin
 select * into c from public.contracts where id=p_contract_id for update;
 if c.id is null or c.client_id<>u then raise exception 'FORBIDDEN: Not authorized' using errcode='42501'; end if;
 if c.status<>'SUBMITTED' then raise exception 'INVALID_STATE: Work must be submitted'; end if;
 perform 1 from public.profiles where id=c.student_id for update;
 if not exists(select 1 from public.submissions where contract_id=c.id) then raise exception 'INVALID_STATE: Submission missing'; end if;
 if not exists(select 1 from public.payments where contract_id=c.id and status='HELD' and amount=c.agreed_amount for update) then raise exception 'INVALID_STATE: Held payment missing'; end if;
 update public.contracts set status='COMPLETED',completed_at=now() where id=c.id;
 update public.tasks set status='COMPLETED' where id=c.task_id;
 update public.payments set status='RELEASED',released_at=now() where contract_id=c.id;
 perform private.recompute_evidence(c.student_id);
 insert into public.reputation_events(contract_id,actor_id,event_type,payload) values(c.id,u,'WORK_COMPLETED',jsonb_build_object('amount',c.agreed_amount,'simulated',true));
 insert into public.notifications(user_id,kind,message,task_id,contract_id) values(c.student_id,'WORK_COMPLETED','Work approved; simulated funds released.',c.task_id,c.id);
end $$;

create function public.review_work(p_contract_id uuid,p_rating integer,p_comment text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u uuid := private.require_role('client'); c public.contracts; rid uuid;
begin
 select * into c from public.contracts where id=p_contract_id for update;
 if c.id is null or c.client_id<>u then raise exception 'FORBIDDEN: Not authorized' using errcode='42501'; end if;
 if c.status<>'COMPLETED' then raise exception 'INVALID_STATE: Only completed work can be reviewed'; end if;
 if p_rating is null or p_rating not between 1 and 5 or p_comment is null or char_length(p_comment)>2000 then raise exception 'INVALID_INPUT: Invalid review'; end if;
 insert into public.reviews(contract_id,student_id,client_id,rating,comment) values(c.id,c.student_id,u,p_rating,trim(p_comment)) returning id into rid;
 insert into public.reputation_events(contract_id,actor_id,event_type,payload) values(c.id,u,'REVIEW_RECEIVED',jsonb_build_object('reviewId',rid,'rating',p_rating));
 insert into public.notifications(user_id,kind,message,task_id,contract_id) values(c.student_id,'REVIEW_RECEIVED','A client review was added to your career proof.',c.task_id,c.id);
 return rid;
end $$;

create function public.get_career_proof(p_student_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare e jsonb;
begin
 if not exists(select 1 from public.profiles where id=p_student_id and role='student') then raise exception 'NOT_FOUND: Student not found'; end if;
 e:=private.student_evidence(p_student_id,null);
 return jsonb_build_object('studentId',p_student_id,'completedCount',e->'completedCount','onTimeRate',e->'onTimeRate','averageRating',e->'averageRating',
 'earnedAmount',coalesce((select sum(p.amount) from public.payments p join public.contracts c on c.id=p.contract_id where c.student_id=p_student_id and c.status='COMPLETED' and p.status='RELEASED'),0),
 'recentWork',coalesce((select jsonb_agg(x.item order by x.completed_at desc) from (select c.completed_at,jsonb_build_object('id',c.id,'contractId',c.id,'taskId',t.id,'title',t.title,'completedAt',c.completed_at,'rating',r.rating,'skills',(select coalesce(jsonb_agg(s.slug order by s.slug),'[]'::jsonb) from public.task_skills ts join public.skills s on s.id=ts.skill_id where ts.task_id=t.id)) item
 from public.contracts c join public.tasks t on t.id=c.task_id left join public.reviews r on r.contract_id=c.id where c.student_id=p_student_id and c.status='COMPLETED' order by c.completed_at desc limit 10) x),'[]'::jsonb),
 'skills',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'slug',s.slug,'name',s.name,'evidenceScore',ss.evidence_score,'completedCount',ss.completed_count) order by s.slug) from public.student_skills ss join public.skills s on s.id=ss.skill_id where ss.student_id=p_student_id),'[]'::jsonb));
end $$;

-- PostgREST grants are explicit, not default PUBLIC execution.
revoke execute on all functions in schema public from public,anon,authenticated;
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_contract_participant(uuid),private.can_read_profile(uuid) to authenticated;
grant execute on function private.can_read_task(uuid) to anon,authenticated;
grant execute on function public.get_public_student_profiles(),public.get_career_proof(uuid) to anon,authenticated;
grant execute on function public.get_student_evidence(uuid,uuid),public.declare_skill(text),
 public.publish_task(text,text,numeric,timestamptz,jsonb,text,text[],uuid),public.apply_to_task(uuid,text),
 public.hire_application(uuid),public.submit_work(uuid,text,text),public.request_revision(uuid,text),
 public.approve_work(uuid),public.review_work(uuid,integer,text) to authenticated;
alter default privileges in schema public revoke execute on functions from public;