import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api/v1';
const ADMIN_EMAIL = 'admin.autotest@example.com';
const ADMIN_PASSWORD = 'Admin@12345';
const TEMP_USER_EMAIL = `user.autotest.${Date.now()}@example.com`;
const TEMP_USER_PASSWORD = 'User@12345';
const AI_NO_DATA_MESSAGE = "I haven't added that yet, but working on it.";

const results = [];

const record = (label, passed, details = '') => {
  results.push({ label, passed, details });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${label}${details ? ` - ${details}` : ''}`);
};

const jsonRequest = async (url, options = {}) => {
  const response = await fetch(url, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { response, payload };
};

const createTinyPdfFile = async (filePath) => {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
  await fs.writeFile(filePath, content);
};

const createTinyPngFile = async (filePath) => {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sP2fGQAAAAASUVORK5CYII=';
  await fs.writeFile(filePath, Buffer.from(pngBase64, 'base64'));
};

const assertStatus = (label, actual, expected) => {
  record(label, actual === expected, `expected ${expected}, got ${actual}`);
};

const run = async () => {
  const tempDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(tempDir, { recursive: true });
  const pdfPath = path.join(tempDir, `autotest-${Date.now()}.pdf`);
  const pngPath = path.join(tempDir, `autotest-${Date.now()}.png`);
  await createTinyPdfFile(pdfPath);
  await createTinyPngFile(pngPath);

  let adminToken = '';
  let createdExperienceId = '';
  let createdResumeId = '';
  let createdCertificateId = '';
  let createdProjectId = '';
  let tempUserId = '';

  try {
    const loginResult = await jsonRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    assertStatus('Auth login admin', loginResult.response.status, 200);
    adminToken = loginResult.payload?.token || '';
    record('Auth token received', Boolean(adminToken));

    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    const invalidExperienceCreate = await jsonRequest(`${BASE_URL}/admin/experiences`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: 'A', role: 'B' }),
    });
    assertStatus('Experience create invalid payload', invalidExperienceCreate.response.status, 400);

    const validExperienceCreate = await jsonRequest(`${BASE_URL}/admin/experiences`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: 'AutoTest Labs',
        role: 'Backend Engineer',
        duration: 'Jan-2025 - Ongoing',
        description: 'Built resilient admin modules with validations.',
      }),
    });
    assertStatus('Experience create valid', validExperienceCreate.response.status, 201);
    createdExperienceId = validExperienceCreate.payload?.item?._id || '';
    record('Experience id returned', Boolean(createdExperienceId));

    const experiencePatch = await jsonRequest(
      `${BASE_URL}/admin/experiences/${createdExperienceId}`,
      {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: 'Updated Duration' }),
      }
    );
    assertStatus('Experience patch partial', experiencePatch.response.status, 200);

    const experienceDelete = await jsonRequest(
      `${BASE_URL}/admin/experiences/${createdExperienceId}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    );
    assertStatus('Experience delete existing', experienceDelete.response.status, 200);

    const experienceDeleteMissing = await jsonRequest(
      `${BASE_URL}/admin/experiences/${createdExperienceId}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    );
    assertStatus('Experience delete missing', experienceDeleteMissing.response.status, 404);

    const badResumeForm = new FormData();
    badResumeForm.set('title', 'Invalid Resume');
    badResumeForm.set('category', 'fullstack');
    badResumeForm.set('file', new Blob(['plain text'], { type: 'text/plain' }), 'invalid.txt');
    const invalidResumeUpload = await fetch(`${BASE_URL}/admin/resumes`, {
      method: 'POST',
      headers: authHeaders,
      body: badResumeForm,
    });
    assertStatus('Resume upload invalid type', invalidResumeUpload.status, 400);

    const resumeForm = new FormData();
    resumeForm.set('title', 'Auto Resume');
    resumeForm.set('category', 'backend');
    resumeForm.set('file', new Blob([await fs.readFile(pdfPath)], { type: 'application/pdf' }), 'resume.pdf');
    const validResumeUploadResult = await jsonRequest(`${BASE_URL}/admin/resumes`, {
      method: 'POST',
      headers: authHeaders,
      body: resumeForm,
    });
    assertStatus('Resume upload valid', validResumeUploadResult.response.status, 201);
    createdResumeId = validResumeUploadResult.payload?.item?._id || '';
    record('Resume id returned', Boolean(createdResumeId));

    const resumePatch = await jsonRequest(`${BASE_URL}/admin/resumes/${createdResumeId}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Auto Resume Updated' }),
    });
    assertStatus('Resume patch partial', resumePatch.response.status, 200);

    const resumeDelete = await jsonRequest(`${BASE_URL}/admin/resumes/${createdResumeId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assertStatus('Resume delete existing', resumeDelete.response.status, 200);

    const invalidCertificate = await jsonRequest(`${BASE_URL}/certificates`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No Org' }),
    });
    assertStatus('Certificate create invalid', invalidCertificate.response.status, 400);

    const certificateForm = new FormData();
    certificateForm.set('title', 'Auto Certificate');
    certificateForm.set('organization', 'Auto Org');
    certificateForm.set('issuedDate', '2026-01-15');
    certificateForm.set('image', new Blob([await fs.readFile(pngPath)], { type: 'image/png' }), 'cert.png');
    const validCertificate = await jsonRequest(`${BASE_URL}/certificates`, {
      method: 'POST',
      headers: authHeaders,
      body: certificateForm,
    });
    assertStatus('Certificate create valid', validCertificate.response.status, 201);
    createdCertificateId = validCertificate.payload?.item?._id || '';
    record('Certificate id returned', Boolean(createdCertificateId));

    const certificatePatch = await jsonRequest(
      `${BASE_URL}/certificates/${createdCertificateId}`,
      {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization: 'Updated Org' }),
      }
    );
    assertStatus('Certificate patch partial', certificatePatch.response.status, 200);

    const certificateDelete = await jsonRequest(
      `${BASE_URL}/certificates/${createdCertificateId}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    );
    assertStatus('Certificate delete existing', certificateDelete.response.status, 200);

    const invalidProject = await jsonRequest(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auto Project',
        description: 'This description is intentionally valid length.',
        category: 'MERN',
        date: '2026-01',
      }),
    });
    assertStatus('Project create invalid date', invalidProject.response.status, 400);

    const validProject = await jsonRequest(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auto Project',
        description: 'This project validates CRUD and schema consistency.',
        category: 'MERN',
        tags: 'test,admin,api',
        github: '',
        live: '',
        image: '',
        date: 'Jan-2026',
      }),
    });
    assertStatus('Project create valid', validProject.response.status, 201);
    createdProjectId = validProject.payload?.item?._id || '';
    record('Project id returned', Boolean(createdProjectId));

    const projectPatch = await jsonRequest(`${BASE_URL}/projects/${createdProjectId}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Updated description for patch test.' }),
    });
    assertStatus('Project patch partial', projectPatch.response.status, 200);

    const projectDelete = await jsonRequest(`${BASE_URL}/projects/${createdProjectId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assertStatus('Project delete existing', projectDelete.response.status, 200);

    const tempRegister = await jsonRequest(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Temp User',
        email: TEMP_USER_EMAIL,
        password: TEMP_USER_PASSWORD,
        confirmPassword: TEMP_USER_PASSWORD,
      }),
    });
    assertStatus('Temp user register', tempRegister.response.status, 201);
    tempUserId = tempRegister.payload?.user?._id || '';
    record('Temp user id returned', Boolean(tempUserId));

    const usersList = await jsonRequest(`${BASE_URL}/admin/users`, {
      headers: authHeaders,
    });
    assertStatus('Users list', usersList.response.status, 200);

    const rolePromote = await jsonRequest(`${BASE_URL}/admin/users/${tempUserId}/role`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    });
    assertStatus('User role update', rolePromote.response.status, 200);

    const roleDemote = await jsonRequest(`${BASE_URL}/admin/users/${tempUserId}/role`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user' }),
    });
    assertStatus('User role demote', roleDemote.response.status, 200);

    const selfDeleteAttempt = await jsonRequest(
      `${BASE_URL}/admin/users/${loginResult.payload?.user?._id}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    );
    assertStatus('Prevent self delete admin', selfDeleteAttempt.response.status, 400);

    const tempUserDelete = await jsonRequest(`${BASE_URL}/admin/users/${tempUserId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assertStatus('Delete non-admin user', tempUserDelete.response.status, 200);

    const analyticsEvent = await jsonRequest(`${BASE_URL}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 'ai-chatbot', type: 'view', delta: 1 }),
    });
    assertStatus('Analytics event track', analyticsEvent.response.status, 201);

    const analyticsSummary = await jsonRequest(`${BASE_URL}/analytics/summary`, {
      headers: authHeaders,
    });
    assertStatus('Analytics summary', analyticsSummary.response.status, 200);
    record(
      'Analytics summary structure',
      Boolean(
        analyticsSummary.payload?.item &&
          Object.prototype.hasOwnProperty.call(analyticsSummary.payload.item, 'totalVisitors')
      )
    );

    const contactMessage = await jsonRequest(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auto Contact',
        email: 'contact.autotest@example.com',
        message: 'Testing admin dashboard contact retrieval.',
      }),
    });
    assertStatus('Contact create', contactMessage.response.status, 201);

    const contactList = await jsonRequest(`${BASE_URL}/contact`, {
      headers: authHeaders,
    });
    assertStatus('Contact list admin', contactList.response.status, 200);

    const aiChat = await jsonRequest(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What projects have you built?' }),
    });
    assertStatus('AI chat query', aiChat.response.status, 200);
    const aiAnswer = String(aiChat.payload?.item?.answer || '');
    record('AI answer available', aiAnswer.length > 0);
    record(
      'AI persona first-person',
      /\b(i|my|me)\b/i.test(aiAnswer) || aiAnswer === AI_NO_DATA_MESSAGE
    );
    record(
      'AI answer concise',
      aiAnswer.split('\n').filter(Boolean).length <= 4
    );

    const aiUnknown = await jsonRequest(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is your Kubernetes certification ID?' }),
    });
    assertStatus('AI unknown query', aiUnknown.response.status, 200);
    record('AI no-data fallback', aiUnknown.payload?.item?.answer === AI_NO_DATA_MESSAGE);

    const aiAmbiguous = await jsonRequest(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'tell me more' }),
    });
    assertStatus('AI ambiguous query', aiAmbiguous.response.status, 200);
    record(
      'AI clarification handling',
      String(aiAmbiguous.payload?.item?.answer || '').toLowerCase().includes('ask specifically')
    );
  } finally {
    await fs.unlink(pdfPath).catch(() => {});
    await fs.unlink(pngPath).catch(() => {});
  }

  const failed = results.filter((item) => !item.passed);
  console.log('\n================ TEST SUMMARY ================');
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log('Failed cases:');
    failed.forEach((item) => console.log(`- ${item.label}: ${item.details}`));
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('Fatal test runner error', error);
  process.exit(1);
});
