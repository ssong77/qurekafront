// Enhanced Step Wizard v1 - 블루 테마 (파란색 계열)
import React, { useState, useEffect } from "react";
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
  IconButton,
  Fade,
  Slide,
  keyframes,
} from "@mui/material";
import {
  CloudUpload,
  Close,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  AutoAwesome,
  Rocket,
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

// 파티클 애니메이션
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// 파티클 로딩 컴포넌트 - 블루 테마
const ParticleLoading = ({ message }: { message: string }) => {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minHeight: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // 보라색 → 파란색 그라데이션으로 변경
        background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* 배경 파티클 */}
      {[...Array(20)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            width: Math.random() * 10 + 5,
            height: Math.random() * 10 + 5,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            borderRadius: "50%",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `${float} ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}

      {/* 중앙 로딩 아이콘 */}
      <Avatar
        sx={{
          width: 120,
          height: 120,
          bgcolor: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          animation: `${pulse} 2s ease-in-out infinite`,
          mb: 3,
        }}
      >
        <AutoAwesome sx={{ fontSize: 60, color: "white" }} />
      </Avatar>

      <Typography
        variant="h4"
        sx={{
          color: "white",
          fontWeight: 700,
          mb: 2,
          textAlign: "center",
          textShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        {message}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: "rgba(255, 255, 255, 0.9)",
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        AI가 열심히 작업하고 있습니다 ✨
      </Typography>

      {/* 프로그레스 바 */}
      <Box
        sx={{
          width: 300,
          height: 6,
          bgcolor: "rgba(255, 255, 255, 0.2)",
          borderRadius: 3,
          mt: 4,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)",
            animation: `${shimmer} 2s infinite`,
          }}
        />
      </Box>
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
                border: "3px dashed",
                borderColor: file ? "#10b981" : "#3b82f6", // 파란색으로 변경
                borderRadius: 4,
                p: 8,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: file
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(8, 145, 178, 0.1) 100%)", // 파란색 그라데이션
                backdropFilter: "blur(10px)",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: "0 20px 60px rgba(59, 130, 246, 0.3)", // 파란색 그림자
                },
              }}
            >
              <Stack spacing={3} alignItems="center">
                <Avatar
                  sx={{
                    width: 140,
                    height: 140,
                    background: file
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #3b82f6 0%, #0891b2 100%)", // 파란색 그라데이션
                    transition: "all 0.5s ease",
                    animation: `${pulse} 2s ease-in-out infinite`,
                  }}
                >
                  {file ? (
                    <CheckCircle sx={{ fontSize: 70 }} />
                  ) : (
                    <CloudUpload sx={{ fontSize: 70 }} />
                  )}
                </Avatar>
                <Box>
                  <Typography variant="h3" gutterBottom fontWeight={700}>
                    {file ? "✨ 파일 준비 완료!" : "📁 파일을 선택하세요"}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    PDF, DOCX, TXT 파일을 드래그하거나 클릭하여 업로드
                  </Typography>
                </Box>
                {fileName && (
                  <Paper
                    elevation={6}
                    sx={{
                      p: 3,
                      background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)", // 파란색 배경
                      minWidth: 350,
                      borderRadius: 3,
                    }}
                  >
                    <Typography variant="h5" fontWeight={600} sx={{ color: "#1e40af" }}>
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
              elevation={6}
              sx={{
                p: 4,
                borderRadius: 4,
                background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", // 연한 파란색
              }}
            >
              <Typography variant="h3" gutterBottom fontWeight={700} mb={4}>
                ⚙️ 요약 설정
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
                <ParticleLoading message="AI가 문서를 요약하고 있습니다" />
              ) : summaryText ? (
                <Paper
                  elevation={6}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  }}
                >
                  <Stack spacing={3}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                      >
                        <CheckCircle sx={{ fontSize: 35 }} />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        🎉 요약 완료!
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      minRows={12}
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 3,
                          bgcolor: "white",
                        },
                      }}
                    />
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => handleSave('summary')}
                        sx={{
                          borderRadius: 3,
                          px: 4,
                          borderWidth: 2,
                          borderColor: "#3b82f6", // 파란색 테두리
                          color: "#3b82f6",
                          "&:hover": { 
                            borderWidth: 2,
                            borderColor: "#2563eb",
                            bgcolor: "rgba(59, 130, 246, 0.04)",
                          },
                        }}
                      >
                        💾 저장
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => downloadAsPDF(summaryText, fileName || "summary", dbSummaryTypeKorean)}
                        sx={{
                          borderRadius: 3,
                          px: 4,
                          background: "linear-gradient(135deg, #3b82f6 0%, #0891b2 100%)", // 파란색 그라데이션
                          "&:hover": {
                            background: "linear-gradient(135deg, #2563eb 0%, #0e7490 100%)",
                          },
                        }}
                      >
                        📄 PDF 다운로드
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
              elevation={6}
              sx={{
                p: 4,
                borderRadius: 4,
                background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)", // 연한 파란색
              }}
            >
              <Typography variant="h3" gutterBottom fontWeight={700} mb={4}>
                🎯 문제 설정
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
                <ParticleLoading message="AI가 문제를 생성하고 있습니다" />
              ) : questionText && isJsonFormat ? (
                <Paper
                  elevation={6}
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", // 연한 파란색
                  }}
                >
                  <Stack spacing={3}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", // 파란색
                        }}
                      >
                        <Rocket sx={{ fontSize: 35 }} />
                      </Avatar>
                      <Typography variant="h4" fontWeight={700}>
                        🎊 문제 생성 완료!
                      </Typography>
                    </Box>
                    <Box sx={{ bgcolor: "white", p: 3, borderRadius: 3 }}>
                      <QuestionRenderer questions={parsedQuestions} />
                    </Box>
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => handleSave('question')}
                        sx={{
                          borderRadius: 3,
                          px: 4,
                          borderWidth: 2,
                          borderColor: "#3b82f6", // 파란색 테두리
                          color: "#3b82f6",
                          "&:hover": { 
                            borderWidth: 2,
                            borderColor: "#2563eb",
                            bgcolor: "rgba(59, 130, 246, 0.04)",
                          },
                        }}
                      >
                        💾 저장
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => downloadAsPDF(questionText, fileName || "questions", aiQuestionPromptKeys_Korean[qTab])}
                        sx={{
                          borderRadius: 3,
                          px: 4,
                          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", // 파란색 그라데이션
                          "&:hover": {
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          },
                        }}
                      >
                        📄 PDF 다운로드
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
          background: "linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%)", // 파란색 배경
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 4,
              mb: 4,
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(59, 130, 246, 0.1)", // 파란색 테두리
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      "& .MuiStepLabel-label": {
                        fontSize: "1.1rem",
                        fontWeight: 600,
                      },
                      "& .MuiStepIcon-root": {
                        color: "#93c5fd", // 파란색
                      },
                      "& .MuiStepIcon-root.Mui-active": {
                        color: "#3b82f6", // 진한 파란색
                      },
                      "& .MuiStepIcon-root.Mui-completed": {
                        color: "#2563eb", // 더 진한 파란색
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Box sx={{ minHeight: 500, mb: 4 }}>
            {renderStepContent()}
          </Box>

          <Stack direction="row" justifyContent="space-between" sx={{ px: 2 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              size="large"
              sx={{
                borderRadius: 3,
                px: 5,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#3b82f6", // 파란색
                "&:hover": {
                  bgcolor: "rgba(59, 130, 246, 0.08)",
                },
              }}
            >
              이전
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
                borderRadius: 3,
                px: 5,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                background: "linear-gradient(135deg, #3b82f6 0%, #0891b2 100%)", // 파란색 그라데이션
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #2563eb 0%, #0e7490 100%)",
                  boxShadow: "0 6px 30px rgba(37, 99, 235, 0.5)",
                },
              }}
            >
              {activeStep === 1 ? "요약 생성" : activeStep === 3 ? "문제 생성" : "다음"}
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
          <Alert severity="success" sx={{ fontSize: "1.1rem" }}>
            ✅ 요약 저장 완료!
          </Alert>
        </Snackbar>

        <Snackbar
          open={openQDoneSnackbar}
          onClose={() => setOpenQDoneSnackbar(false)}
          autoHideDuration={3000}
        >
          <Alert severity="success" sx={{ fontSize: "1.1rem" }}>
            ✅ 문제 저장 완료!
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}