import React, { useState, useEffect, useRef } from "react";
import {
    FiMic,
    FiPlayCircle,
    FiCheckCircle,
    FiArrowRight,
    FiDownload,
    FiRefreshCw,
    FiSend,
    FiAlertCircle,
    FiLoader,
    FiRadio,
    FiList,
    FiFileText,
    FiCpu,
} from "react-icons/fi";
import "./App.css";

const simulateApiCall = (data, delay = 1000) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(data);
        }, delay);
    });
};

// Hàm lấy câu hỏi (Mô phỏng)
const fetchAIQuestions = async (count = 3) => {
    console.log(`Local Sim: Generating ${count} questions...`);
    const questionsPool = [
        {
            id: 1,
            question:
                "Bạn hiểu như thế nào về Backpropagation và giải thích cơ chế hoạt động",
        },
        {
            id: 2,
            question:
                "Ý nghĩa của hàm activation function là gì? và thế nào là điểm bão hòa của các activation function?",
        },
        {
            id: 3,
            question:
                "Với những tập dữ liệu bị imbalance thì em có những cách xử lý nào?",
        },
    ];
    const shuffled = questionsPool.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, count);
    return simulateApiCall({ questions: selectedQuestions }, 800);
};

// Các hằng số cho API
const API_TYPE_GEMINI = "gemini";
const API_TYPE_WHISPER = "whisper";

// Hàm gọi API /gemini thực tế
const uploadAndProcessAudioGemini = async (audioBlob, questionIds) => {
    // questions hiện không dùng bởi API /gemini
    if (!audioBlob) {
        return Promise.reject(
            new Error("No audio blob provided for processing.")
        );
    }
    if (!questionIds || questionIds.length === 0) {
        console.warn("No question IDs provided for Gemini processing.");
        questionIds = [];
    }

    const formData = new FormData();
    // const filename = `phongvan-ghi-am.webm`;
    const filename = "interview.mp3";                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
    formData.append("file", audioBlob, filename);
    formData.append("question_ids", JSON.stringify(questionIds));
    console.log("Uploading audio to /gemini endpoint:", filename);
    const apiUrl = "http://localhost:8000/gemini";

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
            // headers: { 'Authorization': 'Bearer YOUR_TOKEN' } // Thêm nếu cần
        });

        if (!response.ok) {
            let errorBody = `Status: ${response.status}`;
            try {
                errorBody = await response.text();
            } catch (e) {}
            throw new Error(
                `API request failed: ${response.status} - ${errorBody}`
            );
        }

        const result = await response.json();
        if (!result || typeof result.result === "undefined") {
            throw new Error("API response missing 'result' field.");
        }

        console.log("API /gemini call successful:", result);
        return result;
    } catch (error) {
        console.error("Error calling /gemini API:", error);
        throw error;
    }
};

// Hàm gọi API /whisper thực tế
const uploadAndProcessAudioWhisper = async (audioBlob, questionIds) => {
    if (!audioBlob) {
        return Promise.reject(
            new Error("No audio blob provided for processing.")
        );
    }
    if (!questionIds || questionIds.length === 0) {
        console.warn("No question IDs provided for Gemini processing.");
        questionIds = [];
    }

    const formData = new FormData();
    // const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // const filename = `phongvan-${timestamp}.webm`;
    // const filename = `phongvan-ghi-am.webm`;
    const filename = "interview.mp3";
    formData.append("file", audioBlob, filename);
    formData.append("question_ids", JSON.stringify(questionIds));

    console.log("Uploading audio to /whisper endpoint:", filename);
    const apiUrl = "http://localhost:8000/whisper"; // Thay thế bằng URL API Whisper của bạn

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            let errorBody = `Status: ${response.status}`;
            try {
                errorBody = await response.text();
            } catch (e) {
                /* ignore */
            }
            throw new Error(
                `Whisper API request failed: ${response.status} - ${errorBody}`
            );
        }

        const result = await response.json();
        if (!result || typeof result.result === "undefined") {
            throw new Error("API response missing 'result' field.");
        }

        console.log("API /whisper call successful:", result);
        return result;
    } catch (error) {
        console.error("Error calling /whisper API:", error);
        throw error;
    }
};

// Hàm chọn API dựa trên config
const uploadAndProcessAudio = async (apiType, audioBlob, questions) => {
    const questionIds = questions.map((q) => q.id);
    switch (apiType) {
        case API_TYPE_GEMINI:
            return uploadAndProcessAudioGemini(audioBlob, questionIds);
        case API_TYPE_WHISPER:
            return uploadAndProcessAudioWhisper(audioBlob, questionIds);
        default:
            return Promise.reject(
                new Error(`Unsupported API type: ${apiType}`)
            );
    }
};

// ========================================================================
// --- Components Con (Định nghĩa bên trong App.js hoặc giữ nguyên ở ngoài nếu muốn) ---
// ========================================================================

const PrepareInterview = ({ isLoading, onPrepare, mediaRecorderSupported }) => (
    <div className="section centered-content">
        <h2>Bắt đầu Luyện tập</h2>

        <p>Nhấn nút bên dưới để AI tạo câu hỏi.</p>
        <button onClick={onPrepare} disabled={isLoading}>
            {isLoading ? (
                <>
                    <FiLoader className="spinner" /> Đang chuẩn bị...
                </>
            ) : (
                <>
                    <FiPlayCircle /> Bắt đầu
                </>
            )}
        </button>
        {!mediaRecorderSupported && (
            <p
                style={{
                    color: "var(--warning-color)",
                    marginTop: "15px",
                    fontWeight: 500,
                }}
            >
                {" "}
                <FiAlertCircle /> Trình duyệt không hỗ trợ ghi âm.
            </p>
        )}
    </div>
);

const ReadyToRecord = ({
    questionCount,
    onStartRecording,
    onApiTypeChange,
    selectedApiType,
}) => (
    <div className="section centered-content">
        {/* Thêm lựa chọn API */}
        <div>
            <label htmlFor="api-select">Chọn API:</label>
            <select
                id="api-select"
                value={selectedApiType}
                onChange={(e) => onApiTypeChange(e.target.value)}
            >
                <option value={API_TYPE_GEMINI}>Gemini</option>
                <option value={API_TYPE_WHISPER}>Whisper</option>
            </select>
        </div>
        {/* <h2>
            <FiCheckCircle style={{ color: "var(--success-color)" }} /> Sẵn
            sàng!
        </h2> */}
        <p>
            Chúng tôi đã chuẩn bị {questionCount} câu hỏi. Nhấn nút ghi âm để
            bắt đầu.
        </p>
        <button onClick={onStartRecording} className="recording">
            <FiMic /> Bắt đầu Ghi âm & Trả lời
        </button>
    </div>
);

const RecordingInterview = ({
    currentQuestion,
    currentIndex,
    totalQuestions,
    onNext,
    isLast,
}) => (
    <>
        <div className="section">
            <h2>
                {" "}
                <FiRadio /> Câu hỏi {currentIndex + 1} / {totalQuestions}
            </h2>
            <div className={`status-indicator recording`}>
                <span className="dot"></span> Đang ghi âm...
            </div>
            <div className="display-box question-box">
                <p>{currentQuestion.question}</p>
            </div>
        </div>
        <div className="section">
            <h2>Trạng thái</h2>
            <div
                className="display-box answer-box transcript-box"
                style={{
                    minHeight: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <p
                    style={{
                        fontStyle: "italic",
                        color: "var(--text-muted-color)",
                    }}
                >
                    Đang ghi âm câu trả lời...
                </p>
            </div>
        </div>
        <div className="section navigation-section">
            <button
                onClick={onNext}
                className={isLast ? "success" : "secondary"}
            >
                {isLast ? (
                    <>
                        <FiCheckCircle /> Hoàn thành & Xử lý
                    </>
                ) : (
                    <>
                        <FiArrowRight /> Câu hỏi tiếp theo
                    </>
                )}
            </button>
        </div>
    </>
);

const InterviewResults = ({
    isProcessing,
    processingStatus,
    renderStatus,
    feedback,
    transcript, // Sẽ nhận placeholder
    audioUrl,
    audioBlob,
    onDownload,
    questions,
    onRestart,
}) => (
    <div className="section completion-section">
        <h2>
            {" "}
            <FiCheckCircle /> Phỏng vấn Hoàn tất!
        </h2>
        <div
            style={{
                textAlign: "center",
                margin: "25px 0",
                minHeight: "30px",
                fontSize: "1.1em",
            }}
        >
            {renderStatus()}
        </div>

        {!isProcessing &&
            (processingStatus === "success" ||
                processingStatus === "error") && (
                <>
                    {feedback && (
                        <div className="summary-item">
                            <h4>
                                <FiSend /> Đánh giá:
                            </h4>
                            <div className="display-box feedback-box">
                                <p>{feedback}</p>
                            </div>
                        </div>
                    )}
                    <div className="summary-item">
                        <h4>
                            <FiFileText /> Bản ghi chi tiết:
                        </h4>
                        <div className="display-box feedback-box finished">
                            <p>{transcript || "(Không có bản ghi)"}</p>
                        </div>
                    </div>
                    {audioUrl && (
                        <div className="summary-item">
                            <h4>
                                <FiMic /> File ghi âm:
                            </h4>
                            <audio controls src={audioUrl}></audio>
                            <button
                                onClick={onDownload}
                                disabled={!audioBlob}
                                style={{ marginTop: "15px" }}
                            >
                                <FiDownload /> Tải xuống (.webm)
                            </button>
                        </div>
                    )}
                    <div className="summary-item">
                        <h4>
                            <FiList /> Các câu hỏi đã hỏi:
                        </h4>
                        <ol>
                            {questions.map((q, index) => (
                                <li key={index}>{q.question}</li>
                            ))}
                        </ol>
                    </div>
                    <button onClick={onRestart} disabled={isProcessing}>
                        <FiRefreshCw /> Bắt đầu Phỏng vấn Mới
                    </button>
                </>
            )}
    </div>
);

// ========================================================================
// --- Component Chính: App ---
// ========================================================================
const MediaRecorder = window.MediaRecorder;

function App() {
    // --- State (Giữ nguyên) ---
    const [allQuestions, setAllQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [fullTranscript, setFullTranscript] = useState("");
    const [overallFeedback, setOverallFeedback] = useState("");
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isInterviewPrepared, setIsInterviewPrepared] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isInterviewFinished, setIsInterviewFinished] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [error, setError] = useState("");

    // --- API Config State ---
    const [apiType, setApiType] = useState(API_TYPE_GEMINI); // Mặc định dùng Gemini

    // --- Refs (Giữ nguyên) ---
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    // --- Hàm tiện ích nội bộ ---
    const stopMediaStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            console.log("Media stream stopped.");
        }
    };

    // --- Logic Chính ---
    const resetState = () => {
        console.log("Resetting application state...");
        setAllQuestions([]);
        setCurrentQuestionIndex(0);
        setIsInterviewPrepared(false);
        setIsRecording(false);
        setIsInterviewFinished(false);
        setIsLoadingQuestions(false);
        setError("");
        setFullTranscript("");
        setOverallFeedback("");
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            console.log("Revoked previous audio URL");
        }
        setAudioUrl(null);
        setIsProcessing(false);
        setProcessingStatus("");
        audioChunksRef.current = [];
        stopMediaStream();
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current = null;
        }
    };

    const handlePrepareInterview = async () => {
        setIsLoadingQuestions(true);
        resetState();
        try {
            // Gọi hàm fetchAIQuestions đã định nghĩa ở trên
            const data = await fetchAIQuestions(3);
            if (data.questions?.length > 0) {
                setAllQuestions(data.questions);
                setIsInterviewPrepared(true);
            } else {
                setError("Không thể tạo câu hỏi.");
            }
        } catch (err) {
            setError("Không thể tải câu hỏi.");
            console.error("Lỗi khi lấy câu hỏi:", err);
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    // Hàm xử lý Audio sau khi dừng
    const processRecordedAudio = async (blob) => {
        console.log(`Processing recorded audio via ${apiType} API...`);
        setIsInterviewFinished(true);
        setIsProcessing(true);
        setProcessingStatus("processing");
        setError("");

        try {
            const result = await uploadAndProcessAudio(
                apiType,
                blob,
                allQuestions
            );

            if (apiType === API_TYPE_GEMINI) {
                if (result?.result) {
                    console.log(result);
                    setOverallFeedback(result.result);
                    setFullTranscript(result.transcript);
                    setProcessingStatus("success");
                } else {
                    throw new Error(
                        "Gemini API response missing 'result' field."
                    );
                }
            } else if (apiType === API_TYPE_WHISPER) {
                if (result?.result) {
                    console.log(result);
                    setOverallFeedback(result.result);
                    setFullTranscript(result.transcript);
                    setProcessingStatus("success");
                } else {
                    throw new Error(
                        "Gemini API response missing 'result' field."
                    );
                }
            } else {
                throw new Error(`Unsupported API type: ${apiType}`);
            }
        } catch (error) {
            setError(`Xử lý thất bại: ${error.message}`);
            setProcessingStatus("error");
            setFullTranscript("Lỗi khi xử lý âm thanh.");
            setOverallFeedback("Lỗi khi tạo phản hồi.");
            console.error("Error processing audio:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const startRecording = async () => {
        if (!MediaRecorder) {
            setError("Trình duyệt không hỗ trợ ghi âm.");
            return;
        }
        setError("");
        setProcessingStatus("");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: "audio/webm",
            });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0)
                    audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });
                console.log("Recording stopped, blob size:", blob.size);
                stopMediaStream(); // Dừng stream ở đây
                if (blob.size > 0) {
                    setAudioBlob(blob);
                    const url = URL.createObjectURL(blob);
                    setAudioUrl(url);
                    processRecordedAudio(blob); // Gọi xử lý
                } else {
                    console.warn("Empty blob recorded.");
                    setError("Ghi âm không thành công (không có dữ liệu).");
                    setIsProcessing(false);
                    setIsInterviewFinished(true);
                }
            };

            mediaRecorderRef.current.onerror = (event) => {
                setError(`Lỗi ghi âm: ${event.error?.name || "Unknown error"}`);
                console.error("MediaRecorder error:", event.error);
                stopRecording(false);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setIsInterviewFinished(false);
        } catch (err) {
            setError(`Không thể bắt đầu ghi: ${err.message}.`);
            console.error("Error starting recording:", err);
            stopMediaStream();
        }
    };

    const stopRecording = (processAudio = true) => {
        console.log("Requesting stop recording...");
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        } else {
            stopMediaStream();
            if (!processAudio) {
                setIsInterviewFinished(true);
                setIsProcessing(false);
                setProcessingStatus("");
            }
        }
        setIsRecording(false);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < allQuestions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            stopRecording(true);
        }
    };

    const handleDownloadAudio = () => {
        if (audioUrl && audioBlob) {
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = audioUrl;
            a.download = `phongvan-ghi-am.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            setError("Không có file âm thanh.");
        }
    };

    const handleApiTypeChange = (newApiType) => {
        setApiType(newApiType);
    };

    // --- Cleanup Effect ---
    useEffect(() => {
        return () => {
            console.log("App unmounting...");
            stopMediaStream();
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl]);

    // --- Render Logic ---
    const currentQuestion = allQuestions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === allQuestions.length - 1;
    const mediaRecorderSupported = !!MediaRecorder;

    const renderProcessingStatus = () => {
        if (!isProcessing && !["success", "error"].includes(processingStatus))
            return null;
        let icon = <FiLoader className="spinner" />,
            text = "",
            color = "var(--text-muted-color)";
        switch (processingStatus) {
            case "processing":
                icon = <FiCpu className="spinner" />;
                text = "Đang xử lý...";
                break;
            case "success":
                icon = <FiCheckCircle />;
                text = "Hoàn tất!";
                color = "var(--success-color)";
                break;
            case "error":
                icon = <FiAlertCircle />;
                text = "Thất bại.";
                color = "var(--recording-color)";
                break;
            default:
                return null;
        }
        return (
            <span
                style={{
                    color,
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                {icon} {text}
            </span>
        );
    };

    const renderCurrentStage = () => {
        if (isInterviewFinished) {
            return (
                <InterviewResults
                    isProcessing={isProcessing}
                    processingStatus={processingStatus}
                    renderStatus={renderProcessingStatus}
                    feedback={overallFeedback}
                    transcript={fullTranscript}
                    audioUrl={audioUrl}
                    audioBlob={audioBlob}
                    onDownload={handleDownloadAudio}
                    questions={allQuestions}
                    onRestart={handlePrepareInterview}
                />
            );
        }
        if (isRecording) {
            return (
                <RecordingInterview
                    currentQuestion={currentQuestion}
                    currentIndex={currentQuestionIndex}
                    totalQuestions={allQuestions.length}
                    onNext={handleNextQuestion}
                    isLast={isLastQuestion}
                />
            );
        }
        if (isInterviewPrepared) {
            return (
                <ReadyToRecord
                    questionCount={allQuestions.length}
                    onStartRecording={startRecording}
                    onApiTypeChange={handleApiTypeChange}
                    selectedApiType={apiType}
                />
            );
        }
        return (
            <PrepareInterview
                isLoading={isLoadingQuestions}
                onPrepare={handlePrepareInterview}
                mediaRecorderSupported={mediaRecorderSupported}
                onApiTypeChange={handleApiTypeChange}
                selectedApiType={apiType}
            />
        );
    };

    return (
        <div className="App">
            <h1>Luyện tập Phỏng vấn AI</h1>

            {error && (
                <p className="error-message">
                    <FiAlertCircle /> {error}
                </p>
            )}
            {renderCurrentStage()}
        </div>
    );
}

export default App;
