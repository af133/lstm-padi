import os
import joblib
import numpy as np
import tensorflow as tf

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'model_lstm_panen_jember_tuned.h5')
SCALER_X_PATH = os.path.join(BASE_DIR, 'models', 'scaler_X.pkl')
SCALER_Y_PATH = os.path.join(BASE_DIR, 'models', 'scaler_Y.pkl')
model = tf.keras.models.load_model(MODEL_PATH)
scaler_X = joblib.load(SCALER_X_PATH)
scaler_Y = joblib.load(SCALER_Y_PATH)
def encode_bulan(bulan):
    sin_bulan = np.sin(2 * np.pi * bulan / 12)
    cos_bulan = np.cos(2 * np.pi * bulan / 12)
    return sin_bulan, cos_bulan
def get_prediction(list_3_months_data):
    processed_months = []
    feature_order = [
        'luas tanam', 'luas panen bersih', 'curah_hujan_mm', 'suhu_rata2_c', 'kelembaban_persen',
        'luas_tanam_lag3', 'luas_tanam_lag4', 'curah_hujan_lag1', 'curah_hujan_lag2',
        'jumlah_pupuk', 'bulan_sin', 'bulan_cos', 'panen_lag_1', 'panen_lag_2', 
        'tanam_lag_1', 'tanam_lag_2'
    ]
    for item in list_3_months_data:
        features = item.get('features', {}) if isinstance(item.get('features'), dict) else item
        bulan_val = item.get('bulan') or features.get('bulan', 1)
        b_sin, b_cos = encode_bulan(int(bulan_val))
        mapped_data = {
            'luas tanam': features.get('luas_tanam', features.get('luas tanam', 0.0)),
            'luas panen bersih': features.get('luas_panen_bersih', features.get('luas panen bersih', 0.0)),
            'curah_hujan_mm': features.get('curah_hujan_mm', 0.0),
            'suhu_rata2_c': features.get('suhu_rata2_c', 0.0),
            'kelembaban_persen': features.get('kelembaban_persen', 0.0),
            'luas_tanam_lag3': features.get('luas_tanam_lag3', 0.0),
            'luas_tanam_lag4': features.get('luas_tanam_lag4', 0.0),
            'curah_hujan_lag1': features.get('curah_hujan_lag1', 0.0),
            'curah_hujan_lag2': features.get('curah_hujan_lag2', 0.0),
            'jumlah_pupuk': features.get('jumlah_pupuk', 0.0),
            'bulan_sin': b_sin,
            'bulan_cos': b_cos,
            'panen_lag_1': features.get('panen_lag_1', 0.0),
            'panen_lag_2': features.get('panen_lag_2', 0.0),
            'tanam_lag_1': features.get('tanam_lag_1', 0.0),
            'tanam_lag_2': features.get('tanam_lag_2', 0.0),
        }
        row = [np.float64(mapped_data[f]) for f in feature_order]
        processed_months.append(row)
    input_seq = np.array(processed_months)
    input_scaled = scaler_X.transform(input_seq)
    input_final = input_scaled.reshape(1, 3, 16)
    prediction_scaled = model.predict(input_final, verbose=0) 
    prediction = scaler_Y.inverse_transform(prediction_scaled)
    return max(0.0, float(prediction[0][0]))