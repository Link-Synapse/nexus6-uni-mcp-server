export interface Config {
  airtable: {
    apiKey: string;
    baseId: string;
  };
  github: {
    token: string;
    owner: string;
    repo: string;
  };
}

export function loadConfig(): Config {
  return {
    airtable: {
      apiKey: process.env.AIRTABLE_API_KEY!,
      baseId: process.env.AIRTABLE_BASE_ID!
    },
    github: {
      token: process.env.GITHUB_TOKEN!,
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!
    }
  };
}
