// 방안 1: 스텝 위저드 방식 (Step-by-Step Wizard)
// 파일 업로드 → 설정 → 생성 → 결과를 순차적으로 진행

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
  LinearProgress,
  Stack,
  Avatar,
  IconButton,
  Fade,
  Slide,
} from "@mui/material";
import {
  CloudUpload,
  Close,
  ArrowBack,
  ArrowForward,
  CheckCircle,
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

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 스텝 관리
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
    if (f) setActiveStep(1); // 파일 선택 시 자동으로 다음 단계
  };

  const handleNext = () => {
    if (activeStep === 1 && !summaryText) {
      // 요약 설정 후 요약 생성으로
      setActiveStep(2);
      handleGenerateSummary();
    } else if (activeStep === 3 && !questionText) {
      // 문제 설정 후 문제 생성으로
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

      if (sumTab === 2) {
        fd.append("topic_count", String(sumTopicCount));
      }

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
      setActiveStep(2); // 요약 생성 완료 단계로
    } catch (e: any) {
      console.error(e);
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
      } else {
        alert("문제 생성 중 오류가 발생했습니다.\n다시 한 번 시도해주세요.");
        setIsJsonFormat(false);
        setParsedQuestions([]);
        return false;
      }
    } catch (error) {
      alert("문제 생성 중 오류가 발생했습니다.\n다시 한 번 시도해주세요.");
      setIsJsonFormat(false);
      setParsedQuestions([]);
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
      setActiveStep(4); // 문제 생성 완료 단계로
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "문제 생성 오류");
    } finally {
      setLoadingQ(false);
    }
  };

  const handleSaveSummary = () => {
    setSaveDialogType('summary');
    setOpenSaveNameDialog(true);
  };

  const handleSaveQuestion = () => {
    setSaveDialogType('question');
    setOpenSaveNameDialog(true);
  };

  const handleConfirmSaveSummary = async (customName: string) => {
    if (!user || !fileName) return;
    try {
      await summaryAPI.saveSummary({
        userId: user.id,
        fileName: fileName,
        summaryName: customName,
        summaryType: dbSummaryTypeKorean,
        summaryText,
      });
      setOpenSaveNameDialog(false);
      setOpenSumDoneSnackbar(true);
    } catch (e) {
      console.error(e);
      alert("요약 저장 중 오류");
    }
  };

  const handleConfirmSaveQuestion = async (customName: string) => {
    if (!user || !fileName) return;
    try {
      await questionAPI.saveQuestion({
        userId: user.id,
        fileName: fileName,
        questionName: customName,
        questionType: aiQuestionPromptKeys_Korean[qTab],
        questionText,
      });
      setOpenSaveNameDialog(false);
      setOpenQDoneSnackbar(true);
    } catch (e) {
      console.error(e);
      alert("문제 저장 중 오류");
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
                border: "2px dashed #1976d2",
                borderRadius: 4,
                p: 8,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "#1565c0",
                  backgroundColor: "rgba(25, 118, 210, 0.04)",
                  transform: "scale(1.02)",
                },
              }}
            >
              <Stack spacing={3} alignItems="center">
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: "#1976d2",
                    transition: "all 0.3s ease",
                    "&:hover": { bgcolor: "#1565c0", transform: "rotate(360deg)" },
                  }}
                >
                  <CloudUpload sx={{ fontSize: 60 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" gutterBottom fontWeight={600}>
                    파일을 선택하세요
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    PDF, DOCX, TXT 파일을 드래그하거나 클릭하여 업로드
                  </Typography>
                </Box>
                {fileName && (
                  <Paper elevation={3} sx={{ p: 3, bgcolor: "#e3f2fd", minWidth: 300 }}>
                    <Typography variant="h6" fontWeight="medium" color="primary">
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
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={600} mb={3}>
                요약 설정
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
            </Box>
          </Slide>
        );

      case 2:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={600} mb={3}>
                요약 결과
              </Typography>
              {loadingSum ? (
                <Box textAlign="center" py={8}>
                  <LinearProgress sx={{ mb: 3, height: 8, borderRadius: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    AI가 문서를 요약하고 있습니다...
                  </Typography>
                </Box>
              ) : summaryText ? (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                  <Stack spacing={3}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                      <Typography variant="h5" fontWeight={600}>
                        요약 완료
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      minRows={10}
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleSaveSummary}
                        sx={{ borderRadius: 2.5, px: 4 }}
                      >
                        💾 요약 저장
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => downloadAsPDF(summaryText, fileName || "summary", dbSummaryTypeKorean)}
                        sx={{ borderRadius: 2.5, px: 4 }}
                      >
                        📄 PDF 다운로드
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ) : (
                <Box textAlign="center" py={8}>
                  <Typography variant="h6" color="text.secondary">
                    요약을 생성해주세요
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        );

      case 3:
        return (
          <Slide direction="left" in timeout={500}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={600} mb={3}>
                문제 설정
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
            </Box>
          </Slide>
        );

      case 4:
        return (
          <Fade in timeout={500}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={600} mb={3}>
                문제 생성 결과
              </Typography>
              {loadingQ ? (
                <Box textAlign="center" py={8}>
                  <LinearProgress sx={{ mb: 3, height: 8, borderRadius: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    AI가 문제를 생성하고 있습니다...
                  </Typography>
                </Box>
              ) : questionText && isJsonFormat ? (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                  <Stack spacing={3}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                      <Typography variant="h5" fontWeight={600}>
                        문제 생성 완료
                      </Typography>
                    </Box>
                    <QuestionRenderer questions={parsedQuestions} />
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleSaveQuestion}
                        sx={{ borderRadius: 2.5, px: 4 }}
                      >
                        💾 문제 저장
                      </Button>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => downloadAsPDF(questionText, fileName || "questions", aiQuestionPromptKeys_Korean[qTab])}
                        sx={{ borderRadius: 2.5, px: 4 }}
                      >
                        📄 PDF 다운로드
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ) : (
                <Box textAlign="center" py={8}>
                  <Typography variant="h6" color="text.secondary">
                    문제를 생성해주세요
                  </Typography>
                </Box>
              )}
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
          background: "linear-gradient(145deg, #ffffff 0%, #f4f7fa 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Paper elevation={4} sx={{ p: 4, borderRadius: 4, mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
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
              sx={{ borderRadius: 2.5, px: 4 }}
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
              sx={{ borderRadius: 2.5, px: 4 }}
            >
              {activeStep === 1 ? "요약 생성" : activeStep === 3 ? "문제 생성" : "다음"}
            </Button>
          </Stack>
        </Container>

        <SaveNameDialog
          open={openSaveNameDialog}
          onClose={() => setOpenSaveNameDialog(false)}
          onSave={saveDialogType === 'summary' ? handleConfirmSaveSummary : handleConfirmSaveQuestion}
          defaultName={fileName || 'untitled'}
          title={saveDialogType === 'summary' ? '요약 저장' : '문제 저장'}
          type={saveDialogType}
        />

        <Snackbar
          open={openSumDoneSnackbar}
          onClose={() => setOpenSumDoneSnackbar(false)}
          autoHideDuration={3000}
        >
          <Alert severity="success">✅ 요약 저장 완료!</Alert>
        </Snackbar>

        <Snackbar
          open={openQDoneSnackbar}
          onClose={() => setOpenQDoneSnackbar(false)}
          autoHideDuration={3000}
        >
          <Alert severity="success">✅ 문제 저장 완료!</Alert>
        </Snackbar>
      </Box>
    </>
  );
}