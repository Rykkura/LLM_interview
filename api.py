
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from google import genai
import os
import subprocess
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
question_1 = "Bạn hiểu như thế nào về Backpropagation? Giải thích cơ chế hoạt động?"
answer_1 = """ Backpropagation (Lan truyền ngược) là một thuật toán tối ưu hóa trong học sâu, giúp điều chỉnh trọng số của mạng nơ-ron để giảm sai số bằng
               cách sử dụng gradient của hàm mất mát. Thuật toán này gồm hai bước chính: Forward Propagation (lan truyền xuôi) và Backward Propagation (lan truyền ngược).
               Trong lan truyền xuôi, dữ liệu đầu vào đi qua các lớp của mạng, áp dụng trọng số, bias và hàm kích hoạt để tạo ra đầu ra dự đoán, sau đó tính toán hàm mất mát
               dựa trên sự khác biệt giữa đầu ra và giá trị thực tế. Trong lan truyền ngược, gradient của hàm mất mát được tính toán bằng quy tắc chuỗi (chain rule) và lan truyền ngược
               qua từng lớp để cập nhật trọng số theo thuật toán tối ưu như Gradient Descent, giúp mô hình dần hội tụ và giảm sai số."""
question_2 = "Ý nghĩa của hàm activation function là gì? Thế nào là điểm bão hòa của các activation functions?"
answer_2 = """Hàm kích hoạt (Activation Function) đóng vai trò quan trọng trong mạng nơ-ron, giúp mô hình học được các mối quan hệ phi tuyến tính thay vì chỉ thực hiện các phép biến đổi tuyến tính.
              Một số hàm kích hoạt phổ biến bao gồm ReLU (giúp tránh vấn đề vanishing gradient), Sigmoid (thường dùng trong phân loại nhị phân), và Tanh (cho đầu ra trong khoảng [-1, 1] giúp mô hình
              hội tụ nhanh hơn). Điểm bão hòa của hàm kích hoạt xảy ra khi gradient của nó gần bằng 0, làm chậm hoặc ngừng quá trình cập nhật trọng số. Ví dụ, Sigmoid và Tanh có gradient gần 0 khi đầu
              vào quá lớn hoặc quá nhỏ, gây ra vấn đề vanishing gradient, trong khi ReLU có thể gặp tình trạng "dead neurons" khi đầu vào luôn nhỏ hơn 0."""
question_3 = "Với những tập dữ liệu bị imbalance thì có những cách xử lý nào"
answer_3 = """Với những tập dữ liệu bị mất cân bằng (imbalance dataset), có nhiều cách xử lý để cải thiện hiệu suất mô hình. Một phương pháp phổ biến là resampling dữ liệu,
              bao gồm oversampling (tăng số lượng mẫu của lớp thiểu số, ví dụ: SMOTE) hoặc undersampling (giảm số lượng mẫu của lớp chiếm ưu thế). Ngoài ra, có thể sử dụng class weights
              để gán trọng số cao hơn cho lớp thiểu số khi tính toán hàm mất mát, giúp mô hình chú ý hơn đến lớp ít xuất hiện. Một số thuật toán như Random Forest, XGBoost cũng có khả năng
              xử lý tốt dữ liệu mất cân bằng. Bên cạnh đó, việc sử dụng các metric phù hợp như Precision, Recall, F1-score, ROC-AUC thay vì chỉ dựa vào Accuracy sẽ giúp đánh giá mô hình chính xác hơn.
              Trong một số trường hợp, có thể tạo một mô hình riêng biệt để nhận diện lớp thiểu số nhằm cải thiện độ chính xác tổng thể."""
import json

def json_to_string(data, indent=0):
    result = ""
    prefix = " " * indent

    if isinstance(data, dict):
        for key, value in data.items():
            result += f"{prefix}{key}:\n"
            result += json_to_string(value, indent + 2)
    elif isinstance(data, list):
        for item in data:
            result += json_to_string(item, indent)
    else:
        result += f"{prefix}{data}\n"

    return result


import json
@app.post("/gemini")
async def gemini(file: UploadFile = File(...), question_ids: str = Form(...)):
    
    ids = json.loads(question_ids)
    print(len(ids))
    print(f"File nhận được: {file.filename}")
    print(f"ID nhận được: {ids}")
    answers = [answer_1, answer_2, answer_3]
    PROMPT = f""" 
    Hãy đóng vai là một nhà tuyển dụng đang cần tìm kiếm ứng viên trả về đánh giá dưới dạng JSON.
    Tôi có một số câu trả lời mẫu: {answers}. 
    Hãy tự xác định xem các câu hỏi nào đang được hỏi trong đoạn audio và thực hiện các yêu cầu dưới đây:
    Sử dụng JSON schema sau:
        result = {{
            "transcript": str,
            "evaluate": {{
                "So sánh": {{
                    "Tương đồng": {{
                        Câu ...: 'Chỉ ra điểm tương đồng giữa câu trả lời của ứng viên với câu trả lời mẫu mà nhà tuyển dụng mong đợi',
                        
                    }},
                    "Khác biệt": {{
                        Câu ...: 'Chỉ ra điểm tương đồng giữa câu trả lời của ứng viên với câu trả lời mẫu mà nhà tuyển dụng mong đợi',
                        
                    }},
                }}
                "Đánh giá chi tiết": {{
                    Câu ...:'Dựa trên sự tương đồng và khác biệt giữa câu trả lời của ứng viên với câu trả lời mẫu hãy đưa ra đánh giá chi tiết về điểm mạnh và điểm yếu, 
                    chỉ rõ trong câu trả lời của ứng viên có phần nào cần phải chỉnh sửa để giống với yêu cầu của nhà tuyển dụng hơn'
                }}
                "Đánh giá tổng quan": 'Đánh giá xem ứng viên đang ở trình độ nào và sẽ phù hợp với vị trí nào trong công ty. Chấm điểm trên thang 10 cho ứng viên '
            }}
        }}
        return result
    """
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    temp_path = f"temp_{filename}"

    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    if ext == "webm":
        mp3_path = f"temp_{file.filename.split('.')[0]}_test.mp3"
        ffmpeg_path = r"C:\\ffmpeg\\ffmpeg.exe"
        subprocess.run([
            ffmpeg_path, "-i", temp_path, "-vn", "-c:a", "libmp3lame",
            "-b:a", "192k", "-ar", "44100", "-y", mp3_path
        ])
        input_audio_path = mp3_path
    else:
        input_audio_path = f"{filename}"  

    try:
        client = genai.Client(api_key="")

        uploaded_file = client.files.upload(file=input_audio_path)
        print(f"{uploaded_file=}")

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[uploaded_file, PROMPT],
            config={'response_mime_type': 'application/json'}
        )
        json_loads = json.loads(response.text)
        result = json_loads.get("evaluate", "")
        transcript = json_loads.get("transcript", "")
        print(result)
        return {"result": json_to_string(result), "transcript": transcript}

    finally:
        # Xoá các file tạm
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if ext == "webm":
            os.remove(mp3_path)


@app.post("/whisper")
async def whisper(file: UploadFile = File(...), question_ids: str = Form(...)):
    whisper_api_key = ''
    client = OpenAI(
        api_key=whisper_api_key,
        )
    ids = json.loads(question_ids)
    print(len(ids))
    print(f"File nhận được: {file.filename}")
    print(f"ID nhận được: {ids}")
    answers = [answer_1, answer_2, answer_3]
    PROMPT = f""" 
    Hãy đóng vai là một nhà tuyển dụng đang cần tìm kiếm ứng viên trả về đánh giá dưới dạng JSON.
    Tôi có một số câu trả lời mẫu: {answers}. 
    Hãy tự xác định xem các câu hỏi nào đang được hỏi trong đoạn audio và thực hiện các yêu cầu dưới đây:
    Sử dụng JSON schema sau:
        result = {{
                "Tương đồng": {{
                    Câu ...: 'Chỉ ra điểm tương đồng giữa câu trả lời của ứng viên với câu trả lời mẫu mà nhà tuyển dụng mong đợi', 
                }},
                "Khác biệt": {{
                    Câu ...: 'Chỉ ra điểm tương đồng giữa câu trả lời của ứng viên với câu trả lời mẫu mà nhà tuyển dụng mong đợi',   
                }},
                "Đánh giá chi tiết": {{
                    Câu ...:'Dựa trên sự tương đồng và khác biệt giữa câu trả lời của ứng viên với câu trả lời mẫu hãy đưa ra đánh giá chi tiết về điểm mạnh và điểm yếu, 
                    chỉ rõ trong câu trả lời của ứng viên có phần nào cần phải chỉnh sửa để giống với yêu cầu của nhà tuyển dụng hơn'
                }}
                "Đánh giá tổng quan": 'Đánh giá xem ứng viên đang ở trình độ nào và sẽ phù hợp với vị trí nào trong công ty. Chấm điểm trên thang 10 cho ứng viên '
        }}
        return result
    """
    filename = file.filename
    ext = filename.split(".")[-1].lower()
    temp_path = f"temp_{filename}"

    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    if ext == "webm":
        mp3_path = f"temp_{file.filename.split('.')[0]}_test.mp3"
        ffmpeg_path = r"C:\\ffmpeg\\ffmpeg.exe"
        subprocess.run([
            ffmpeg_path, "-i", temp_path, "-vn", "-c:a", "libmp3lame",
            "-b:a", "192k", "-ar", "44100", "-y", mp3_path
        ])
        input_audio_path = mp3_path
    else:
        input_audio_path = f"{filename}" 

    try:
        audio_file= open(input_audio_path, "rb")
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        text = transcription.text
        completion = client.chat.completions.create(
            model="o3-mini",
            messages=[
                # {
                #     "role": "system",
                #     "content": f"You are a helpful assistant. {PROMPT_text} "
                # },
                {
                    "role": "user",
                    "content": f"You are a helpful assistant. {PROMPT}. Hãy phân tích buổi phỏng vấn sau: {text}"
                }
            ]
        )
        print (completion.choices[0].message.content)
        return {"result": json_to_string(completion.choices[0].message.content), "transcript": text}

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if ext == "webm":
            os.remove(mp3_path)

    
