-- LOCAL DEVELOPMENT ONLY. Fictional accounts; this is the sole seed source.
-- Deterministic UUIDs: md5('campusgig:' || kind || ':' || index)::uuid.
-- Password for every fictional account: CampusGigLocal!2026 (not a production credential).
begin;
do $$
declare
  i integer; j integer; k integer; uid uuid; cid uuid; tid uuid; aid uuid; sid uuid;
  primary_student uuid := md5('campusgig:student:1')::uuid;
  client uuid; slug text; email text; role_name text; display_name text;
  skill_slugs text[] := array['react','nextjs','css','uiux','python','design','video','spreadsheet','writing'];
  skill_names text[] := array['React','Next.js','CSS','UI/UX','Python','Design','Video Editing','Spreadsheets','Writing'];
  student_names text[] := array['Aarav Mehta','Ananya Rao','Rohan Das','Isha Patel','Kabir Shah','Meera Nair','Dev Menon','Tara Singh','Arjun Bose','Nisha Kumar','Vihaan Joshi','Sana Ali','Aditi Sen','Kiran Iyer','Riya Kapoor','Neel Verma','Zoya Khan','Om Prakash','Maya Sethi','Varun Roy','Diya Jain','Rehan Malik','Leela Gupta','Sai Reddy'];
  client_names text[] := array['Paperplane Studio','Mango Grove Labs','Pebble Learning','Lantern Creative','Cedar Market','Bluebird Research','Juniper Works','Canvas Community'];
  titles text[] := array['Build an accessible landing page','Polish a Next.js dashboard','Improve responsive CSS layout','Design a student onboarding flow','Clean a small Python dataset','Create a community event poster','Edit a short campus event video','Build an expense spreadsheet','Write clear website copy'];
  done_at timestamptz; due_at timestamptz; price numeric(12,2); rating integer; match jsonb; evidence jsonb;
begin
  for i in 1..9 loop
    insert into public.skills(id,slug,name) values(md5('campusgig:skill:'||skill_slugs[i])::uuid,skill_slugs[i],skill_names[i]) on conflict do nothing;
  end loop;

  for i in 1..32 loop
    if i<=24 then
      role_name:='student'; j:=i; display_name:=case when j=1 then 'Yashwanth Demo' else student_names[j] end;
      email:='student'||lpad(j::text,2,'0')||'@campusgig.test';
    else
      role_name:='client'; j:=i-24; display_name:=case when j=1 then 'Demo Client' else client_names[j] end;
      email:='client'||lpad(j::text,2,'0')||'@campusgig.test';
    end if;
    uid:=md5('campusgig:'||role_name||':'||j)::uuid;
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    values('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',email,
      extensions.crypt('CampusGigLocal!2026',extensions.gen_salt('bf')), '2026-01-01 00:00:00+00',
      '{"provider":"email","providers":["email"]}'::jsonb,jsonb_build_object('role',role_name,'full_name',display_name),
      '2026-01-01 00:00:00+00','2026-01-01 00:00:00+00','','','','') on conflict(id) do nothing;
    insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values(md5('campusgig:identity:'||i)::uuid,uid,uid::text,jsonb_build_object('sub',uid::text,'email',email,'email_verified',true,'phone_verified',false),
      'email','2026-01-01 00:00:00+00','2026-01-01 00:00:00+00','2026-01-01 00:00:00+00') on conflict do nothing;
    if role_name='student' then
      update public.profiles set college='Fictional Campus University',bio='Fictional local demo student. Declared skills are not verified_status work evidence.',verified_status=(j=1) where id=uid;
      for k in 1..2 loop
        slug:=skill_slugs[1+((j+k-2)%9)];
        insert into public.student_skills(student_id,skill_id) values(uid,md5('campusgig:skill:'||slug)::uuid) on conflict do nothing;
      end loop;
    else
      update public.profiles set bio='Fictional local demo client. Payments on CampusGig are simulated.' where id=uid;
    end if;
  end loop;

  for i in 1..30 loop
    tid:=md5('campusgig:open-task:'||i)::uuid;
    client:=md5('campusgig:client:'||(1+((i-1)%8)))::uuid;
    j:=1+((i-1)%9); slug:=skill_slugs[j];
    insert into public.tasks(id,client_id,title,description,fixed_price,deadline,ai_analysis,ai_source,ai_hours_min,ai_hours_max,ai_deliverables,ai_requirements,created_at)
    values(tid,client,titles[j]||' — brief '||i,
      'Fictional local task: deliver one focused, documented artifact for this brief. Include a short handoff explaining choices and a reproducible review link.',
      400+(i%7)*100,'2030-06-01 12:00:00+00'::timestamptz+i*interval '1 day',
      jsonb_build_object('category',skill_names[j],'skills',jsonb_build_array(slug),'difficulty','Beginner','hoursMin',2,'hoursMax',4,'budgetMin',400+(i%7)*100,'budgetMax',400+(i%7)*100,'deliverables',jsonb_build_array('One reviewable artifact','Short handoff notes'),'requirements',jsonb_build_array('Use the supplied brief','Document assumptions')),
      'mock',2,4,'["One reviewable artifact","Short handoff notes"]','["Use the supplied brief","Document assumptions"]','2026-09-01 12:00:00+00') on conflict(id) do nothing;
    insert into public.task_skills(task_id,skill_id) values(tid,md5('campusgig:skill:'||slug)::uuid) on conflict do nothing;
  end loop;

  -- Primary career proof: 47 complete, 45 on time, INR 28,400 released,
  -- 38 five-star + 9 four-star reviews = 226/47 = 4.8085..., displays 4.8.
  for i in 1..47 loop
    tid:=md5('campusgig:completed-task:'||i)::uuid;
    aid:=md5('campusgig:application:'||i)::uuid;
    cid:=md5('campusgig:contract:'||i)::uuid;
    sid:=md5('campusgig:submission:'||i)::uuid;
    client:=md5('campusgig:client:'||(1+((i-1)%8)))::uuid;
    j:=1+((i-1)%9); slug:=skill_slugs[j];
    done_at:='2026-02-01 12:00:00+00'::timestamptz+i*interval '3 days';
    due_at:=done_at+case when i<=45 then interval '1 day' else interval '-1 day' end;
    price:=case when i=47 then 800 else 600 end;
    rating:=case when i<=38 then 5 else 4 end;
    insert into public.tasks(id,client_id,title,description,fixed_price,deadline,status,ai_analysis,ai_source,ai_hours_min,ai_hours_max,created_at)
    values(tid,client,titles[j]||' — completed project '||i,
      'Fictional completed project used to demonstrate deterministic evidence, simulated escrow, reviews, and the career proof ledger.',
      price,due_at,'COMPLETED',jsonb_build_object('skills',jsonb_build_array(slug),'hoursMin',2,'hoursMax',4),'mock',2,4,done_at-interval '7 days') on conflict(id) do nothing;
    insert into public.task_skills(task_id,skill_id) values(tid,md5('campusgig:skill:'||slug)::uuid) on conflict do nothing;
    evidence:=jsonb_build_object('studentId',primary_student,'skills','[]'::jsonb,'completedCount',0,'relevantCompletedCount',0,'activeContractCount',0,'averageRating',null,'onTimeRate',0);
    match:=private.match_score(evidence,tid);
    insert into public.applications(id,task_id,student_id,cover_note,status,match_score,match_breakdown,evidence_snapshot,created_at)
    values(aid,tid,primary_student,'I will deliver the artifact and concise handoff notes for this fictional project.','ACCEPTED',(match->>'total')::integer,match,evidence,done_at-interval '6 days') on conflict(id) do nothing;
    insert into public.contracts(id,task_id,application_id,student_id,client_id,status,agreed_amount,due_at,submitted_at,started_at,completed_at)
    values(cid,tid,aid,primary_student,client,'COMPLETED',price,due_at,done_at-interval '1 hour',done_at-interval '5 days',done_at) on conflict(id) do nothing;
    insert into public.submissions(id,contract_id,student_id,attempt_number,work_url,summary,submitted_at)
    values(sid,cid,primary_student,1,'https://example.com/campusgig/work/'||i,'Fictional deliverable with documented choices and handoff instructions.',done_at-interval '1 hour') on conflict(id) do nothing;
    insert into public.payments(id,contract_id,amount,status,created_at,released_at)
    values(md5('campusgig:payment:'||i)::uuid,cid,price,'RELEASED',done_at-interval '5 days',done_at) on conflict(id) do nothing;
    insert into public.reviews(id,contract_id,student_id,client_id,rating,comment,created_at)
    values(md5('campusgig:review:'||i)::uuid,cid,primary_student,client,rating,'Fictional review: clear handoff and useful deliverable.',done_at+interval '1 hour') on conflict(id) do nothing;
    insert into public.reputation_events(id,contract_id,actor_id,event_type,payload,created_at) values
      (md5('campusgig:event:hire:'||i)::uuid,cid,client,'HIRED',jsonb_build_object('amount',price,'currency','INR','simulated',true),done_at-interval '5 days'),
      (md5('campusgig:event:submit:'||i)::uuid,cid,primary_student,'WORK_SUBMITTED',jsonb_build_object('submissionId',sid,'attempt',1),done_at-interval '1 hour'),
      (md5('campusgig:event:approve:'||i)::uuid,cid,client,'WORK_COMPLETED',jsonb_build_object('amount',price,'simulated',true),done_at),
      (md5('campusgig:event:review:'||i)::uuid,cid,client,'REVIEW_RECEIVED',jsonb_build_object('rating',rating),done_at+interval '1 hour') on conflict(id) do nothing;
    insert into public.notifications(id,user_id,kind,message,task_id,contract_id,created_at)
    values(md5('campusgig:notification:'||i)::uuid,primary_student,'WORK_COMPLETED','Fictional work approved; simulated funds released.',tid,cid,done_at) on conflict(id) do nothing;
  end loop;
  perform private.recompute_evidence(primary_student);
  insert into public.verification_records(id,student_id,status,verified_at,method,created_at)
  values(md5('campusgig:verification:1')::uuid,primary_student,'VERIFIED','2026-01-01 00:00:00+00','LOCAL_DEMO_EXPLICIT','2026-01-01 00:00:00+00') on conflict(id) do nothing;

  if (select count(*) from public.profiles where role='student' and id in (select md5('campusgig:student:'||g)::uuid from generate_series(1,24) g))<>24 then raise exception 'Seed student count invalid'; end if;
  if (select count(*) from public.profiles where role='client' and id in (select md5('campusgig:client:'||g)::uuid from generate_series(1,8) g))<>8 then raise exception 'Seed client count invalid'; end if;
  if (select count(*) from public.tasks where status='OPEN' and id in (select md5('campusgig:open-task:'||g)::uuid from generate_series(1,30) g))<>30 then raise exception 'Seed open count invalid'; end if;
  evidence:=public.get_career_proof(primary_student);
  if (evidence->>'completedCount')::integer<>47 or (evidence->>'earnedAmount')::numeric<>28400
    or round((evidence->>'averageRating')::numeric,1)<>4.8
    or (select count(*) from public.contracts c where c.student_id=primary_student and c.status='COMPLETED' and c.submitted_at<=c.due_at)<>45
    or not (select verified_status from public.profiles where id=primary_student) then raise exception 'Seed primary proof invalid: %',evidence; end if;
end $$;
commit;