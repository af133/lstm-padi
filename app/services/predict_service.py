import os
import numpy as np
import joblib
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
    for month_data in list_3_months_data:
        if 'bulan' in month_data and 'bulan_sin' not in month_data:
            b_sin, b_cos = encode_bulan(int(month_data['bulan']))
            month_data['bulan_sin'] = b_sin
            month_data['bulan_cos'] = b_cos
        feature_order = [
            'luas tanam', 'luas panen bersih', 'curah_hujan_mm', 'suhu_rata2_c', 'kelembaban_persen',
            'luas_tanam_lag3', 'luas_tanam_lag4', 'curah_hujan_lag1', 'curah_hujan_lag2',
            'jumlah_pupuk', 'bulan_sin', 'bulan_cos', 'panen_lag_1', 'panen_lag_2', 
            'tanam_lag_1', 'tanam_lag_2'
        ]
        row = [np.float64(month_data[f]) for f in feature_order]
        processed_months.append(row)
    input_seq = np.array(processed_months)
    input_scaled = scaler_X.transform(input_seq)
    input_final = input_scaled.reshape(1, 3, 16)
    prediction_scaled = model.predict(input_final, verbose=0) 
    prediction = scaler_Y.inverse_transform(prediction_scaled)
    return max(0.0, float(prediction[0][0]))