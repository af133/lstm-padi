from pathlib import Path
import joblib
import numpy as np
import torch
import torch.nn as nn

MODEL_DIR = Path('app/models/results_v8_ensemble')

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

# Load scaler dan model
x_scaler = joblib.load(MODEL_DIR / 'monthly_deep_x_scaler_v8.pkl')
y_scaler = joblib.load(MODEL_DIR / 'monthly_deep_y_scaler_v8.pkl')

model_monthly = MonthlyConvBiLSTMAttention(n_features=11, n_districts=31)
model_monthly.load_state_dict(
    torch.load(
        MODEL_DIR / 'monthly_cnn_bilstm_attention_v8.pt', map_location='cpu'
    )
)
model_monthly.eval()

# --- FUNGSI UNTUK CEK FITUR ---
def cek_fitur_input():
  print("=== INFORMASI INPUT MODEL ===")
  print(f"Jumlah Fitur (n_features): 11")
  print(f"Jumlah Waktu / Time-step (data_12_bulan): 12 bulan")
  print(f"Jumlah District ID (n_districts): 0 s.d. 30 (total 31)")
  
  if hasattr(x_scaler, 'feature_names_in_') and x_scaler.feature_names_in_ is not None:
    print("\nNama-nama fitur yang terdeteksi di dalam x_scaler:")
    for i, col in enumerate(x_scaler.feature_names_in_, 1):
      print(f"  {i}. {col}")
  else:
    print("\nCatatan: x_scaler tidak menyimpan nama kolom secara spesifik (ndarray murni).")
    print("Pastikan urutan 11 kolom data yang Anda masukkan ke `data_12_bulan` sama persis dengan saat model di-training.")

# Jalankan pengecekan fitur
cek_fitur_input()


def predict_next_month(
    data_12_bulan: np.ndarray, district_id: int
) -> float:
  # Pastikan bentuk data (12, 11) -> 12 baris (bulan) dan 11 kolom (fitur)
  data_scaled = x_scaler.transform(data_12_bulan)
  tensor_x = torch.tensor(data_scaled, dtype=torch.float32).unsqueeze(0)
  tensor_district = torch.tensor([district_id], dtype=torch.long)
  with torch.no_grad():
    pred_scaled = model_monthly(tensor_x, tensor_district).numpy()
  pred_ton = y_scaler.inverse_transform(pred_scaled.reshape(-1, 1))[0][0]

  return max(0.0, float(pred_ton))