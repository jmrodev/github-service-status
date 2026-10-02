export const state = {
  rawData: null,
  selectedOrg: 'all',
  selectedRepo: 'all',
  userGitHubToken: localStorage.getItem('gh_user_pat') || '',
  authenticatedUser: null,
  activeCategoryMap: {},
  pollInterval: null
};

export function setToken(token) {
  state.userGitHubToken = token;
  if (token) {
    localStorage.setItem('gh_user_pat', token);
  } else {
    localStorage.removeItem('gh_user_pat');
    state.authenticatedUser = null;
  }
}
