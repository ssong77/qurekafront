// Enhanced Step Wizard v2 - 3D 회전 큐브 로딩 애니메이션
import React, { useState } from "react";
import {
  Container,
  Button,
  Paper,
  TextField,
  Snackbar,
  Alert,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Avatar,
  Fade,
  Slide,
  keyframes,
} from "@mui/material";
import {
  CloudUpload,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Psychology,
  EmojiObjects,
} from "@mui/icons-material";
import Header from "../components/Header";
import PageNavigator from "../components/common/PageNavigator";
import SummarySettings from "../components/upload/SummarySettings";
import ProblemSettings from "../components/upload/ProblemSettings";
import QuestionRenderer from "../components/upload/QuestionRenderer";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  aiSummaryAPI,
  aiQuestionAPI,
  summaryAPI,
  questionAPI,
} from "../services/api";
import { downloadAsPDF } from "../utils/pdfUtils";
import {
  AiSummaryPromptKey,
  DbSummaryPromptKey_Korean,
  Question,
} from "../types/upload";
import {
  aiSummaryPromptKeys,
  dbSummaryPromptKeys_Korean,
  aiQuestionPromptKeys_Korean,
} from "../constants/upload";
import SaveNameDialog from "../components/upload/SaveNameDialog";

const steps = ["파일 업로드", "요약 설정", "요약 생성", "문제 설정", "문제 생성"];

// 3D 큐브 회전 애니메이션
const rotateCube = keyframes`
  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
`;

const wave = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); }
  50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.8), 0 0 60px rgba(99, 102, 241, 0.6); }
`;

// 3D 큐브 로딩 컴포넌트
const CubeLoading = ({ message, type }: { message: string; type: 'summary' | 'question' }) => {
  const bgColor = type === 'summary' ? '#6366f1' : '#ec4899';
  const bgGradient = type === 'summary' 
    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    : 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)';

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minHeight: 450,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: bgGradient,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* 배경 그리드 */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: 
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          opacity: 0.3,
        }}
      />

      {/* 3D 큐브 */}
      <Box
        sx={{
          width: 100,
          height: 100,
          position: "relative",
          transformStyle: "preserve-3d",
          animation: `${rotateCube} 3s linear infinite`,
          mb: 4,
        }}
      >
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: 100,
              height: 100,
              border: "2px solid rgba(255, 255, 255, 0.8)",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(5px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: 
                i === 0 ? "rotateY(0deg) translateZ(50px)" :
                i === 1 ? "rotateY(90deg) translateZ(50px)" :
                i === 2 ? "rotateY(180deg) translateZ(50px)" :
                i === 3 ? "rotateY(-90deg) translateZ(50px)" :
                i === 4 ? "rotateX(90deg) translateZ(50px)" :
                "rotateX(-90deg) translateZ(50px)",
            }}
          >
            {type === 'summary' ? (
              <Psychology sx={{ fontSize: 40, color: "white", opacity: 0.8 }} />
            ) : (
              <EmojiObjects sx={{ fontSize: 40, color: "white", opacity: 0.8 }} />
            )}
          </Box>
        ))}
      </Box>

      <Typography
        variant="h3"
        sx={{
          color: "white",
          fontWeight: 800,
          mb: 2,
          textAlign: "center",
          textShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        {message}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          color: "rgba(255, 255, 255, 0.95)",
          textAlign: "center",
          maxWidth: 500,
          mb: 4,
        }}
      >
        잠시만 기다려주세요. AI가 최선을 다하고 있습니다! 🚀
      </Typography>

      {/* 로딩 도트 */}
      <Stack direction="row" spacing={2}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              bgcolor: "white",
              animation: `${wave} 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
};

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // 요약 상태
  const [sumTab, setSumTab] = useState(0);
  const [aiSummaryType, setAiSummaryType] = useState<AiSummaryPromptKey>(
    aiSummaryPromptKeys[0]
  );
  const [dbSummaryTypeKorean, setDbSummaryTypeKorean] =
    useState<DbSummaryPromptKey_Korean>(dbSummaryPromptKeys_Korean[0]);
  const [sumField, setSumField] = useState("언어");
  const [sumLevel, setSumLevel] = useState("비전공자");
  const [sumSentCount, setSumSentCount] = useState(3);
  const [summaryText, setSummaryText] = useState("");
  const [loadingSum, setLoadingSum] = useState(false);
  const [sumTopicCount, setSumTopicCount] = useState(1);
  const [sumKeywordCount, setSumKeywordCount] = useState(3);
  const [keywords, setKeywords] = useState<string[]>([]);

  // 문제 상태
  const [qTab, setQTab] = useState(0);
  const [qField, setQField] = useState("언어");
  const [qLevel, setQLevel] = useState("비전공자");
  const [qCount, setQCount] = useState(3);
  const [optCount, setOptCount] = useState(4);
  const [blankCount, setBlankCount] = useState(1);
  const [questionText, setQuestionText] = useState("");
  const [loadingQ, setLoadingQ] = useState(false);
  const [optionFormat, setOptionFormat] = useState("단답형");
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [isJsonFormat, setIsJsonFormat] = useState(false);

  // 기타 상태
  const [openSumDoneSnackbar, setOpenSumDoneSnackbar] = useState(false);
  const [openQDoneSnackbar, setOpenQDoneSnackbar] = useState(false);
  const [openSaveNameDialog, setOpenSaveNameDialog] = useState(false);
  const [saveDialogType, setSaveDialogType] = useState<'summary' | 'question'>('summary');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFileName(f?.name ?? null);
    if (f) setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === 1 && !summaryText) {
      setActiveStep(2);
      handleGenerateSummary();
    } else if (activeStep === 3 && !questionText) {
      setActiveStep(4);
      handleGenerateQuestion();
    } else {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleGenerateSummary = async () => {
    if (!file || !user) return alert("파일 선택 및 로그인 필요");
    setLoadingSum(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("summary_type", aiSummaryType);
      fd.append("field", sumField);
      fd.append("level", sumLevel);
      fd.append("sentence_count", String(sumSentCount));
      if (sumTab === 2) fd.append("topic_count", String(sumTopicCount));
      if (sumTab === 4) {
        fd.append("keyword_count", String(sumKeywordCount));
        if (sumKeywordCount > 0) {
          const validKeywords = keywords.filter((k) => k && k.trim().length > 0);
          if (validKeywords.length > 0) {
            fd.append("user_keywords", validKeywords.join(","));
          }
        }
      }

      const res = await aiSummaryAPI.generateSummary(fd);
      setSummaryText(res.data.summary);
      setActiveStep(2);
    } catch (e: any) {
      alert(e.response?.data?.detail || "요약 생성 오류");
    } finally {
      setLoadingSum(false);
    }
  };

  const parseQuestionJson = (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText);
      if (data.questions && Array.isArray(data.questions)) {
        if (data.questions.length === 0) {
          alert("문제가 생성되지 않았습니다.\n다시 한 번 시도해주세요.");
          setIsJsonFormat(false);
          setParsedQuestions([]);
          return false;
        }
        setParsedQuestions(data.questions);
        setIsJsonFormat(true);
        return true;
      }
      return false;
    } catch (error) {
      setIsJsonFormat(false);
      return false;
    }
  };

  const handleGenerateQuestion = async () => {
    if (!summaryText || !user) return alert("요약 후 문제 생성을 눌러주세요");
    setLoadingQ(true);
    try {
      const payload: any = {
        generation_type: `문제 생성_${aiQuestionPromptKeys_Korean[qTab]}`,
        summary_text: summaryText,
        field: qField,
        level: qLevel,
        question_count: qCount,
      };
      if (qTab === 0) {
        payload.choice_count = optCount;
        payload.choice_format = optionFormat;
      }
      if (qTab === 1) payload.array_choice_count = optCount;
      if (qTab === 2) payload.blank_count = blankCount;

      const res = await aiQuestionAPI.generateQuestions(payload);
      setQuestionText(res.data.result);
      parseQuestionJson(res.data.result);
      setActiveStep(4);
    } catch (e: any) {
      alert(e.response?.data?.detail || "문제 생성 오류");
    } finally {
      setLoadingQ(false);
    }
  };

  const handleSave = (type: 'summary' | 'question') => {
    setSaveDialogType(type);
    setOpenSaveNameDialog(true);
  };

  const handleConfirmSave = async (customName: string) => {
    if (!user || !fileName) return;
    try {
      if (saveDialogType === 'summary') {
        await summaryAPI.saveSummary({
          userId: user.id,
          fileName: fileName,
          summaryName: customName,
          summaryType: dbSummaryTypeKorean,
          summaryText,
        });
        setOpenSumDoneSnackbar(true);
      } else {
        await questionAPI.saveQuestion({
          userId: user.id,
          fileName: fileName,
          questionName: customName,
          questionType: aiQuestionPromptKeys_Korean[qTab],
          questionText,
        });
        setOpenQDoneSnackbar(true);
      }
      setOpenSaveNameDialog(false);
    } catch (e) {
      alert("저장 중 오류");
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Fade in timeout={500}>
            <Box
              component="label"
              sx={{
                display: "block",
                border: "4px solid",
                borderColor: file ? "#10b981" : "#6366f1",
                borderRadius: 5,
                p: 10,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                background: file
                  ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                  : "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                animation: file ? `${glow} 2s ease-in-out infinite` : "none",
                "&:hover": {
                  transform: "scale(1.03) translateY(-5px)",
                  boxShadow: "0 30px 60px rgba(99, 102, 241, 0.4)",
                },
              }}
            >
              <Stack spacing={4} alignItems="center">
                <Avatar
                  sx={{
                    width: 160,
                    height: 160,
                    background: file
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    boxShadow: "0 10px 40px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {file ? (
                    <CheckCircle sx={{ fontSize: 80 }} />
                  ) : (
                    <CloudUpload sx={{ fontSize: 80 }} />
                  )}
                </Avatar>
                <Box>
                  <Typography variant="h2" gutterBottom fontWeight={800}>
                    {file ? "🎉 준비 완료!" : "📂 파일 업로드"}
                  </Typography>
                  <Typography variant="h5" color="text.secondary" fontWeight={500}>
                    PDF, DOCX, TXT 지원 • 최대 10MB
                  </Typography>
                </Box>
                {fileName && (
                  <Paper
                    elevation={8}
                    sx={{
                      p: 4,
                      background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                      minWidth: 400,
                      borderRadius: 4,
                      border: "2px solid #10b981",
                    }}
                  >
                    <Typography variant="h4" fontWeight={700} color="#059669">
                      📄 {fileName}
                    </Typography>
                  </Paper>
                )}
              </Stack>
              <input hidden type="file" onChange={handleFileUpload} />
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Slide direction="left" in timeout={500}>
            <Paper
              elevation={8}
              sx={{
                p: 5,
                borderRadius: 5,
                background: "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)",
                border: "2px solid #e9d5ff",
              }}
            >
              <Typography variant="h3" gutterBottom fontWeight={800} mb={4} color="#8b5cf6">
                ⚙️ 요약 커스터마이징
              </Typography>
              <SummarySettings
                sumTab={sumTab}
                setSumTab={setSumTab}
                sumField={sumField}
                setSumField={setSumField}
                sumLevel={sumLevel}
                setSumLevel={setSumLevel}
                sumSentCount={sumSentCount}
                setSumSentCount={setSumSentCount}
                sumTopicCount={sumTopicCount}
                setSumTopicCount={setSumTopicCount}
                sumKeywordCount={sumKeywordCount}
                setSumKeywordCount={setSumKeywordCount}
                keywords={keywords}
                setKeywords={setKeywords}
                setAiSummaryType={setAiSummaryType}
                setDbSummaryTypeKorean={setDbSummaryTypeKorean}
              />
            </Paper>
          </Slide>
        );

      case 2:
        return (
          <Fade in timeout={500}>
            <Box>
              {loadingSum ? (
                <CubeLoading message="AI 요약 생성 중..." type="summary" />
              ) : summaryText ? (
                <Paper
                  elevation={8}
                  sx={{
                    p: 5,
                    borderRadius: 5,
                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                    border: "3px solid #86efac",
                  }}
                >
                  <Stack spacing={4}>
                    <Box display="flex" alignItems="center" gap={3}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          boxShadow: "0 8px 32px rgba(16, 185, 129, 0.4)",
                        }}
                      >
                        <CheckCircle sx={{ fontSize: 50 }} />
                      </Avatar>
                      <Typography variant="h3" fontWeight={800}>
                        ✨ 요약 완성!
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      minRows={14}
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 3,
                          bgcolor: "white",
                          fontSize: "1.1rem",
                          lineHeight: 1.8,
                        },
                      }}
                    />
                    <Stack direction="row" spacing={3} justifyContent="center">
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => handleSave('summary')}
                        sx={{
                          borderRadius: 4,
                          px: 6,
                          py: 2,
                          borderWidth: 3,
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          "&:hover": { borderWidth: 3 },
                        }}
                      >
                        💾 저장하기
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => downloadAsPDF(summaryText, fileName || "summary", dbSummaryTypeKorean)}
                        sx={{
                          borderRadius: 4,
                          px: 6,
                          py: 2,
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                          boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)",
                        }}
                      >
                        📥 PDF 다운로드
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ) : null}
            </Box>
          </Fade>
        );

      case 3:
        return (
          <Slide direction="left" in timeout={500}>
            <Paper
              elevation={8}
              sx={{
                p: 5,
                borderRadius: 5,
                background: "linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)",
                border: "2px solid #fde68a",
              }}
            >
              <Typography variant="h3" gutterBottom fontWeight={800} mb={4} color="#f59e0b">
                🎯 문제 세팅
              </Typography>
              <ProblemSettings
                qTab={qTab}
                setQTab={setQTab}
                qField={qField}
                setQField={setQField}
                qLevel={qLevel}
                setQLevel={setQLevel}
                qCount={qCount}
                setQCount={setQCount}
                optCount={optCount}
                setOptCount={setOptCount}
                blankCount={blankCount}
                setBlankCount={setBlankCount}
                optionFormat={optionFormat}
                setOptionFormat={setOptionFormat}
                summaryText={summaryText}
                openSummaryDialog={false}
                setOpenSummaryDialog={() => {}}
                openSavedSummariesDialog={() => {}}
                hasSummaryText={!!summaryText}
              />
            </Paper>
          </Slide>
        );

      case 4:
        return (
          <Fade in timeout={500}>
            <Box>
              {loadingQ ? (
                <CubeLoading message="AI 문제 생성 중..." type="question" />
              ) : questionText && isJsonFormat ? (
                <Paper
                  elevation={8}
                  sx={{
                    p: 5,
                    borderRadius: 5,
                    background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                    border: "3px solid #f9a8d4",
                  }}
                >
                  <Stack spacing={4}>
                    <Box display="flex" alignItems="center" gap={3}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                          boxShadow: "0 8px 32px rgba(236, 72, 153, 0.4)",
                        }}
                      >
                        <EmojiObjects sx={{ fontSize: 50 }} />
                      </Avatar>
                      <Typography variant="h3" fontWeight={800}>
                        🎊 문제 완성!
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: "white", p: 4, borderRadius: 4 }}>
                      <QuestionRenderer questions={parsedQuestions} />
                    </Box>
                    <Stack direction="row" spacing={3} justifyContent="center">
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => handleSave('question')}
                        sx={{
                          borderRadius: 4,
                          px: 6,
                          py: 2,
                          borderWidth: 3,
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          "&:hover": { borderWidth: 3 },
                        }}
                      >
                        💾 저장하기
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => downloadAsPDF(questionText, fileName || "questions", aiQuestionPromptKeys_Korean[qTab])}
                        sx={{
                          borderRadius: 4,
                          px: 6,
                          py: 2,
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                          boxShadow: "0 8px 32px rgba(236, 72, 153, 0.4)",
                        }}
                      >
                        📥 PDF 다운로드
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ) : null}
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <PageNavigator />
      <Box
        sx={{
          minHeight: "100vh",
          p: 4,
          pt: 12,
          background: "linear-gradient(145deg, #faf5ff 0%, #f3e8ff 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={10}
            sx={{
              p: 5,
              borderRadius: 5,
              mb: 5,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "2px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      "& .MuiStepLabel-label": {
                        fontSize: "1.2rem",
                        fontWeight: 700,
                      },
                      "& .MuiStepIcon-root": {
                        fontSize: "2.5rem",
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Box sx={{ minHeight: 500, mb: 5 }}>
            {renderStepContent()}
          </Box>

          <Stack direction="row" justifyContent="space-between" sx={{ px: 2 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              size="large"
              sx={{
                borderRadius: 4,
                px: 6,
                py: 2,
                fontSize: "1.2rem",
                fontWeight: 700,
                border: "2px solid",
                borderColor: "primary.main",
              }}
            >
              이전 단계
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward />}
              disabled={
                activeStep === steps.length - 1 ||
                (activeStep === 0 && !file) ||
                (activeStep === 2 && !summaryText) ||
                (activeStep === 4 && !questionText)
              }
              size="large"
              sx={{
                borderRadius: 4,
                px: 6,
                py: 2,
                fontSize: "1.2rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 40px rgba(99, 102, 241, 0.5)",
                },
              }}
            >
              {activeStep === 1 ? "요약 생성 🚀" : activeStep === 3 ? "문제 생성 🎯" : "다음 단계"}
            </Button>
          </Stack>
        </Container>

        <SaveNameDialog
          open={openSaveNameDialog}
          onClose={() => setOpenSaveNameDialog(false)}
          onSave={handleConfirmSave}
          defaultName={fileName || 'untitled'}
          title={saveDialogType === 'summary' ? '요약 저장' : '문제 저장'}
          type={saveDialogType}
        />

        <Snackbar
          open={openSumDoneSnackbar}
          onClose={() => setOpenSumDoneSnackbar(false)}
          autoHideDuration={3000}
        >
          <Alert severity="success" sx={{ fontSize: "1.2rem", fontWeight: 600 }}>
            ✅ 요약 저장 완료!
          </Alert>
        </Snackbar>

        <Snackbar
          open={openQDoneSnackbar}
          onClose={() => setOpenQDoneSnackbar(false)}
          autoHideDuration={3000}
        >
          <Alert severity="success" sx={{ fontSize: "1.2rem", fontWeight: 600 }}>
            ✅ 문제 저장 완료!
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}