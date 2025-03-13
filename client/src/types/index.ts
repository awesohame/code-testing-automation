export interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  url: string;
  download_url?: string;
  contents?: GitHubContentItem[];
}

export interface RepoViewerPageProps {
  repoOwner: string;
  repoName: string;
}

export interface RepoSelectionPageProps {
  onSubmit: (repoOwner: string, repoName: string) => void;
}