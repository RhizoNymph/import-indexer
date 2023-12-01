const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') })

import { Repo } from './types/repo';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/repoContentUrls/:user/:repo_name/:branch/:language', async (req, res) => {
  const { user, repo_name, branch, language } = req.params;
  console.log(`Fetching content URLs for repo: ${user}/${repo_name}, branch: ${branch}, language: ${language}`);
  const repo = new Repo(user, repo_name, branch, language);
  const fileUrls = await repo.getContentsURLs();
  console.log(`Successfully fetched content URLs for repo: ${user}/${repo_name}, branch: ${branch}, language: ${language}`);
  res.json(fileUrls);
});

app.get('/repoImports/:user/:repo_name/:branch/:language', async (req, res) => {
  const { user, repo_name, branch, language } = req.params;
  console.log(`Fetching imports for repo: ${user}/${repo_name}, branch: ${branch}, language: ${language}`);
  const repo = new Repo(user, repo_name, branch, language);
  const imports = await repo.getImports(`${user}.${repo_name}.${branch}.json`);
  console.log(`Successfully fetched imports for repo: ${user}/${repo_name}, branch: ${branch}, language: ${language}`);
  res.json(imports);
});

app.listen(2999, '0.0.0.0', () => {
  console.log('Server running on port 2999');
});