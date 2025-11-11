// 방안 6: 타임라인 기반 UI
// 작업 진행을 타임라인으로 시각화, 과거 작업 이력 표시

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
  LinearProgress,
  Stack,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  IconButton,
  Fade,
} from "@mui/material";
import {
  CloudUpload,
  CheckCircle,
  RadioButtonUnchecked,
  Description,
  Quiz,
  Download,
  Save,
  PlayArrow,
  Edit,
  Refresh,
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

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 타임라인 진행 상태
  const [activeStep, setActiveStep] = useState(0);

  // 파일 상태
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
    if (f && activeStep === 0) setActiveStep(1);
  };

  const handleGenerateSummary = async () => {
    if (!file || !user) return alert("파일 선택 및 로그인 필요");
    setLoadingSum(true);
    if (activeStep === 1) setActiveStep(2);
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
          alert("문제가 생성되지 않았습니다.");
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
    if (activeStep === 3) setActiveStep(4);
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

  return (
    <>
      <Header />
      <PageNavigator />
      <Box
        sx={{
          minHeight: "100vh",
          p: 4,
          pt: 12,
          background: "linear-gradient(145deg, #ffffff 0%, #f0f4f8 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={700} align="center" gutterBottom>
            작업 타임라인
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" mb={5}>
            각 단계를 순서대로 완료하세요
          </Typography>

          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 0: 파일 업로드 */}
            <Step>
              <StepLabel
                StepIconComponent={() => (
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: file ? "success.main" : activeStep === 0 ? "primary.main" : "grey.300",
                    }}
                  >
                    {file ? <CheckCircle /> : <CloudUpload />}
                  </Avatar>
                )}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6" fontWeight={600}>
                    파일 업로드
                  </Typography>
                  {file && (
                    <Chip label={fileName} color="success" size="small" />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 3, my: 2, borderRadius: 2 }}>
                  <Box
                    component="label"
                    sx={{
                      display: "block",
                      border: "2px dashed",
                      borderColor: file ? "success.main" : "grey.400",
                      borderRadius: 2,
                      p: 4,
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Stack spacing={2} alignItems="center">
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: file ? "success.main" : "primary.main",
                        }}
                      >
                        <CloudUpload sx={{ fontSize: 40 }} />
                      </Avatar>
                      <Typography variant="h6">
                        {file ? "✓ 파일 선택 완료" : "파일 선택"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        PDF, DOCX, TXT 파일 지원
                      </Typography>
                    </Stack>
                    <input hidden type="file" onChange={handleFileUpload} />
                  </Box>
                </Paper>
              </StepContent>
            </Step>

            {/* Step 1: 요약 설정 */}
            <Step>
              <StepLabel
                StepIconComponent={() => (
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: activeStep > 1 ? "success.main" : activeStep === 1 ? "primary.main" : "grey.300",
                    }}
                  >
                    {activeStep > 1 ? <CheckCircle /> : <Edit />}
                  </Avatar>
                )}
              >
                <Typography variant="h6" fontWeight={600}>
                  요약 설정
                </Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 3, my: 2, borderRadius: 2 }}>
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
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleGenerateSummary}
                    disabled={loadingSum}
                    startIcon={<PlayArrow />}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    요약 생성하기
                  </Button>
                </Paper>
              </StepContent>
            </Step>

            {/* Step 2: 요약 결과 */}
            <Step>
              <StepLabel
                StepIconComponent={() => (
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: summaryText ? "success.main" : activeStep === 2 ? "primary.main" : "grey.300",
                    }}
                  >
                    {summaryText ? <CheckCircle /> : <Description />}
                  </Avatar>
                )}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6" fontWeight={600}>
                    요약 결과
                  </Typography>
                  {summaryText && <Chip label="완료" color="success" size="small" />}
                </Box>
              </StepLabel>
              <StepContent>
                {loadingSum ? (
                  <Paper elevation={2} sx={{ p: 3, my: 2, borderRadius: 2 }}>
                    <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 2 }} />
                    <Typography variant="body2" color="text.secondary" align="center">
                      AI가 요약을 생성하고 있습니다...
                    </Typography>
                  </Paper>
                ) : summaryText ? (
                  <Paper elevation={2} sx={{ p: 3, my: 2, borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={10}
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                      />
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          startIcon={<Save />}
                          onClick={() => handleSave('summary')}
                          sx={{ borderRadius: 1.5 }}
                        >
                          저장
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => downloadAsPDF(summaryText, fileName || "summary", dbSummaryTypeKorean)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          PDF
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => setActiveStep(3)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          다음: 문제 생성 →
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ) : null}
              </StepContent>
            </Step>

            {/* Step 3: 문제 설정 */}
            <Step>
              <StepLabel
                StepIconComponent={() => (
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: activeStep > 3 ? "success.main" : activeStep === 3 ? "primary.main" : "grey.300",
                    }}
                  >
                    {activeStep > 3 ? <CheckCircle /> : <Edit />}
                  </Avatar>
                )}
              >
                <Typography variant="h6" fontWeight={600}>
                  문제 설정
                </Typography>
              </StepLabel>
              <StepContent>
                <Paper elevation={2} sx={{ p: 3, my: 2, borderRadius: 2 }}>
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
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleGenerateQuestion}
                    disabled={loadingQ}
                    startIcon={<PlayArrow />}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    문제 생성하기
                  </Button>
                </Paper>
              </StepContent>
            </Step>

            {/* Step 4: 문제 결과 */}
            <Step>
              <StepLabel
                StepIconComponent={() => (
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: questionText && isJsonFormat ? "success.main" : activeStep === 4 ? "primary.main" : "grey.300",
                    }}
                  >
                    {questionText && isJsonFormat ? <CheckCircle /> : <Quiz />}
                  </Avatar>
                )}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h6" fontWeight={600}>
                    생성된 문제
                  </Typography>
                  {questionText && isJsonFormat && (
                    <Chip label="완료" color="success" size="small" />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                {loadingQ ? (
                  <Paper elevation={2} sx={{ p: 3, my: 2, borderRadius: 2 }}>
                    <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 2 }} />
                    <Typography variant="body2" color="text.secondary" align="center">
                      AI가 문제를 생성하고 있습니다...
                    </Typography>
                  </Paper>
                ) : questionText && isJsonFormat && parsedQuestions.length > 0 ? (
                  <Paper elevation={2} sx={{ p: 3, my: 2, borderRadius: 2 }}>
                    <Stack spacing={2}>
                      <QuestionRenderer questions={parsedQuestions} />
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          startIcon={<Save />}
                          onClick={() => handleSave('question')}
                          sx={{ borderRadius: 1.5 }}
                        >
                          저장
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => downloadAsPDF(questionText, fileName || "questions", aiQuestionPromptKeys_Korean[qTab])}
                          sx={{ borderRadius: 1.5 }}
                        >
                          PDF
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          sx={{ borderRadius: 1.5 }}
                        >
                          완료
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ) : null}
              </StepContent>
            </Step>
          </Stepper>

          {/* 작업 완료 메시지 */}
          {questionText && isJsonFormat && (
            <Fade in>
              <Paper
                elevation={4}
                sx={{
                  mt: 4,
                  p: 4,
                  borderRadius: 3,
                  textAlign: "center",
                  bgcolor: "success.light",
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "success.main",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 50 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  모든 작업이 완료되었습니다!
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>
                  요약과 문제가 성공적으로 생성되었습니다
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => {
                      setFile(null);
                      setFileName(null);
                      setSummaryText("");
                      setQuestionText("");
                      setActiveStep(0);
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    새로 시작
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/mypage')}
                    sx={{ borderRadius: 2 }}
                  >
                    마이페이지로 이동
                  </Button>
                </Stack>
              </Paper>
            </Fade>
          )}
        </Container>

        <SaveNameDialog
          open={openSaveNameDialog}
          onClose={() => setOpenSaveNameDialog(false)}
          onSave={handleConfirmSave}
          defaultName={fileName || 'untitled'}
          title={saveDialogType === 'summary' ? '요약 저장' : '문제 저장'}
          type={saveDialogType}
        />

        <Snackbar open={openSumDoneSnackbar} onClose={() => setOpenSumDoneSnackbar(false)} autoHideDuration={3000}>
          <Alert severity="success">✅ 요약 저장 완료!</Alert>
        </Snackbar>

        <Snackbar open={openQDoneSnackbar} onClose={() => setOpenQDoneSnackbar(false)} autoHideDuration={3000}>
          <Alert severity="success">✅ 문제 저장 완료!</Alert>
        </Snackbar>
      </Box>
    </>
  );
}