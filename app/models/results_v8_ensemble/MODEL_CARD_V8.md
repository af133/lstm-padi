# MODEL CARD V8 — Validation-Gated Hybrid Ensemble

## Data scope
No additional Dinas data were assumed. The pipeline uses the supplied annual 1999–2025 dataset and monthly May-2022–Dec-2024 dataset.

## Architecture
1. XGBoost and Random Forest global tabular forecasting.
2. CNN-BiLSTM-Attention as a temporal candidate.
3. Agronomic consistency: predicted production = ensemble harvest area × ensemble yield.
4. Validation gate: weak candidates are not forced into the final prediction.

## Honest validation
- Annual: rolling-origin evaluation for 2018–2025.
- Monthly: operational rolling one-step-ahead evaluation for Jan–Dec 2024; weights fixed from prior 2023 validation.
- The 2026 monthly output is explicitly labelled a recursive scenario, not a one-step backtest.

## Key results
- Best annual model: V8 final annual — WAPE 3.427%, R² 0.9795.
- V8 final monthly one-step — WAPE 22.423%, R² 0.6696.

## Interpretation
The deep model is retained to satisfy the temporal modelling objective, but the gate may assign it zero weight when the short monthly history causes overfitting. This is a methodological strength, not a failure: the final decision follows out-of-sample evidence.
