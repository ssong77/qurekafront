// 방안 2: 탭 + 슬라이드 애니메이션
// 각 탭 전환 시 콘텐츠가 좌우로 슬라이드되어 부드러운 전환

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
  Tabs,
  Tab,
  LinearProgress,
  Stack,
  Avatar,
  Slide,
  Fade,
} from "@mui/material";
import {
  CloudUpload,
  Description,
  Quiz,
  Settings as SettingsIcon,
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

type MainTab = "upload" | "summary" | "problem";

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 메인 탭 상태
  const [activeTab, setActiveTab] = useState<MainTab>("upload");
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");

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

  const handleTabChange = (newTab: MainTab) => {
    const tabs: MainTab[] = ["upload", "summary", "problem"];
    const currentIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(newTab);
    
    setSlideDirection(newIndex > currentIndex ? "left" : "right");
    setActiveTab(newTab);
  };

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "upload":
        return (
          <Slide direction={slideDirection === "left" ? "right" : "left"} in timeout={400}>
            <Box>
              <Typography variant="h3" fontWeight={600} align="center" gutterBottom>
                📁 문서 업로드
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" mb={6}>
                분석할 문서를 업로드하세요
              </Typography>

              <Box
                component="label"
                sx={{
                  display: "block",
                  border: "3px dashed",
                  borderColor: file ? "success.main" : "#1976d2",
                  borderRadius: 4,
                  p: 8,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  bgcolor: file ? "success.light" : "transparent",
                  "&:hover": {
                    borderColor: file ? "success.dark" : "#1565c0",
                    backgroundColor: file ? "success.light" : "rgba(25, 118, 210, 0.04)",
                    transform: "scale(1.02)",
                  },
                }}
              >
                <Stack spacing={3} alignItems="center">
                  <Avatar
                    sx={{
                      width: 140,
                      height: 140,
                      bgcolor: file ? "success.main" : "#1976d2",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {file ? (
                      <CheckCircle sx={{ fontSize: 70 }} />
                    ) : (
                      <CloudUpload sx={{ fontSize: 70 }} />
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" gutterBottom fontWeight={600}>
                      {fileName || "파일을 선택하세요"}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      PDF, DOCX, TXT 파일을 드래그하거나 클릭하여 업로드
                    </Typography>
                  </Box>
                </Stack>
                <input hidden type="file" onChange={handleFileUpload} />
              </Box>

              {file && (
                <Box textAlign="center" mt={4}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleTabChange("summary")}
                    sx={{ borderRadius: 3, px: 6, py: 2, fontSize: "1.1rem" }}
                  >
                    다음: 요약 설정 →
                  </Button>
                </Box>
              )}
            </Box>
          </Slide>
        );

      case "summary":
        return (
          <Slide direction={slideDirection === "left" ? "right" : "left"} in timeout={400}>
            <Box>
              <Typography variant="h3" fontWeight={600} align="center" gutterBottom>
                ✨ 요약 생성
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" mb={4}>
                AI가 문서의 핵심 내용을 요약합니다
              </Typography>

              <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  <SettingsIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                  요약 옵션 설정
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
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleGenerateSummary}
                  disabled={loadingSum}
                  sx={{ mt: 3, borderRadius: 2.5, py: 1.5 }}
                >
                  ✨ 요약 생성하기
                </Button>
              </Paper>

              {loadingSum && (
                <Box mb={3}>
                  <LinearProgress sx={{ height: 8, borderRadius: 2 }} />
                  <Typography variant="body2" color="text.secondary" align="center" mt={1}>
                    AI가 문서를 분석하고 있습니다...
                  </Typography>
                </Box>
              )}

              {summaryText && (
                <Fade in>
                  <Paper elevation={3} sx={{ p: 4, borderRadius: 3, bgcolor: "success.light" }}>
                    <Stack spacing={3}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <CheckCircle color="success" sx={{ fontSize: 40 }} />
                        <Typography variant="h5" fontWeight={600}>
                          요약 완료!
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        minRows={12}
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "white" } }}
                      />
                      <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                          variant="outlined"
                          onClick={() => handleSave('summary')}
                          sx={{ borderRadius: 2 }}
                        >
                          💾 저장
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => downloadAsPDF(summaryText, fileName || "summary", dbSummaryTypeKorean)}
                          sx={{ borderRadius: 2 }}
                        >
                          📄 PDF 다운로드
                        </Button>
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => handleTabChange("problem")}
                          sx={{ borderRadius: 2 }}
                        >
                          다음: 문제 생성 →
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                </Fade>
              )}
            </Box>
          </Slide>
        );

      case "problem":
        return (
          <Slide direction={slideDirection === "left" ? "right" : "left"} in timeout={400}>
            <Box>
              <Typography variant="h3" fontWeight={600} align="center" gutterBottom>
                📝 문제 생성
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center" mb={4}>
                요약을 기반으로 다양한 문제를 생성합니다
              </Typography>

              <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  <SettingsIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                  문제 옵션 설정
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
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleGenerateQuestion}
                  disabled={loadingQ || !summaryText}
                  sx={{ mt: 3, borderRadius: 2.5, py: 1.5 }}
                >
                  📝 문제 생성하기
                </Button>
              </Paper>

              {loadingQ && (
                <Box mb={3}>
                  <LinearProgress sx={{ height: 8, borderRadius: 2 }} />
                  <Typography variant="body2" color="text.secondary" align="center" mt={1}>
                    AI가 문제를 생성하고 있습니다...
                  </Typography>
                </Box>
              )}

              {questionText && isJsonFormat && parsedQuestions.length > 0 && (
                <Fade in>
                  <Paper elevation={3} sx={{ p: 4, borderRadius: 3, bgcolor: "info.light" }}>
                    <Stack spacing={3}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <CheckCircle color="success" sx={{ fontSize: 40 }} />
                        <Typography variant="h5" fontWeight={600}>
                          문제 생성 완료!
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: "white", p: 2, borderRadius: 2 }}>
                        <QuestionRenderer questions={parsedQuestions} />
                      </Box>
                      <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                          variant="outlined"
                          onClick={() => handleSave('question')}
                          sx={{ borderRadius: 2 }}
                        >
                          💾 저장
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => downloadAsPDF(questionText, fileName || "questions", aiQuestionPromptKeys_Korean[qTab])}
                          sx={{ borderRadius: 2 }}
                        >
                          📄 PDF 다운로드
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                </Fade>
              )}
            </Box>
          </Slide>
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
          {/* 탭 네비게이션 */}
          <Paper elevation={4} sx={{ mb: 5, borderRadius: 3, overflow: "hidden" }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => handleTabChange(val)}
              variant="fullWidth"
              sx={{
                minHeight: 70,
                "& .MuiTabs-indicator": {
                  height: "100%",
                  zIndex: 0,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                },
                "& .MuiTab-root": {
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  zIndex: 1,
                  color: "text.primary",
                  transition: "all 0.3s ease",
                  "&.Mui-selected": {
                    color: "white",
                  },
                },
              }}
            >
              <Tab
                label="파일 업로드"
                value="upload"
                icon={<CloudUpload />}
                iconPosition="start"
              />
              <Tab
                label="요약 생성"
                value="summary"
                icon={<Description />}
                iconPosition="start"
                disabled={!file}
              />
              <Tab
                label="문제 생성"
                value="problem"
                icon={<Quiz />}
                iconPosition="start"
                disabled={!summaryText}
              />
            </Tabs>
          </Paper>

          {/* 탭 콘텐츠 */}
          <Box sx={{ minHeight: 600 }}>
            {renderTabContent()}
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