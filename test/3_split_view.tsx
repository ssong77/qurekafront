// 방안 3: Split View (분할 화면)
// 화면을 2개 영역으로 분할하여 동시에 여러 정보 확인 가능

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
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Fade,
} from "@mui/material";
import {
  CloudUpload,
  Download,
  Save,
  Refresh,
  Visibility,
  VisibilityOff,
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

  // 화면 표시 상태
  const [showSummary, setShowSummary] = useState(true);
  const [showProblem, setShowProblem] = useState(true);

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
          pt: 10,
          background: "linear-gradient(145deg, #f0f2f5 0%, #e1e4e8 100%)",
        }}
      >
        {/* 파일 업로드 헤더 */}
        <Container maxWidth="xl" sx={{ mb: 3 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box
                component="label"
                sx={{
                  flexGrow: 1,
                  border: "2px dashed",
                  borderColor: file ? "success.main" : "grey.400",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: file ? "success.main" : "primary.main" }}>
                    <CloudUpload />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {fileName || "파일 선택"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PDF, DOCX, TXT 파일
                    </Typography>
                  </Box>
                </Stack>
                <input hidden type="file" onChange={handleFileUpload} />
              </Box>

              <Stack direction="row" spacing={1}>
                <Tooltip title={showSummary ? "요약 숨기기" : "요약 보기"}>
                  <IconButton
                    onClick={() => setShowSummary(!showSummary)}
                    color={showSummary ? "primary" : "default"}
                  >
                    {showSummary ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={showProblem ? "문제 숨기기" : "문제 보기"}>
                  <IconButton
                    onClick={() => setShowProblem(!showProblem)}
                    color={showProblem ? "primary" : "default"}
                  >
                    {showProblem ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        </Container>

        {/* 분할 뷰 */}
        <Container maxWidth="xl">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: showSummary && showProblem ? "1fr 1fr" : "1fr",
              },
              gap: 3,
              minHeight: "calc(100vh - 200px)",
            }}
          >
            {/* 왼쪽: 요약 섹션 */}
            {showSummary && (
              <Fade in>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3, display: "flex", flexDirection: "column" }}>
                  <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h5" fontWeight={600}>
                        📄 요약
                      </Typography>
                      {summaryText && (
                        <Chip label="완료" color="success" size="small" />
                      )}
                    </Box>

                    <Divider />

                    {/* 요약 설정 */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleGenerateSummary}
                      disabled={!file || loadingSum}
                      startIcon={<Refresh />}
                      sx={{ borderRadius: 2 }}
                    >
                      요약 생성
                    </Button>

                    {loadingSum && <LinearProgress sx={{ height: 6, borderRadius: 1 }} />}

                    {/* 요약 결과 */}
                    {summaryText && (
                      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        <TextField
                          fullWidth
                          multiline
                          value={summaryText}
                          onChange={(e) => setSummaryText(e.target.value)}
                          sx={{
                            flexGrow: 1,
                            "& .MuiOutlinedInput-root": {
                              height: "100%",
                              alignItems: "flex-start",
                              borderRadius: 2,
                            },
                          }}
                        />
                        <Stack direction="row" spacing={1} mt={2}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Save />}
                            onClick={() => handleSave('summary')}
                            sx={{ borderRadius: 1.5 }}
                          >
                            저장
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Download />}
                            onClick={() => downloadAsPDF(summaryText, fileName || "summary", dbSummaryTypeKorean)}
                            sx={{ borderRadius: 1.5 }}
                          >
                            PDF
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Fade>
            )}

            {/* 오른쪽: 문제 섹션 */}
            {showProblem && (
              <Fade in>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3, display: "flex", flexDirection: "column" }}>
                  <Stack spacing={2} sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h5" fontWeight={600}>
                        📝 문제
                      </Typography>
                      {questionText && isJsonFormat && (
                        <Chip label="완료" color="success" size="small" />
                      )}
                    </Box>

                    <Divider />

                    {/* 문제 설정 */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleGenerateQuestion}
                      disabled={!summaryText || loadingQ}
                      startIcon={<Refresh />}
                      sx={{ borderRadius: 2 }}
                    >
                      문제 생성
                    </Button>

                    {loadingQ && <LinearProgress sx={{ height: 6, borderRadius: 1 }} />}

                    {/* 문제 결과 */}
                    {questionText && isJsonFormat && parsedQuestions.length > 0 && (
                      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <QuestionRenderer questions={parsedQuestions} />
                        </Paper>
                        <Stack direction="row" spacing={1} mt={2}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Save />}
                            onClick={() => handleSave('question')}
                            sx={{ borderRadius: 1.5 }}
                          >
                            저장
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Download />}
                            onClick={() => downloadAsPDF(questionText, fileName || "questions", aiQuestionPromptKeys_Korean[qTab])}
                            sx={{ borderRadius: 1.5 }}
                          >
                            PDF
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Fade>
            )}
          </Box>
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