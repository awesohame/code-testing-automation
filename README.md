# CodeVed

## Overview
CodeVed is a full-stack project built for Hacksplosion 25. It combines a modern React frontend, a Node.js/Express backend, and a Python microservice for document ingestion and standardization. The project demonstrates advanced integration of AI, GitHub API, and collaborative tools for developers.

---

## Features

### Multi-Tier Architecture
- **Client (React + Vite + TypeScript):**
  - Modern UI for interacting with repositories, users, and AI features
  - GitHub repo viewer with authentication
  - Onboarding and user profile management
  - Real-time feedback and error handling
- **Server (Node.js/Express + MongoDB):**
  - RESTful API for user, repo, and document management
  - User onboarding and authentication endpoints
  - GitHub API proxying and token management
  - Modular structure for controllers, routes, services, and models
- **Python Microservice:**
  - Document ingestion and standardization (PDF, DOC, etc.)
  - Exposes endpoints for document processing
  - Used for AI-powered document analysis

### AI & Automation
- **AI Call Agent:**
  - Integrates with Gemini API for AI-powered features
  - Automated code/document analysis and suggestions
- **Document Standardizer:**
  - Python scripts to standardize and extract data from uploaded documents

### Authentication & Security
- **Clerk Integration:**
  - Secure user authentication and session management
- **Environment-based Secrets:**
  - Uses `.env` files for API keys and tokens

### Modular & Scalable Codebase
- **Separation of Concerns:**
  - Clear separation between client, server, and Python services
- **Reusable Components:**
  - React components and hooks for maintainability
- **Extensible Backend:**
  - Easily add new routes, controllers, and services

### Developer Experience
- **Vite for Fast Frontend Development**
- **ESLint & TypeScript for Code Quality**
- **Hot Reloading and Modern Tooling**
- **Comprehensive README and Documentation**

---

## Getting Started

1. **Clone the repository**
2. **Install dependencies** in each subfolder (`client`, `server`, `python-server`, `ai-call-agent`)
3. **Set up environment variables** as per `.env.sample` files
4. **Run backend and frontend servers**
5. **Start Python microservice for document features**

---

## Folder Structure

- `client/` – React frontend
- `server/` – Node.js/Express backend
- `python-server/` – Python document/AI microservice
- `ai-call-agent/` – AI integration service
- `vscode-doc-generator/` – VS Code extension for documentation

---

## Contributing
Pull requests and issues are welcome! Please see the contributing guidelines in each subfolder.

---

