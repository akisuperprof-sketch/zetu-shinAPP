# ZETUSHIN Master Architecture Specification

## 1. System Overview
ZETUSHIN is a Tongue Diagnosis AI Assistant designed to research and analyze tongue features mapping to traditional medicine concepts (e.g., JIKKAN, JITSUNETSU). The system focuses entirely on providing observational assistance and research metrics without outputting definitive medical diagnoses. The architecture is explicitly split into two domains to ensure marketing and clinical application logic never overlap.

## 2. Architecture (LP vs APP Separation)
The application architecture enforces strict physical separation:
- **LP (Landing Page `z-26`)**: Handles marketing, presentation, and routing. It contains **no** application logic, `/app` routes, or `/api` endpoints. It safely forwards users to the APP domain.
- **APP (Application `zetu-shinAPP`)**: The core AI analysis platform. It handles image processing, Supabase database interactions, Edge Functions, and the Research Dashboard.
- **Auditing**: `scripts/audit/run.sh` acts as the constitution enforcer, verifying via HTTP status codes and Playwright DOM inspections that the LP never exposes APP logic, and that APP never exposes DEV-only features in production.

## 3. Data Flow
1. **Input**: User uploads a tongue image.
2. **Vision Processing**: Image processed to extract base features (RGB, blur, brightness). ROI (Region of Interest) extraction ensures only the tongue area is analyzed.
3. **Core Analysis**: `coreEngine.ts` processes vision features using the Phase 1 rule-based architecture.
4. **Observation/Labeling**: Experts provide ground-truth labels (tongue color, coat, moisture) via `ObservationInputPanel`, saving as `expert_observation` JSONB mapping.
5. **Research Metrics**: Saved observation records flow into the Research OS layer for evaluation and orchestrator planning.

## 4. Research Engine Modules
- **`statisticsEngine.ts`**: Computes total records, valid/invalid rates, ROI failure rates, and category distributions.
- **`dataCoverage.ts`**: Maps current data distribution against targeted research goals, outputting shortages and recommendations.
- **`validityRules.ts`**: Defines criteria for excluding records (e.g., failed ROI, insufficient data) from serious research calculation.

## 5. Feature Extraction (`featureExtractorV1.ts`)
A separate module extracting secondary proxy values (0-100 scale) directly from base optical features (e.g., `redness_index`, `dryness_proxy`, `yellow_coating_proxy`). Engineered as pure functions, completely null-safe, preventing `NaN` or division-by-zero errors.

## 6. Heat/Cold Estimator (`heatColdEstimatorV0.ts`)
Utilizes structured features and `constants/heatColdSpectrum.ts` (-100 Max Cold to +100 Max Heat) to classify data into categories like `JIKKAN`, `KYOKAN`, `NORMAL`, `JITSUNETSU`, `KYONETSU`. Implements `HOLD` logic for conflicting signals to actively prevent diagnostic assertions.

## 7. Quality Scoring (`qualityScore.ts`)
Generates an objective 0-100 quality score for every processed image based on predefined penalty weights (`constants/researchQualityWeights.ts`). Penalizes for ROI failures, high blur, and extreme brightness/noise anomalies.

## 8. Expert Evaluation (`expertEvaluation.ts`)
Bridges the gap between AI outputs and professional oversight by computing:
- `agreement_rate`: Match percentage between AI rules and expert labels.
- `unlabeled_rate`: Percentage of data needing manual review.
- `confusion_matrix`: Overview of misclassifications.
- `exclusion_reasons_top`: Primary causes for mismatches.

## 9. Research OS (`researchOS.ts` & `researchPlanner.ts`)
An orchestration layer managing the complete research lifecycle.
- **Stages**: `DATA_COLLECTION`, `DATA_BALANCING`, `LABEL_ALIGNMENT`, `MODEL_EXPLORATION`, `MODEL_REFINEMENT`.
- Outputs a single unified state (`ResearchState`) including `total_records`, current `stage`, `shortage_top5`, and dynamically generated `next_actions`.
- **Model Readiness**: `modelReadiness.ts` calculates a 0-100 track record indicating if the dataset is ripe for Machine Learning model training.

## 10. FeatureFlag Governance
To safely roll out research interfaces without risking public exposure:
- Governed entirely by `utils/featureFlags.ts`.
- **LocalStorage is explicitly forbidden** for flag enabling to comply with strict security requirements.
- Uses `import.meta.env.VITE_DEV_FEATURE_OVERRIDES` to safely parse dev-only flags.
- **Production Hard-Lock**: The `IS_PROD` condition forces all flags to their default safety values or predefined allowed lists, ignoring all client-side override attempts.

## 11. Security and Safety Rules
- **No Diagnostics**: Employs neutral “assist/research” vocabulary. AI categorizations are for research filtering, never definitive diagnosis.
- **Null Safety**: All calculation modules wrap logic in zero/null checks to ensure 100% crash-free execution regardless of database state.
- **DOM Audits**: Playwright E2E tests (`tests/e2e/auditDOM.spec.ts`) continuously verify that no developer dashboards or flags leak into the production DOM.

## 12. Architecture Constitution
To ensure stability, safety, and long-term viability, the following non-negotiable architecture rules apply to the entire system:
- **Protect Core Inference Engine**: The core AI logic (`coreEngine.ts`) is strictly locked and cannot be modified without formal protocol approval. All new metrics or extractions must occur as supplementary modules.
- **LP / APP Separation Rule**: Total physical separation between Landing Page (`z-26`) and Application (`zetu-shinAPP`). LP handles zero `/app` or `/api` traffic, and runs no active analysis code.
- **FeatureFlag Governance**: Any new, experimental, or research-level UI and function must be placed behind a Feature Flag (`utils/featureFlags.ts`), defaulted to `false`. Production environments enforce a hard-lock ignoring client-overrides.
- **Medical Safety Constraints**: The system must never assert explicit medical diagnoses. Output and UI textual content must strictly utilize neutral, observational, "research/assist" wording. Exception handling must be null-safe to guarantee an error-free analysis layer.

## 13. Protected Modules
The following core modules are critically significant to safe operation and LP/APP boundary compliance. They **must not be modified** without explicit protocol approval:
- `services/analyzers/coreEngine.ts` (Core AI logic)
- `scripts/audit/run.sh` (Constitutional compliance enforcer)
- `utils/featureFlags.ts` (Governance & Hardware locking)
- Types relating to observations (`types.ts`, `services/research/validityRules.ts`)

## 14. Research Data Coverage
To monitor dataset health and category representation efficiently, use the following template to track coverage targets vs actual metrics.

| Category Axis | Target Label | Requirement Count | Current Count | Shortage | Priority Actions |
|---------------|--------------|-------------------|---------------|----------|------------------|
| Tongue Color  | 紅 (Red)     | 20                | 0             | 20       | Focus on gathering more valid patient pictures aligning with "紅" characteristics. |
| Coat Color    | 黄 (Yellow)  | 15                | 0             | 15       | ...              |
| Moisture      | 乾燥 (Dry)   | 15                | 0             | 15       | ...              |
| Phase1 Pattern| KYOKAN       | 25                | 0             | 25       | ...              |

## 15. System Data Flow
The following flow describes the end-to-end processing from user interaction to management visualization:

1.  **User**: Interacts with the capture UI to provide a tongue image.
2.  **Image Capture**: Captures raw byte data. ROI v0 filters basic centering to isolate the tongue area.
3.  **Feature Extraction (`featureExtractorV1.ts`)**: Derives neutral optical proxies (redness, saturation, etc.) for standardized calculation.
4.  **Core Engine (`coreEngine.ts`)**: Executes the locked Phase 1 rule-based logic to estimate initial patterns.
5.  **Quality Engine (`qualityScore.ts`)**: Scores the capture quality (0-100) based on blur, noise, and ROI accuracy.
6.  **HeatCold Estimator (`heatColdEstimatorV0.ts`)**: Maps findings to the spectrum while asserting "HOLD" if signals are conflicting or low quality.
7.  **Expert Evaluation (`expertEvaluation.ts`)**: Compares AI outputs with ground-truth expert labels to assess accuracy.
8.  **Research OS (`researchOS.ts`)**: Orchestrates the research lifecycle state and determines model readiness thresholds.
9.  **Dashboard (`ResearchDashboard.tsx`)**: Displays the consolidated research status, shortages, and recommended planner actions.

## 16. Dataset Governance
Rules governing the handling of research datasets collected within the ZETUSHIN ecosystem:

-   **Image Anonymization Requirements**: All images used for research must be processed to remove identifying facial features beyond the tongue area.
-   **No Storage of Personal Identifiers**: Databases storing research metrics must use anonymous IDs. No names or direct PII shall be stored in analysis tables.
-   **Research-only Usage Policy**: Data collected via Research OS modules is strictly for algorithm validation and must not be used for diagnostic commercial services without further validation.
-   **User Data Deletion Procedure**: The system must support the complete erasure of user-specific analysis records and associated images upon request.
-   **Consent Requirements**: Inclusion in the research dataset requires an explicit `research_consent` flag to be set to true at the time of session creation.

## 17. Dataset Coverage Monitoring

### Purpose
The system must track dataset coverage for each research category to ensure balanced data collection and prevent dataset bias. This monitoring layer is used by the research dashboard to visualize dataset completeness and identify underrepresented categories.

### Coverage Table Template
| Category | Image Count | Target | Status |
|----------|-------------|--------|--------|
| Normal | 0 | 200 | insufficient |
| Qi Deficiency | 0 | 200 | insufficient |
| Blood Stasis | 0 | 200 | insufficient |
| Heat | 0 | 200 | insufficient |
| Cold | 0 | 200 | insufficient |
| Dampness | 0 | 200 | insufficient |
| Yin Deficiency | 0 | 200 | insufficient |
| Yang Deficiency | 0 | 200 | insufficient |

### Definitions
- **Category**: Research classification used for dataset balancing and model validation.
- **Image Count**: Current number of images collected for the category.
- **Target**: Desired minimum dataset size required for statistical validation.
- **Status**: Coverage state of the category. Possible values: `insufficient`, `in progress`, `complete`.

### Research Dashboard Integration
The research dashboard must display dataset coverage in a visual format that allows researchers to immediately identify underrepresented categories. The dashboard should highlight:
- Categories below target
- Total dataset size
- Progress toward balanced dataset coverage

### Governance
Dataset coverage monitoring must follow the Dataset Governance rules defined in this specification.
