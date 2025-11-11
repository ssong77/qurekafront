// 방안 4: 프로그레시브 디스클로저 (Progressive Disclosure)
// 기본 옵션만 표시, 고급 옵션은 접음 - 단계적 정보 공개

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
  Collapse,
  IconButton,
  Chip,
  Fade,
} from "@mui/material";
import {
  CloudUpload,
  ExpandMore,
  ExpandLess,
  Settings,
  PlayArrow,
  CheckCircle,
  Download,
  Save,
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

  // 확장/축소 상태
  const [showSummarySettings, setShowSummarySettings] = useState(false);
  const [showProblemSettings, setShowProblemSettings] = useState(false);
  const [showSummaryResult, setShowSummaryResult] = useState(false);
  const [showProblemResult, setShowProblemResult] = useState(false);

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
    if (f) setShowSummarySettings(true);
  };

  const handleGenerateSummary = async () => {
    if (!file || !user) return alert("파일 선택 및 로그인 필요");
    setLoadingSum(true);
    setShowSummaryResult(true);
    setShowSummarySettings(false);
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
      setShowProblemSettings(true);
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
    setShowProblemResult(true);
    setShowProblemSettings(false);
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
          background: "linear-gradient(145deg, #ffffff 0%, #f4f7fa 100%)",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight={700} align="center" gutterBottom>
            AI 문서 분석
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" mb={5}>
            필요한 기능만 펼쳐서 사용하세요
          </Typography>

          <Stack spacing={3}>
            {/* 1. 파일 업로드 */}
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Box sx={{ p: 3, bgcolor: "primary.main", color: "white" }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: "primary.dark" }}>
                    <CloudUpload />
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight={600}>
                      1. 파일 업로드
                    </Typography>
                    {fileName && (
                      <Typography variant="body2">
                        📄 {fileName}
                      </Typography>
                    )}
                  </Box>
                  {file && <CheckCircle />}
                </Stack>
              </Box>
              <Box sx={{ p: 3 }}>
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
                    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  }}
                >
                  <Typography variant="body1" fontWeight={500}>
                    {file ? "✓ 파일 선택 완료" : "파일을 선택하세요"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PDF, DOCX, TXT 파일 지원
                  </Typography>
                  <input hidden type="file" onChange={handleFileUpload} />
                </Box>
              </Box>
            </Paper>

            {/* 2. 요약 생성 */}
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: summaryText ? "success.main" : "secondary.main",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => setShowSummarySettings(!showSummarySettings)}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: summaryText ? "success.dark" : "secondary.dark" }}>
                    {summaryText ? <CheckCircle /> : <Settings />}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight={600}>
                      2. 요약 생성
                    </Typography>
                    <Typography variant="body2">
                      {summaryText ? "요약 완료" : file ? "클릭하여 설정" : "파일을 먼저 업로드하세요"}
                    </Typography>
                  </Box>
                  <IconButton sx={{ color: "white" }}>
                    {showSummarySettings ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Stack>
              </Box>

              <Collapse in={showSummarySettings} timeout="auto">
                <Box sx={{ p: 3, bgcolor: "grey.50" }}>
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
                    fullWidth
                    size="large"
                    onClick={handleGenerateSummary}
                    disabled={!file || loadingSum}
                    startIcon={<PlayArrow />}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    요약 생성하기
                  </Button>
                </Box>
              </Collapse>

              {loadingSum && (
                <Box sx={{ p: 2 }}>
                  <LinearProgress sx={{ height: 6, borderRadius: 1 }} />
                </Box>
              )}

              <Collapse in={showSummaryResult && !!summaryText} timeout="auto">
                <Box sx={{ p: 3 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={10}
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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
                      variant="text"
                      onClick={() => setShowSummaryResult(false)}
                      sx={{ borderRadius: 1.5 }}
                    >
                      접기
                    </Button>
                  </Stack>
                </Box>
              </Collapse>
            </Paper>

            {/* 3. 문제 생성 */}
            <Paper
              elevation={3}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                opacity: summaryText ? 1 : 0.5,
                pointerEvents: summaryText ? "auto" : "none",
              }}
            >
              <Box
                sx={{
                  p: 3,
                  bgcolor: questionText && isJsonFormat ? "success.main" : "info.main",
                  color: "white",
                  cursor: summaryText ? "pointer" : "default",
                }}
                onClick={() => summaryText && setShowProblemSettings(!showProblemSettings)}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: questionText && isJsonFormat ? "success.dark" : "info.dark" }}>
                    {questionText && isJsonFormat ? <CheckCircle /> : <Settings />}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" fontWeight={600}>
                      3. 문제 생성
                    </Typography>
                    <Typography variant="body2">
                      {questionText && isJsonFormat ? "문제 생성 완료" : summaryText ? "클릭하여 설정" : "요약을 먼저 완료하세요"}
                    </Typography>
                  </Box>
                  {summaryText && (
                    <IconButton sx={{ color: "white" }}>
                      {showProblemSettings ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  )}
                </Stack>
              </Box>

              <Collapse in={showProblemSettings} timeout="auto">
                <Box sx={{ p: 3, bgcolor: "grey.50" }}>
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
                    fullWidth
                    size="large"
                    onClick={handleGenerateQuestion}
                    disabled={!summaryText || loadingQ}
                    startIcon={<PlayArrow />}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    문제 생성하기
                  </Button>
                </Box>
              </Collapse>

              {loadingQ && (
                <Box sx={{ p: 2 }}>
                  <LinearProgress sx={{ height: 6, borderRadius: 1 }} />
                </Box>
              )}

              <Collapse in={showProblemResult && questionText && isJsonFormat} timeout="auto">
                <Box sx={{ p: 3 }}>
                  <QuestionRenderer questions={parsedQuestions} />
                  <Stack direction="row" spacing={2} mt={2}>
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
                      variant="text"
                      onClick={() => setShowProblemResult(false)}
                      sx={{ borderRadius: 1.5 }}
                    >
                      접기
                    </Button>
                  </Stack>
                </Box>
              </Collapse>
            </Paper>
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