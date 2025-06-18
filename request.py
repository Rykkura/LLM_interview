import requests

url = "http://localhost:8000/gemini"  # Địa chỉ API

# Mở file audio cần gửi
with open("test.mp3", "rb") as audio_file:
    files = {
        "file": ("test.mp3", audio_file, "audio/mpeg")  # hoặc "audio/mp3"
    }

    # Gửi POST request
    response = requests.post(url, files=files)

# In kết quả trả về từ API
print("Status Code:", response.status_code)
print("Response JSON:", response.text)