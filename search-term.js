// Utility functions
function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function highlightMatches(text, searchTerm) {
  const escapedText = escapeHtml(text);
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
}

function showStatus(message, type = 'info', loading = false) {
  const container = document.getElementById('statusContainer');
  if (loading) {
    container.innerHTML = `
      <div class="status-message ${type}">
        <div class="loading-spinner">
          <div class="toast-animation">
            <div class="toast"></div>
            <div class="butter"></div>
          </div>
          <span class="loading-text">${message}</span>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `<div class="status-message ${type}">${message}</div>`;
  }
}

// API functions
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

async function searchButterCMSPages(token, searchString, pageType) {
  const baseUrl = 'https://api.buttercms.com/v2/pages';
  const allPages = [];
  const failedPages = [];
  let page = 1;
  let hasMore = true;

  showStatus(`Fetching pages of type "${pageType}"...`, 'info', true);

  while (hasMore) {
    const url = `${baseUrl}/${pageType}/?auth_token=${token}&page=${page}&page_size=100`;

    try {
      const data = await fetchWithRetry(url);

      if (data.data && data.data.length > 0) {
        allPages.push(...data.data);
        hasMore = data.meta?.next_page !== null;
        page++;
        showStatus(`Fetched ${allPages.length} ${pluralize(allPages.length, 'page', 'pages')} so far...`, 'info', true);
      } else {
        hasMore = false;
      }
    } catch (error) {
      failedPages.push({ page, error: error.message });
      hasMore = false;
    }
  }

  showStatus(`Searching through ${allPages.length} ${pluralize(allPages.length, 'page', 'pages')}...`, 'info', true);

  const searchLower = searchString.toLowerCase();
  const results = [];

  function searchObject(obj, path = '', depth = 0) {
    const matches = [];
    
    if (depth > 10) return matches;
    if (obj === null || obj === undefined) return matches;

    if (typeof obj === 'string') {
      if (obj.toLowerCase().includes(searchLower)) {
        matches.push({
          path,
          value: obj.length > 200 ? obj.substring(0, 200) + '...' : obj
        });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        matches.push(...searchObject(item, `${path}[${index}]`, depth + 1));
      });
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'meta' || key === 'url' || key === 'href') continue;
        matches.push(...searchObject(value, path ? `${path}.${key}` : key, depth + 1));
      }
    }

    return matches;
  }

  for (const pageData of allPages) {
    const matches = searchObject(pageData);

    if (matches.length > 0) {
      const validMatches = matches.filter(m => m.value && m.value.trim().length > 0);
      
      if (validMatches.length > 0) {
        results.push({
          title: pageData.name || pageData.slug || 'Untitled',
          slug: pageData.slug,
          matches: validMatches
        });
      }
    }
  }

  return { results, totalPages: allPages.length, failedPages };
}

// Main search execution
async function executeSearch() {
  const token = getApiToken();
  const pageType = document.getElementById('pageType').value.trim();
  const searchTerm = document.getElementById('searchTerm').value.trim();
  const resultsContainer = document.getElementById('resultsContainer');
  const searchButton = document.getElementById('searchButton');

  resultsContainer.innerHTML = '';

  if (!token) {
    showStatus('Please enter your API token', 'error');
    return;
  }

  if (!pageType) {
    showStatus('Please enter a page type', 'error');
    return;
  }

  if (!searchTerm) {
    showStatus('Please enter a search term', 'error');
    return;
  }

  searchButton.disabled = true;

  try {
    const { results, totalPages, failedPages } = await searchButterCMSPages(token, searchTerm, pageType);

    if (results.length === 0) {
      showStatus(`No matches found for "${searchTerm}" in ${totalPages} ${pluralize(totalPages, 'page', 'pages')}`, 'info');
    } else {
      showStatus(`Found ${results.length} ${pluralize(results.length, 'page', 'pages')} with matches out of ${totalPages} total ${pluralize(totalPages, 'page', 'pages')}`, 'success');

      const resultsHtml = results.map(result => `
        <div class="result-item">
          <div class="result-header">
            <div>
              <div class="result-title">${escapeHtml(result.title)}</div>
              <div class="result-slug">${escapeHtml(result.slug)}</div>
            </div>
            <div class="match-count">${result.matches.length} ${pluralize(result.matches.length, 'match', 'matches')}</div>
          </div>
          <div class="matches-list">
            ${result.matches.map(match => `
              <div class="match-item">
                <div class="match-path">${escapeHtml(match.path)}</div>
                <div class="match-value">${highlightMatches(match.value, searchTerm)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

      resultsContainer.innerHTML = `
        <div class="summary">
          Found <strong>${results.length}</strong> ${pluralize(results.length, 'page', 'pages')} containing "<strong>${escapeHtml(searchTerm)}</strong>" with <strong>${totalMatches}</strong> total ${pluralize(totalMatches, 'match', 'matches')}
        </div>
        <div class="results-container">
          ${resultsHtml}
        </div>
      `;
    }

    if (failedPages.length > 0) {
      const failedHtml = `
        <div class="failed-pages">
          <h4>⚠️ Failed to retrieve ${failedPages.length} ${pluralize(failedPages.length, 'page', 'pages')}</h4>
          <p>Please check these manually:</p>
          <ul>
            ${failedPages.map(f => `<li>Page ${f.page}: ${escapeHtml(f.error)}</li>`).join('')}
          </ul>
        </div>
      `;
      resultsContainer.innerHTML += failedHtml;
    }

  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    searchButton.disabled = false;
  }
}

// Event listeners
const searchButton = document.getElementById('searchButton');
const searchTermInput = document.getElementById('searchTerm');

if (searchButton) {
  searchButton.addEventListener('click', executeSearch);
}

if (searchTermInput) {
  searchTermInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      executeSearch();
    }
  });
}