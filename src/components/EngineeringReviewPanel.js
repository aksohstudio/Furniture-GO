const API_BASE = '';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function severityClass(severity) {
  return String(severity || '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function formatLocation(location) {
  if (!location || typeof location !== 'object') {
    return '—';
  }

  const values = Object.entries(location)
    .filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== ''
    )
    .map(
      ([key, value]) =>
        `${key}: ${value}`
    );

  return values.length
    ? values.join(' · ')
    : '—';
}

function issueTitle(issue) {
  return (
    issue.type ||
    'Engineering Issue'
  );
}

function renderIssue(issue) {
  const severity =
    issue.severity || 'Warning';

  const status =
    issue.status || 'Open';

  return `
    <article
      class="engineering-review-issue engineering-review-issue--${escapeHtml(
        severityClass(severity)
      )}"
      data-issue-id="${escapeHtml(
        issue.id
      )}"
    >
      <div class="engineering-review-issue-header">
        <div>
          <div class="engineering-review-issue-title">
            ${escapeHtml(
              issueTitle(issue)
            )}
          </div>

          <div class="engineering-review-issue-id">
            ${escapeHtml(issue.id)}
          </div>
        </div>

        <div class="engineering-review-badges">
          <span class="engineering-review-badge engineering-review-badge--severity">
            ${escapeHtml(severity)}
          </span>

          <span class="engineering-review-badge engineering-review-badge--status">
            ${escapeHtml(status)}
          </span>
        </div>
      </div>

      <div class="engineering-review-issue-description">
        ${escapeHtml(
          issue.description || 'No description'
        )}
      </div>

      <dl class="engineering-review-issue-details">
        <div>
          <dt>Location</dt>
          <dd>
            ${escapeHtml(
              formatLocation(
                issue.location
              )
            )}
          </dd>
        </div>

        <div>
          <dt>Engineering Record</dt>
          <dd>
            ${escapeHtml(
              issue.engineeringRecordId ||
                '—'
            )}
          </dd>
        </div>

        <div>
          <dt>Confidence</dt>
          <dd>
            ${
              typeof issue.recognitionConfidence ===
              'number'
                ? `${Math.round(
                    issue.recognitionConfidence *
                      100
                  )}%`
                : '—'
            }
          </dd>
        </div>
      </dl>
    </article>
  `;
}

function renderEmpty() {
  return `
    <div class="engineering-review-empty">
      <div class="engineering-review-empty-title">
        No Engineering Issues
      </div>

      <div class="engineering-review-empty-description">
        No engineering review items are currently recorded for this project.
      </div>
    </div>
  `;
}

function renderError(message) {
  return `
    <div class="engineering-review-error">
      ${escapeHtml(message)}
    </div>
  `;
}

function renderLoading() {
  return `
    <div class="engineering-review-loading">
      Loading Engineering Issues…
    </div>
  `;
}

async function requestIssues(projectId) {
  if (
    typeof projectId !== 'string' ||
    !projectId.trim()
  ) {
    throw new Error(
      'Project ID is required'
    );
  }

  const response =
    await fetch(
      `${API_BASE}/api/projects/${encodeURIComponent(
        projectId
      )}/engineering-issues`
    );

  let payload = null;

  try {
    payload =
      await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ||
        `Unable to load Engineering Issues (${response.status})`
    );
  }

  return Array.isArray(
    payload
  )
    ? payload
    : [];
}

export async function EngineeringReviewPanel(
  {
    projectId,
    className = '',
  } = {}
) {
  const root =
    document.createElement('section');

  root.className =
    [
      'engineering-review-panel',
      className,
    ]
      .filter(Boolean)
      .join(' ');

  root.innerHTML = `
    <div class="engineering-review-panel-header">
      <div>
        <div class="engineering-review-panel-kicker">
          Sprint 03
        </div>

        <h2 class="engineering-review-panel-title">
          Engineering Review
        </h2>

        <p class="engineering-review-panel-description">
          Engineering Issues detected during Project Recognition.
        </p>
      </div>

      <button
        type="button"
        class="engineering-review-refresh"
      >
        Refresh
      </button>
    </div>

    <div class="engineering-review-summary">
      <span class="engineering-review-count">
        0 Issues
      </span>
    </div>

    <div class="engineering-review-content">
      ${renderLoading()}
    </div>
  `;

  const content =
    root.querySelector(
      '.engineering-review-content'
    );

  const count =
    root.querySelector(
      '.engineering-review-count'
    );

  const refreshButton =
    root.querySelector(
      '.engineering-review-refresh'
    );

  async function load() {
    content.innerHTML =
      renderLoading();

    refreshButton.disabled =
      true;

    try {
      const issues =
        await requestIssues(
          projectId
        );

      count.textContent =
        `${issues.length} ${
          issues.length === 1
            ? 'Issue'
            : 'Issues'
        }`;

      if (!issues.length) {
        content.innerHTML =
          renderEmpty();

        return;
      }

      content.innerHTML =
        `
          <div class="engineering-review-issues">
            ${issues
              .map(renderIssue)
              .join('')}
          </div>
        `;
    } catch (error) {
      count.textContent =
        'Unable to load';

      content.innerHTML =
        renderError(
          error.message
        );
    } finally {
      refreshButton.disabled =
        false;
    }
  }

  refreshButton.addEventListener(
    'click',
    load
  );

  await load();

  return root;
}

export default EngineeringReviewPanel;