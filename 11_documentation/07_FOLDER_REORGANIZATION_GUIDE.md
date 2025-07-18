# optqo Platform v2.0 - Manual Folder Reorganization Guide

## 🎯 Current Issue
The old folders (06_tests, 10_demo, 12_gui_outputs, 13_gui_repos) are still present in VS Code's file explorer, even though we've created the new structure.

## ✅ Quick Fix - Manual Steps

### Step 1: Copy Files to New Locations

**Copy all files from:**
- `06_tests/*` → `06_quality_assurance/`
- `10_demo/*` → `15_launcher/examples/`
- `12_gui_outputs/*` → `14_gui/01_outputs/`
- `13_gui_repos/*` → `14_gui/02_repos/`

### Step 2: Delete Old Folders
After copying, delete these old folders:
- ❌ Delete: `06_tests`
- ❌ Delete: `10_demo`
- ❌ Delete: `12_gui_outputs`
- ❌ Delete: `13_gui_repos`

### Step 3: Verify New Structure
Your final structure should look like:

```
37_optqo_IDE_Cli/
├── 06_quality_assurance/     ← All test files moved here
├── 14_gui/
│   ├── 01_outputs/           ← GUI output files
│   ├── 02_repos/             ← GUI repository files
│   └── enhanced_interface.html
├── 15_launcher/
│   ├── examples/             ← Demo files moved here
│   ├── 01_main.js
│   └── 02_launcher.js
└── [other folders unchanged]
```

## 🚀 Alternative: PowerShell One-Liner

If you prefer to use PowerShell, run this in the project root:

```powershell
# Copy and remove old folders
robocopy "06_tests" "06_quality_assurance" /E /MOVE
robocopy "10_demo" "15_launcher\examples" /E /MOVE  
robocopy "12_gui_outputs" "14_gui\01_outputs" /E /MOVE
robocopy "13_gui_repos" "14_gui\02_repos" /E /MOVE
```

## ✨ Benefits After Reorganization

1. **Clear Structure**: Quality assurance in dedicated folder
2. **GUI Organization**: All GUI components under 14_gui
3. **Launcher Examples**: Demo files properly organized
4. **Production Ready**: Clean, professional structure

## 🔧 Updated Commands

After reorganization, use:
- Tests: `npm test` (points to 06_quality_assurance)
- Server: `npm run server` (enhanced interface)
- Examples: Check `15_launcher/examples/`

The new structure is designed for multi-user environments with proper workspace isolation!
