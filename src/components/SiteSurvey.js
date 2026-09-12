import { projectClient } from '../services/project-client.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

export async function SiteSurvey({ projectId, router }) {
  const [project, response] = await Promise.all([
    projectClient.getProject(projectId),
    projectClient.getSiteSurvey(projectId),
  ]);
  const survey = response?.siteSurvey || project.siteSurvey || {};
  const section = document.createElement('section');
  section.className = 'page site-survey-page';
  section.innerHTML = `
    <div class="site-survey-shell">
      <header class="site-survey-header">
        <div><p class="eyebrow">Project Recognition / Site Survey</p><h1>Site Survey</h1><p class="muted">Record actual site conditions for this project. Original Designer PDF remains unchanged.</p></div>
        <button class="button" type="button" data-back>← Recognition Workspace</button>
      </header>
      <div class="site-survey-context"><span class="eyebrow">Current Project</span><strong>${escapeHtml(project.project.name)}</strong><span class="status-pill">${escapeHtml(project.project.status || 'Active')}</span></div>
      <form class="site-survey-form" data-form>
        <div class="site-survey-form-header"><div><p class="eyebrow">Survey Record</p><h2>${survey.updatedAt ? 'Existing Site Survey' : 'No Site Survey Recorded'}</h2></div><label>Status<select name="status">${['Not Started', 'In Progress', 'Completed'].map((status) => `<option value="${status}" ${survey.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label></div>
        <label>Actual Measurements<textarea name="measurements" rows="6" placeholder="Record verified dimensions and levels.">${escapeHtml(survey.measurements || '')}</textarea></label>
        <label>Site Notes<textarea name="siteNotes" rows="5" placeholder="Record installation restrictions, access, and transportation notes.">${escapeHtml(survey.siteNotes || '')}</textarea></label>
        <label>Observations / Site Conditions<textarea name="observations" rows="5" placeholder="Record walls, ceiling, floor, beams, columns, windows, and doors.">${escapeHtml(survey.observations || '')}</textarea></label>
        <div class="site-survey-actions"><span class="site-survey-message" data-message aria-live="polite">${survey.updatedAt ? `Last saved ${escapeHtml(survey.updatedAt)}` : 'No Site Survey information recorded.'}</span><button class="button primary" type="submit" data-save>Save Site Survey</button></div>
      </form>
      <p class="site-survey-boundary">Measurements that modify the drawing belong on the editable Backup PDF. This page records project-level site information only.</p>
    </div>`;

  section.querySelector('[data-back]').addEventListener('click', () => router.navigate(`/recognition/${encodeURIComponent(projectId)}`));
  const form = section.querySelector('[data-form]');
  const saveButton = section.querySelector('[data-save]');
  const message = section.querySelector('[data-message]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    saveButton.textContent = 'Saving…';
    message.className = 'site-survey-message';
    message.textContent = 'Saving Site Survey…';
    const formData = new FormData(form);
    try {
      await projectClient.saveSiteSurvey(projectId, {
        status: formData.get('status'), measurements: formData.get('measurements'),
        siteNotes: formData.get('siteNotes'), observations: formData.get('observations'),
      });
      const refreshed = (await projectClient.getProject(projectId)).siteSurvey;
      if (!refreshed?.updatedAt) throw new Error('Server did not persist Site Survey data.');
      form.querySelector('[name="status"]').value = refreshed.status || 'In Progress';
      form.querySelector('[name="measurements"]').value = refreshed.measurements || '';
      form.querySelector('[name="siteNotes"]').value = refreshed.siteNotes || '';
      form.querySelector('[name="observations"]').value = refreshed.observations || '';
      message.className = 'site-survey-message success';
      message.textContent = `Saved to project at ${refreshed.updatedAt}`;
    } catch (error) {
      message.className = 'site-survey-message error';
      message.textContent = error.message || 'Unable to save Site Survey.';
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Save Site Survey';
    }
  });
  return section;
}
