# optqo Platform v2.0 - Logical Folder Reorganization Plan

## 🎯 Current Issues
- Missing sequence numbers (gaps at 10, 12, 13)
- 07_outputs redundant (outputs now in workspaces)
- Illogical order for platform initiation
- User-facing elements scattered

## ✅ Proposed Logical Structure

### **Platform Initiation Flow:**

```
01_launcher/           ← Entry point (was 15_launcher)
├── main.js           ← Primary entry
├── cli.js            ← Command line interface  
└── examples/         ← Demo usage

02_config/            ← Configuration (was 05_config)
├── agent-contexts.json
├── settings.json
└── environments/

03_prompts/           ← AI prompts (unchanged)
├── financial-analysis-prompts.json
└── [context-specific prompts]

04_templates/         ← Output templates (unchanged)
├── html/
└── markdown/

05_core/              ← Core engine (was 01_core)
├── modular-agent.js
├── report-generator.js
└── context-manager.js

06_activities/        ← Processing modules (was 02_activities)
├── analyze/
├── optimize/
└── document/

07_interface/         ← User interfaces (was 14_gui)
├── web/
│   ├── enhanced_interface.html
│   ├── standalone_interface.html
│   └── assets/
├── electron/
│   ├── main.cjs
│   └── preload.cjs
└── servers/          ← (was 16_scripts)
    ├── simple_enhanced_server.js
    ├── basic_server.js
    └── gui_launcher.js

08_workspace/         ← Session management (was 09_workspace)
├── workspace-manager.js
├── sessions/         ← User workspaces with outputs
└── templates/

09_quality_assurance/ ← Testing (was 06_quality_assurance)
├── test-suite.js
├── validation/
└── benchmarks/

10_utils/             ← Helper functions (was 08_utils)
├── file-operations.js
├── data-processing.js
└── integrations/

11_documentation/     ← Guides and docs (was 17_documentation)
├── user-guide.md
├── api-reference.md
└── development/

12_integrations/      ← External connections (was 11_github)
├── github/
├── apis/
└── plugins/
```

## 🚀 Key Changes

### **Removed:**
- ❌ `07_outputs` → Outputs now in `08_workspace/sessions/`
- ❌ `16_scripts` → Moved to `07_interface/servers/`

### **Reorganized by Logic:**
1. **01_launcher** - Where users start
2. **02_config** - What they configure first  
3. **03_prompts** - AI instructions
4. **04_templates** - Output formatting
5. **05_core** - Engine execution
6. **06_activities** - Processing logic
7. **07_interface** - User interaction
8. **08_workspace** - Session/output management
9. **09_quality_assurance** - Validation
10. **10_utils** - Supporting functions
11. **11_documentation** - Help and guides
12. **12_integrations** - External connections

## ✅ Benefits

- **Logical Flow**: Follows platform initiation sequence
- **No Gaps**: Complete 01-12 numbering
- **Session Isolation**: Outputs in workspace sessions
- **User-Centric**: Interface and launcher prioritized
- **Clean Architecture**: Related components grouped

## 🔧 Implementation

Would you like me to implement this reorganization?
This creates a much more intuitive structure for developers and users.
