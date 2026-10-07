import { expect, test, type Page } from "@playwright/test";
import {
  accounts, assertProofUI, attachEvidence, authenticatedDatabase,
  browserLogin, careerProof, collectBrowserErrors,
} from "./helpers";

test("real client → student → revision → approval → review produces committed career proof", async ({ browser }, info) => {
  const errors: string[] = [];
  const evidence: Record<string, unknown> = {};
  const clientContext = await browser.newContext();
  const studentContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  const studentPage = await studentContext.newPage();
  collectBrowserErrors(clientPage, "client", errors);
  collectBrowserErrors(studentPage, "student", errors);
  const client = await authenticatedDatabase(accounts.client);
  const student = await authenticatedDatabase(accounts.student);
  const outsider = await authenticatedDatabase(accounts.outsider);
  try {
    const before = await careerProof(student.db, student.id);
    evidence.before = before;
    // Failing here does not mutate the DB. Ask the lead to reseed before rerunning a completed loop.
    expect(before.completedCount, "Canonical fresh local seed required; do not silently repeat a committed loop").toBe(47);
    expect(Number(before.earnedAmount)).toBe(28400);
    await browserLogin(clientPage, accounts.client, "client");
    await browserLogin(studentPage, accounts.student, "student");
    await assertProofUI(studentPage, 47, 28400);

    const title = `E2E accessible React landing page ${Date.now()}`;
    evidence.title = title;
    await clientPage.goto("/client/tasks/new");
    await clientPage.getByLabel("Task title", { exact: true }).fill(title);
    await clientPage.getByLabel("The brief", { exact: true }).fill(
      "Build an accessible React landing page with responsive CSS for a campus community. Deliver the page, keyboard navigation, mobile layout checks and a short handoff. Use React and CSS; document the requirements and testing results.",
    );
    await clientPage.getByLabel("Fixed price (INR)", { exact: true }).fill("3000");
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const localDeadline = new Date(deadline.getTime() - deadline.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    await clientPage.getByLabel("Deadline", { exact: true }).fill(localDeadline);
    const analysisResponse = clientPage.waitForResponse(response => response.url().endsWith("/api/ai/analyze-task") && response.request().method() === "POST");
    await clientPage.getByRole("button", { name: "Analyze task", exact: true }).click();
    const response = await analysisResponse;
    expect(response.status()).toBe(200);
    const analysis = await response.json();
    expect(["live", "fallback"]).toContain(analysis.source);
    expect(analysis.analysis.skills.length).toBeGreaterThan(0);
    evidence.analysis = { source: analysis.source, analysis: analysis.analysis }; // Do not record signing tokens.
    await expect(clientPage.getByRole("heading", { name: "Review the analysis" })).toBeVisible();
    await clientPage.getByRole("button", { name: "Confirm and publish task", exact: true }).click();
    await expect(clientPage).toHaveURL(/\/tasks\/[0-9a-f-]{36}$/);
    const taskId = clientPage.url().split("/").at(-1)!;
    evidence.taskId = taskId;
    await expect(clientPage.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const taskResult = await client.db.from("tasks").select("id,client_id,title,fixed_price,status,ai_source").eq("id", taskId).single();
    expect(taskResult.error).toBeNull();
    expect(taskResult.data).toMatchObject({ client_id: client.id, title, fixed_price: 3000, status: "OPEN" });
    evidence.published = taskResult.data;

    await studentPage.goto("/tasks");
    await studentPage.getByRole("link", { name: title, exact: true }).click();
    await expect(studentPage.getByRole("heading", { name: /% evidence-based match$/ })).toBeVisible();
    const coverNote = "I can deliver accessible React components and responsive CSS, with keyboard checks and a documented handoff based on the agreed brief.";
    await studentPage.getByLabel("Why are you a good fit?", { exact: true }).fill(coverNote);
    await studentPage.getByRole("button", { name: "Apply for this task", exact: true }).click();
    await expect(studentPage.getByText("You have already applied.", { exact: true })).toBeVisible();
    const applicationResult = await student.db.from("applications").select("id,task_id,student_id,status,match_score,match_breakdown").eq("task_id", taskId).single();
    expect(applicationResult.error).toBeNull();
    expect(applicationResult.data).toMatchObject({ student_id: student.id, task_id: taskId, status: "PENDING" });
    const application = applicationResult.data!;
    expect(application.match_score).toBeGreaterThanOrEqual(0);
    expect(application.match_score).toBeLessThanOrEqual(100);
    expect(Object.keys(application.match_breakdown).length).toBeGreaterThan(0);
    await expect(studentPage.getByRole("heading", { name: `${application.match_score}% evidence-based match`, exact: true })).toBeVisible();
    evidence.application = application;

    await test.step("wrong client cannot hire another client's applicant", async () => {
      const denied = await outsider.db.rpc("hire_application", { p_application_id: application.id });
      expect(denied.error, "Unrelated authenticated client must not hire").not.toBeNull();
      expect(denied.error?.message).toMatch(/FORBIDDEN|NOT_FOUND|permission denied/i);
      const unchanged = await student.db.from("applications").select("status").eq("id", application.id).single();
      expect(unchanged.error).toBeNull();
      expect(unchanged.data?.status).toBe("PENDING");
      evidence.wrongClientHire = { code: denied.error?.code, message: denied.error?.message };
    });

    await clientPage.goto(`/client/tasks/${taskId}/applicants`);
    await expect(clientPage.getByText(coverNote, { exact: true })).toBeVisible();
    await clientPage.getByRole("button", { name: "Hire this student", exact: true }).click();
    await clientPage.getByRole("link", { name: "Open hired workspace", exact: true }).click();
    await expect(clientPage).toHaveURL(/\/client\/contracts\/[0-9a-f-]{36}$/);
    const contractId = clientPage.url().split("/").at(-1)!;
    evidence.contractId = contractId;
    const contractResult = await client.db.from("contracts").select("id,task_id,student_id,client_id,status,agreed_amount,revision_count").eq("id", contractId).single();
    expect(contractResult.error).toBeNull();
    expect(contractResult.data).toMatchObject({ task_id: taskId, client_id: client.id, student_id: student.id, status: "ACTIVE", agreed_amount: 3000, revision_count: 0 });
    evidence.hired = contractResult.data;

    await test.step("privileged profile and payment writes are denied by the real database", async () => {
      for (const mutation of [{ role: "admin" }, { verified_status: false }]) {
        const denied = await student.db.from("profiles").update(mutation).eq("id", student.id).select("id");
        expect(denied.error, "Role/verification mutations must be denied, not trusted from the browser").not.toBeNull();
      }
      const profile = await student.db.from("profiles").select("role,verified_status").eq("id", student.id).single();
      expect(profile.error).toBeNull();
      expect(profile.data).toMatchObject({ role: "student", verified_status: true });
      const denied = await student.db.from("payments").update({ amount: 1 }).eq("contract_id", contractId).select("id");
      expect(denied.error, "A student cannot rewrite payment amounts").not.toBeNull();
      const payment = await client.db.from("payments").select("status,amount,is_simulated").eq("contract_id", contractId).single();
      expect(payment.error).toBeNull();
      expect(payment.data).toMatchObject({ status: "HELD", amount: 3000, is_simulated: true });
      evidence.directWriteGuards = { unchangedProfile: profile.data, unchangedPayment: payment.data, paymentErrorCode: denied.error?.code };
    });

    await studentPage.goto("/student/dashboard");
    await studentPage.getByRole("link").filter({ has: studentPage.getByText(title, { exact: true }) }).click();
    await expect(studentPage).toHaveURL(new RegExp(`/student/work/${contractId}$`));
    const submit = async (page: Page, attempt: number) => {
      await page.getByLabel("Work URL", { exact: true }).fill(`https://example.com/campusgig-delivery/${taskId}/attempt-${attempt}`);
      await page.getByLabel("Delivery summary", { exact: true }).fill(
        attempt === 1 ? "Delivered the accessible React page with responsive CSS and keyboard navigation handoff." : "Delivered revised page with the requested mobile spacing, contrast checks and updated handoff.",
      );
      await page.getByRole("button", { name: attempt === 1 ? "Submit work" : "Resubmit work", exact: true }).click();
      await expect(page.getByText("Your work is with the client. Await approval or revision feedback.", { exact: true })).toBeVisible();
    };
    await submit(studentPage, 1);
    await clientPage.reload();
    await expect(clientPage.getByRole("button", { name: "Approve work", exact: true })).toBeVisible();

    await test.step("wrong client cannot approve and leaves contract/payment unchanged", async () => {
      const denied = await outsider.db.rpc("approve_work", { p_contract_id: contractId });
      expect(denied.error).not.toBeNull();
      expect(denied.error?.message).toMatch(/FORBIDDEN|NOT_FOUND|permission denied/i);
      const current = await client.db.from("contracts").select("status,completed_at").eq("id", contractId).single();
      expect(current.error).toBeNull();
      expect(current.data).toMatchObject({ status: "SUBMITTED", completed_at: null });
      evidence.wrongClientApproval = { code: denied.error?.code, message: denied.error?.message };
    });

    await clientPage.getByText("Request the one allowed revision", { exact: true }).click();
    const feedback = "Please improve the mobile spacing and include documented contrast checks in the handoff.";
    await clientPage.getByLabel("Revision feedback", { exact: true }).fill(feedback);
    await clientPage.getByRole("button", { name: "Request revision", exact: true }).click();
    await expect(clientPage.getByText("Revision requested. Waiting for the second delivery.", { exact: true })).toBeVisible();
    await studentPage.reload();
    await expect(studentPage.getByText(feedback, { exact: true })).toBeVisible();
    await submit(studentPage, 2);
    await clientPage.reload();
    await expect(clientPage.getByText(/Attempt 2/)).toBeVisible();
    await expect(clientPage.getByText("Request the one allowed revision", { exact: true })).toHaveCount(0);
    const secondRevision = await client.db.rpc("request_revision", { p_contract_id: contractId, p_feedback: "A second revision must not be allowed by the server." });
    expect(secondRevision.error, "The database enforces the one-revision limit independently of hidden UI controls").not.toBeNull();
    evidence.secondRevisionDenied = { code: secondRevision.error?.code, message: secondRevision.error?.message };
    await clientPage.getByRole("button", { name: "Approve work", exact: true }).click();
    await expect(clientPage.getByText("Work completed. Career proof is now backed by this contract.", { exact: true })).toBeVisible();
    await expect(clientPage.getByRole("heading", { name: "RELEASED", exact: true })).toBeVisible();
    await clientPage.getByRole("combobox", { name: /^Rating/ }).selectOption("5");
    const reviewComment = "Delivered accessible React components, responsive CSS and a clear revised handoff on time.";
    await clientPage.getByLabel("What did this student deliver?", { exact: true }).fill(reviewComment);
    await clientPage.getByRole("button", { name: "Publish review", exact: true }).click();
    await expect(clientPage.getByText(reviewComment, { exact: true })).toBeVisible();

    const [contract, task, payment, submissions, reviews] = await Promise.all([
      client.db.from("contracts").select("status,agreed_amount,revision_count,completed_at").eq("id", contractId).single(),
      client.db.from("tasks").select("status").eq("id", taskId).single(),
      client.db.from("payments").select("status,amount,is_simulated,released_at").eq("contract_id", contractId).single(),
      student.db.from("submissions").select("attempt_number,work_url,summary").eq("contract_id", contractId).order("attempt_number"),
      client.db.from("reviews").select("rating,comment,student_id,client_id").eq("contract_id", contractId),
    ]);
    for (const result of [contract, task, payment, submissions, reviews]) expect(result.error).toBeNull();
    expect(contract.data).toMatchObject({ status: "COMPLETED", agreed_amount: 3000, revision_count: 1 });
    expect(contract.data?.completed_at).toBeTruthy();
    expect(task.data?.status).toBe("COMPLETED");
    expect(payment.data).toMatchObject({ status: "RELEASED", amount: 3000, is_simulated: true });
    expect(payment.data?.released_at).toBeTruthy();
    expect(submissions.data?.map(row => row.attempt_number)).toEqual([1, 2]);
    expect(reviews.data).toHaveLength(1);
    expect(reviews.data?.[0]).toMatchObject({ rating: 5, comment: reviewComment, student_id: student.id, client_id: client.id });
    const repeatApproval = await client.db.rpc("approve_work", { p_contract_id: contractId });
    expect(repeatApproval.error, "Repeated approval must not release or award twice").not.toBeNull();
    evidence.repeatApprovalDenied = { code: repeatApproval.error?.code, message: repeatApproval.error?.message };
    const after = await careerProof(student.db, student.id);
    expect(after.completedCount).toBe(48);
    expect(Number(after.earnedAmount)).toBe(31400);
    expect(after.averageRating).toBeCloseTo(231 / 48, 6);
    evidence.after = { proof: after, contract: contract.data, task: task.data, payment: payment.data, submissions: submissions.data, reviews: reviews.data };
    await studentPage.goto("/student/dashboard");
    await assertProofUI(studentPage, 48, 31400);
    await expect(studentPage.getByRole("region", { name: "Career proof" }).getByText(title, { exact: true })).toBeVisible();
    await clientPage.getByRole("link", { name: "View career proof", exact: true }).click();
    await assertProofUI(clientPage, 48, 31400);
    for (const width of [390, 360]) {
      for (const [page, routes, role] of [
        [clientPage, [`/client/dashboard`, `/tasks/${taskId}`, `/client/tasks/${taskId}/applicants`, `/client/contracts/${contractId}`], "client"],
        [studentPage, [`/student/dashboard`, `/tasks/${taskId}`, `/student/work/${contractId}`, `/students/${student.id}`], "student"],
      ] as const) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of routes) {
          const mobileResponse = await page.goto(route);
          expect(mobileResponse?.status(), `${role} ${route} mobile`).toBe(200);
          await expect(page.getByRole("main")).toBeVisible();
          const dimensions = await page.evaluate(() => ({
            viewport: document.documentElement.clientWidth,
            document: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
          }));
          expect(dimensions.document, `${route} overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
          expect(dimensions.body, `${route} body overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
          await info.attach(`${role}-${width}-${route.replaceAll("/", "_")}`, {
            body: await page.screenshot({ fullPage: true }), contentType: "image/png",
          });
        }
      }
    }
    expect(errors, "No browser runtime or console errors during the real workflow").toEqual([]);
  } finally {
    evidence.browserErrors = errors;
    await attachEvidence(info, evidence);
    await Promise.all([clientContext.close(), studentContext.close()]);
    await Promise.all([client.db.auth.signOut(), student.db.auth.signOut(), outsider.db.auth.signOut()]);
  }
});