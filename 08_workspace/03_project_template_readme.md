# optqo Platform - Workspace Organization Guide

## 📁 **Project-Based Workspace Structure**

When a user uploads a project, the workspace automatically creates an organized structure:

```
08_workspace/
├── 01_workspace-manager.js           ← Session management
├── 02_cleanup_workspace.bat          ← Cleanup utility
├── 03_project_template_readme.md     ← This guide
├── github-repos/                     ← Cached GitHub repositories
│   └── [owner-repo-timestamp]/
│       ├── source/                   ← Original repository files
│       ├── analysis/                 ← Analysis results
│       └── reports/                  ← Generated reports
└── local-projects/                   ← Local project uploads
    └── [project-name-timestamp]/
        ├── source/                   ← Original project files
        ├── analysis/                 ← Analysis results
        └── reports/                  ← Generated reports
```

## 🎯 **Project Structure Benefits:**

### **Isolation:**
- Each project has its own complete workspace
- No cross-contamination between projects
- Session-specific organization

### **Organization:**
- **source/**: Original files (untouched)
- **analysis/**: JSON analysis data, metrics, findings
- **reports/**: HTML/PDF reports, visualizations

### **Cleanup:**
- Project-specific cleanup (remove individual projects)
- Global cleanup (remove all temporary projects)
- Selective cleanup (keep important projects)

## 🔧 **Automatic Structure Creation:**

When a project is analyzed, the workspace manager automatically creates:
1. Timestamped project folder
2. Source, analysis, and reports subfolders
3. Proper file organization within each folder

This ensures clean, organized, and isolated project workspaces.
