import os
import numpy as np
import joblib
import tensorflow as tf

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) 
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'model_lstm_panen_jember_tuned.h5')
model = tf.keras.models.load_model(MODEL_PATH)
scaler_X = joblib.load(os.path.join(BASE_DIR, 'models', 'scaler_X.pkl'))
scaler_Y = joblib.load(os.path.join(BASE_DIR, 'models', 'scaler_Y.pkl'))

def prepare_input(json_data):
    feature_order = [
        'luas tanam', 'luas panen bersih', 'curah_hujan_mm', 'suhu_rata2_c', 'kelembaban_persen',
        'luas_tanam_lag3', 'luas_tanam_lag4', 'curah_hujan_lag1', 'curah_hujan_lag2',
        'jumlah_pupuk', 'bulan_sin', 'bulan_cos', 'panen_lag_1', 'panen_lag_2', 
        'tanam_lag_1', 'tanam_lag_2'
    ]
    row = [json_data[f] for f in feature_order]
    return np.array(row).reshape(1, -1)

def get_prediction(list_3_months_data):
    processed_data = []
    for month_data in list_3_months_data:
        processed_data.append(prepare_input(month_data))
    input_seq = np.array(processed_data).reshape(1, 3, 16)
    input_scaled = scaler_X.transform(input_seq.reshape(1, -1)).reshape(1, 3, 16)
    prediction_scaled = model.predict(input_scaled)
    prediction = scaler_Y.inverse_transform(prediction_scaled)
    return prediction[0][0]