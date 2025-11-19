// 방안 5: 플로팅 액션 버튼 + 오버레이
// 설정은 오버레이로 숨김, FAB로 빠른 접근 - 모바일 친화적

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
  Fab,
  Drawer,
  IconButton,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fade,
  Badge,
} from "@mui/material";
import {
  CloudUpload,
  Close,
  Settings,
  Description,
  Quiz,
  Download,
  Save,
  CheckCircle,
  Add,
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

type DrawerType = "file" | "summary-settings" | "problem-settings" | null;

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 드로어 상태
  const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);

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
    if (f) setOpenDrawer(null);
  };

  const handleGenerateSummary = async () => {
    if (!file || !user) return alert("파일 선택 및 로그인 필요");
    setLoadingSum(true);
    setOpenDrawer(null);
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
    setOpenDrawer(null);
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

  const speedDialActions = [
    { icon: <CloudUpload />, name: '파일 업로드', onClick: () => setOpenDrawer('file') },
    { icon: <Description />, name: '요약 설정', onClick: () => setOpenDrawer('summary-settings'), disabled: !file },
    { icon: <Quiz />, name: '문제 설정', onClick: () => setOpenDrawer('problem-settings'), disabled: !summaryText },
  ];

  return (
    <>
      <Header />
      <PageNavigator />
      <Box
        sx={{
          minHeight: "100vh",
          p: 3,
          pt: 11,
          pb: 10,
          background: "linear-gradient(145deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <Container maxWidth="lg">
          {/* 상태 표시 바 */}
          <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Badge
                badgeContent={file ? <CheckCircle fontSize="small" /> : null}
                color="success"
              >
                <Avatar sx={{ bgcolor: file ? "success.main" : "grey.400" }}>
                  <CloudUpload />
                </Avatar>
              </Badge>
              <Avatar sx={{ width: 4, height: 40, borderRadius: 0, bgcolor: "grey.300" }} />
              <Badge
                badgeContent={summaryText ? <CheckCircle fontSize="small" /> : null}
                color="success"
              >
                <Avatar sx={{ bgcolor: summaryText ? "success.main" : "grey.400" }}>
                  <Description />
                </Avatar>
              </Badge>
              <Avatar sx={{ width: 4, height: 40, borderRadius: 0, bgcolor: "grey.300" }} />
              <Badge
                badgeContent={questionText && isJsonFormat ? <CheckCircle fontSize="small" /> : null}
                color="success"
              >
                <Avatar sx={{ bgcolor: questionText && isJsonFormat ? "success.main" : "grey.400" }}>
                  <Quiz />
                </Avatar>
              </Badge>
            </Stack>
          </Paper>

          {/* 메인 콘텐츠 영역 */}
          <Stack spacing={3}>
            {/* 요약 결과 */}
            {summaryText && (
              <Fade in>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" fontWeight={600}>
                        📄 요약 결과
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleSave('summary')}
                          color="primary"
                        >
                          <Save />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => downloadAsPDF(summaryText, fileName || "summary", dbSummaryTypeKorean)}
                          color="primary"
                        >
                          <Download />
                        </IconButton>
                      </Stack>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      minRows={8}
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                  </Stack>
                </Paper>
              </Fade>
            )}

            {loadingSum && (
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 2 }} />
                <Typography variant="body2" color="text.secondary" align="center">
                  AI가 요약을 생성하고 있습니다...
                </Typography>
              </Paper>
            )}

            {/* 문제 결과 */}
            {questionText && isJsonFormat && parsedQuestions.length > 0 && (
              <Fade in>
                <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" fontWeight={600}>
                        📝 생성된 문제
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleSave('question')}
                          color="primary"
                        >
                          <Save />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => downloadAsPDF(questionText, fileName || "questions", aiQuestionPromptKeys_Korean[qTab])}
                          color="primary"
                        >
                          <Download />
                        </IconButton>
                      </Stack>
                    </Box>
                    <QuestionRenderer questions={parsedQuestions} />
                  </Stack>
                </Paper>
              </Fade>
            )}

            {loadingQ && (
              <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                <LinearProgress sx={{ mb: 2, height: 8, borderRadius: 2 }} />
                <Typography variant="body2" color="text.secondary" align="center">
                  AI가 문제를 생성하고 있습니다...
                </Typography>
              </Paper>
            )}

            {/* 안내 메시지 */}
            {!file && !summaryText && !questionText && (
              <Paper elevation={3} sx={{ p: 6, borderRadius: 3, textAlign: "center" }}>
                <Avatar sx={{ width: 100, height: 100, mx: "auto", mb: 3, bgcolor: "primary.main" }}>
                  <Add sx={{ fontSize: 50 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  시작하기
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>
                  오른쪽 하단의 버튼을 클릭하여 파일을 업로드하세요
                </Typography>
              </Paper>
            )}
          </Stack>
        </Container>

        {/* SpeedDial - 플로팅 액션 버튼 */}
        <SpeedDial
          ariaLabel="Actions"
          sx={{ position: "fixed", bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
        >
          {speedDialActions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              FabProps={{
                disabled: action.disabled,
              }}
            />
          ))}
        </SpeedDial>

        {/* 드로어 - 파일 업로드 */}
        <Drawer
          anchor="bottom"
          open={openDrawer === 'file'}
          onClose={() => setOpenDrawer(null)}
        >
          <Box sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={600}>
                  파일 업로드
                </Typography>
                <IconButton onClick={() => setOpenDrawer(null)}>
                  <Close />
                </IconButton>
              </Box>
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
                <Typography variant="h6" fontWeight={500}>
                  {fileName || "파일 선택"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF, DOCX, TXT 파일 지원
                </Typography>
                <input hidden type="file" onChange={handleFileUpload} />
              </Box>
            </Stack>
          </Box>
        </Drawer>

        {/* 드로어 - 요약 설정 */}
        <Drawer
          anchor="bottom"
          open={openDrawer === 'summary-settings'}
          onClose={() => setOpenDrawer(null)}
          PaperProps={{ sx: { maxHeight: "80vh" } }}
        >
          <Box sx={{ p: 3, overflow: "auto" }}>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={600}>
                  요약 설정
                </Typography>
                <IconButton onClick={() => setOpenDrawer(null)}>
                  <Close />
                </IconButton>
              </Box>
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
                sx={{ borderRadius: 2 }}
              >
                요약 생성하기
              </Button>
            </Stack>
          </Box>
        </Drawer>

        {/* 드로어 - 문제 설정 */}
        <Drawer
          anchor="bottom"
          open={openDrawer === 'problem-settings'}
          onClose={() => setOpenDrawer(null)}
          PaperProps={{ sx: { maxHeight: "80vh" } }}
        >
          <Box sx={{ p: 3, overflow: "auto" }}>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={600}>
                  문제 설정
                </Typography>
                <IconButton onClick={() => setOpenDrawer(null)}>
                  <Close />
                </IconButton>
              </Box>
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
                sx={{ borderRadius: 2 }}
              >
                문제 생성하기
              </Button>
            </Stack>
          </Box>
        </Drawer>

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