// export interface GitHubContentItem {
//   name: string;
//   path: string;
//   type: 'file' | 'dir';
//   url: string;
//   download_url?: string;
//   contents?: GitHubContentItem[];
// }

export interface RepoViewerPageProps {
  repoOwner: string;
  repoName: string;
}

export interface RepoSelectionPageProps {
  onSubmit: (repoOwner: string, repoName: string) => void;
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  stars: number;
  lastUpdated: string;
  owner?: string;
}

export interface APIParameter {
  key: string;
  required: boolean;
  type: string;
}

export interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  params: APIParameter[];
  description: string;
}

export interface TestResult {
  timestamp: string;
  metrics: {
    http_req_duration: {
      avg: number;
      min: number;
      med: number;
      max: number;
      p90: number;
      p95: number;
    };
    http_reqs: number;
    iterations: number;
    vus: number;
    vus_max: number;
    success_rate: number;
    rps: number;
    http_req_blocked: number;
    http_req_connecting: number;
    http_req_tls_handshaking: number;
    http_req_sending: number;
    http_req_waiting: number;
    http_req_receiving: number;
    endpoints?: {
      method: string;
      path: string;
      success: boolean;
      successRate: number;
    }[];
  };
}

export interface GitHubContentItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  contents?: GitHubContentItem[];
}

export interface NetworkMetrics {
  name: string;
  value: number;
  unit: string;
}