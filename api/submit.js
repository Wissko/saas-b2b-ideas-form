const DEFAULT_REPO = 'Wissko/saas-b2b-ideas-form';
const DEFAULT_DATA_PATH = 'data/submissions.json';

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
};

const readBody = async (request) =>
  new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;

      if (body.length > 25_000) {
        reject(new Error('Payload too large'));
        request.destroy();
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });

const getConfig = () => ({
  repo: process.env.GITHUB_STORAGE_REPO || DEFAULT_REPO,
  path: process.env.GITHUB_STORAGE_PATH || DEFAULT_DATA_PATH,
  branch: process.env.GITHUB_STORAGE_BRANCH || 'main',
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
  adminPassword: process.env.ADMIN_PASSWORD,
});

const githubRequest = async ({ method = 'GET', url, token, body }) => {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));

  return { response, payload };
};

const decodeBase64 = (value = '') => Buffer.from(value, 'base64').toString('utf8');
const encodeBase64 = (value = '') => Buffer.from(value, 'utf8').toString('base64');
const encodeGitHubPath = (path) => path.split('/').map(encodeURIComponent).join('/');

const readSubmissionsFile = async ({ repo, path, branch, token }) => {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeGitHubPath(path)}?ref=${encodeURIComponent(branch)}`;
  const { response, payload } = await githubRequest({ url, token });

  if (response.status === 404) {
    return { submissions: [], sha: null };
  }

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to read submissions file');
  }

  const parsed = JSON.parse(decodeBase64(payload.content) || '[]');
  return { submissions: Array.isArray(parsed) ? parsed : [], sha: payload.sha };
};

const writeSubmissionsFile = async ({ repo, path, branch, token, submissions, sha }) => {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeGitHubPath(path)}`;
  const message = `Save SaaS idea submission ${new Date().toISOString()}`;
  const body = {
    message,
    content: encodeBase64(`${JSON.stringify(submissions, null, 2)}\n`),
    branch,
    sha: sha || undefined,
  };
  const { response, payload } = await githubRequest({ method: 'PUT', url, token, body });

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to write submissions file');
  }

  return payload.content?.sha;
};

const createSubmission = (body) => {
  const ideaOne = String(body.ideaOne || '').trim();
  const ideaTwo = String(body.ideaTwo || '').trim();
  const email = String(body.email || '').trim();

  if (ideaOne.length < 20 || ideaTwo.length < 20) {
    throw new Error('Both ideas are required');
  }

  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    email,
    ideaOne,
    ideaTwo,
    submittedAt: String(body.submittedAt || '').trim(),
    summary: String(body.summary || '').trim(),
    nextStep: String(body.nextStep || '').trim(),
    structuredMessage: String(body.structuredMessage || '').trim(),
  };
};

const handleGet = async (request, response, config) => {
  const providedPassword = request.headers['x-admin-password'];

  if (!config.adminPassword || providedPassword !== config.adminPassword) {
    sendJson(response, 401, { ok: false, error: 'Unauthorized' });
    return;
  }

  const { submissions } = await readSubmissionsFile(config);
  sendJson(response, 200, { ok: true, submissions: submissions.slice().reverse() });
};

const handlePost = async (request, response, config) => {
  const body = JSON.parse(await readBody(request));
  const submission = createSubmission(body);
  const { submissions, sha } = await readSubmissionsFile(config);
  const nextSubmissions = [...submissions, submission];
  const fileSha = await writeSubmissionsFile({ ...config, submissions: nextSubmissions, sha });

  sendJson(response, 200, { ok: true, id: submission.id, fileSha });
};

module.exports = async (request, response) => {
  const config = getConfig();

  if (!config.token) {
    sendJson(response, 503, { ok: false, error: 'GitHub storage is not configured' });
    return;
  }

  try {
    if (request.method === 'GET') {
      await handleGet(request, response, config);
      return;
    }

    if (request.method === 'POST') {
      await handlePost(request, response, config);
      return;
    }

    sendJson(response, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    const statusCode = error.message === 'Both ideas are required' ? 400 : 500;
    sendJson(response, statusCode, { ok: false, error: error.message || 'Unexpected error' });
  }
};
