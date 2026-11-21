(() => {
  'use strict';

  const OWNER = 'mechatxx';
  const REPO = 'mechatxx.github.io';
  const API = `https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&sort=created&direction=desc`;
  const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues/`;
