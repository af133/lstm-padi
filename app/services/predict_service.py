from pathlib import Path
import joblib
import numpy as np
import torch
import torch.nn as nn

MODEL_DIR = Path('app/models/results_v8_ensemble')
FEATURE_KEYS = [
    'produksi_ton_gkg',
    'panen_bersih_admin_ha',
    'tanam_total_ha',
    'curah_hujan_mm',
    'temp_avg_c',
    'humidity_pct_clean',
    'wind_speed_kmh',
    'urea_kg',
    'npk_kg',
    'bulan_sin',
    'bulan_cos',
]

WINDOW_SIZE = 12 

class MonthlyConvBiLSTMAttention(nn.Module):
    def __init__(self, n_features: int = 11, n_districts: int = 31):
        super().__init__()
        self.conv = nn.Conv1d(n_features, 24, kernel_size=3, padding=1)
        self.relu = nn.ReLU()
        self.lstm = nn.LSTM(24, 20, batch_first=True, bidirectional=True)
        self.attention = nn.Linear(40, 1)
        self.embedding = nn.Embedding(n_districts, 6)
        self.head = nn.Sequential(
            nn.Linear(46, 32), nn.ReLU(), nn.Dropout(0.15), nn.Linear(32, 1)
        )

    def forward(self, x, district_id):
        z = self.relu(self.conv(x.transpose(1, 2))).transpose(1, 2)
        h, _ = self.lstm(z)
        a = torch.softmax(self.attention(h).squeeze(-1), dim=1)
        context = (h * a.unsqueeze(-1)).sum(dim=1)
        return self.head(
            torch.cat([context, self.embedding(district_id)], dim=1)
        ).squeeze(-1)


x_scaler = joblib.load(MODEL_DIR / 'monthly_deep_x_scaler_v8.pkl')
y_scaler = joblib.load(MODEL_DIR / 'monthly_deep_y_scaler_v8.pkl')

model_monthly = MonthlyConvBiLSTMAttention(n_features=11, n_districts=31)
model_monthly.load_state_dict(
    torch.load(
        MODEL_DIR / 'monthly_cnn_bilstm_attention_v8.pt', map_location='cpu'
    )
)
model_monthly.eval()
DISTRICT_ID_MAP: dict[str, int] = {
    "35.09.01": 0,
    "35.09.02": 1,
    "35.09.03": 2,
    "35.09.04": 3,
    "35.09.05": 4,
    "35.09.06": 5,
    "35.09.07": 6,
    "35.09.08": 7,
    "35.09.09": 8,
    "35.09.10": 9,
    "35.09.11": 10,
    "35.09.12": 11,
    "35.09.13": 12,
    "35.09.14": 13,
    "35.09.15": 14,
    "35.09.16": 15,
    "35.09.17": 16,
    "35.09.18": 17,
    "35.09.19": 18,
    "35.09.20": 19,
    "35.09.21": 20,
    "35.09.22": 21,
    "35.09.23": 22,
    "35.09.24": 23,
    "35.09.25": 24,
    "35.09.26": 25,
    "35.09.27": 26,
    "35.09.28": 27,
    "35.09.29": 28,
    "35.09.30": 29,
    "35.09.31": 30,
}

def get_district_id(kec_id: str) -> int:
    if kec_id not in DISTRICT_ID_MAP:
        raise ValueError(f"kecamatan_id '{kec_id}' tidak ada di DISTRICT_ID_MAP")
    return DISTRICT_ID_MAP[kec_id]
def extract_features(items: list[dict]) -> np.ndarray:
    rows = [[float(item.get(k, 0.0)) for k in FEATURE_KEYS] for item in items]
    return np.array(rows, dtype=np.float32)
def predict_next_month(data_window: np.ndarray, district_id: int) -> float:
    data_scaled = x_scaler.transform(data_window)
    tensor_x = torch.tensor(data_scaled, dtype=torch.float32).unsqueeze(0)
    tensor_district = torch.tensor([district_id], dtype=torch.long)
    with torch.no_grad():
        pred_scaled = model_monthly(tensor_x, tensor_district).numpy()
    pred_ton = y_scaler.inverse_transform(pred_scaled.reshape(-1, 1))[0][0]
    return max(0.0, float(pred_ton))

def predict_batch(batch_inputs: list[np.ndarray], district_ids: list[int]) -> list[float]:
    if not batch_inputs:
        return []
    scaled = np.stack([x_scaler.transform(x) for x in batch_inputs])
    tensor_x = torch.tensor(scaled, dtype=torch.float32)
    tensor_district = torch.tensor(district_ids, dtype=torch.long)
    with torch.no_grad():
        pred_scaled = model_monthly(tensor_x, tensor_district).numpy()
    pred_log = y_scaler.inverse_transform(pred_scaled.reshape(-1, 1)).flatten()
    pred_ton = np.expm1(pred_log) 
    return [max(0.0, float(p)) for p in pred_ton]