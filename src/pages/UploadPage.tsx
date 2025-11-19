// src/pages/UploadPage.tsx
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
  Tabs,
  Tab,
  LinearProgress,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { CloudUpload, GetApp, Close } from "@mui/icons-material";
import Header from "../components/Header";
// 추가 임포트
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
  MainTab,
  AiSummaryPromptKey,
  DbSummaryPromptKey_Korean,
  Question,
} from "../types/upload";
import {
  aiSummaryPromptKeys,
  dbSummaryPromptKeys_Korean,
  aiQuestionPromptKeys_Korean,
  questionLabels,
} from "../constants/upload";
import { jsPDF } from "jspdf";
import SavedSummaryDialog from "../components/upload/SavedSummaryDialog";
import { SummaryItem } from "../services/api";
import SaveNameDialog from "../components/upload/SaveNameDialog";

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // common state
  const [mainTab, setMainTab] = useState<MainTab>("summary");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // modal state
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);

  // summary state
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

  // problem state
  const [qTab, setQTab] = useState(0);
  const [qField, setQField] = useState("언어");
  const [qLevel, setQLevel] = useState("비전공자");
  const [qCount, setQCount] = useState(3);
  const [optCount, setOptCount] = useState(4);
  const [blankCount, setBlankCount] = useState(1);
  const [questionText, setQuestionText] = useState("");
  const [loadingQ, setLoadingQ] = useState(false);
  const [optionFormat, setOptionFormat] = useState("단답형");

  // snackbar state
  const [openSumDoneSnackbar, setOpenSumDoneSnackbar] = useState(false);
  const [openQDoneSnackbar, setOpenQDoneSnackbar] = useState(false);

  // parsed questions state
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [isJsonFormat, setIsJsonFormat] = useState(false);

  // 추가할 상태들
  const [openSavedSummariesDialog, setOpenSavedSummariesDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<SummaryItem | null>(null);
  
  // 파일명 입력 모달 상태 추가
  const [openSaveNameDialog, setOpenSaveNameDialog] = useState(false);
  const [saveDialogType, setSaveDialogType] = useState<'summary' | 'question'>('summary');

  // PDF 다운로드 관련 상태 추가
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // 추가: 파일명 에러 상태
  const [fileNameError, setFileNameError] = useState<string>("");

  useEffect(() => {
    // jsPDF 폰트 로드를 조건부로 처리
    const loadFont = async () => {
      try {
        const response = await fetch("/fonts/NotoSansKR-Regular.ttf");
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const b64 = btoa(
            new Uint8Array(buffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ""
            )
          );

          if (jsPDF && jsPDF.API) {
            jsPDF.API.addFileToVFS("NotoSansKR-Regular.ttf", b64);
            jsPDF.API.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
          }
        }
      } catch (error) {
        console.log("폰트 로드 실패:", error);
      }
    };

    loadFont();
  }, []);

  // 파일명 유효성 검사 함수
  const isValidFileName = (name: string): boolean => {
    // 확장자 제거
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name;
    // 허용된 특수기호: . , - _ () [] %
    const validPattern = /^[a-zA-Z0-9가-힣\s.,\-_()[\]%]+$/;
    return validPattern.test(nameWithoutExt);
  };

  // handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    
    if (f) {
      // 파일명 유효성 검사
      if (!isValidFileName(f.name)) {
        setFileNameError('파일명에는 . , - _ () [] % 특수기호만 사용할 수 있습니다.');
        setFile(null);
        setFileName(null);
        // 파일 입력 초기화
        e.target.value = '';
        return;
      }
      setFileNameError('');
    }
    
    setFile(f);
    setFileName(f?.name ?? null);
  };

  const handleGenerateSummary = async () => {
    if (!file || !user) return alert("파일을 선택해주세요.");
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
          const validKeywords = keywords.filter(
            (k) => k && k.trim().length > 0
          );
          if (validKeywords.length > 0) {
            fd.append("user_keywords", validKeywords.join(","));
          }
        }
      }

      const res = await aiSummaryAPI.generateSummary(fd);
      setSummaryText(res.data.summary);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "요약 생성 오류");
    } finally {
      setLoadingSum(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!user || !fileName) return;
    
    // 모달 열기
    setSaveDialogType('summary');
    setOpenSaveNameDialog(true);
  };

  // 실제 요약 저장 함수
  const handleConfirmSaveSummary = async (customName: string) => {
    if (!user || !fileName) return;
    
    try {
      await summaryAPI.saveSummary({
        userId: user.id,
        fileName: fileName,  // 업로드한 파일명
        summaryName: customName,  // 사용자가 입력한 요약 이름
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

  const parseQuestionJson = (jsonText: string) => {
    try {
      const data = JSON.parse(jsonText);
      if (data.questions && Array.isArray(data.questions)) {
        if (data.questions.length === 0) {
          alert('문제가 생성되지 않았습니다.\n다시 한 번 시도해주세요.');
          setIsJsonFormat(false);
          setParsedQuestions([]);
          // questionText는 유지 (Paper는 표시해야 하므로)
          return false;
        }
        setParsedQuestions(data.questions);
        setIsJsonFormat(true);
        return true;
      } else {
        console.warn('JSON 형식이지만 questions 배열이 없습니다.');
        alert('문제 생성 중 오류가 발생했습니다.\n다시 한 번 시도해주세요.');
        setIsJsonFormat(false);
        setParsedQuestions([]);
        // questionText는 유지
        return false;
      }
    } catch (error) {
      console.error("JSON 파싱 오류:", error);
      alert('문제 생성 중 오류가 발생했습니다.\n다시 한 번 시도해주세요.');
      setIsJsonFormat(false);
      setParsedQuestions([]);
      // questionText는 유지
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
      
      // JSON 파싱 시도
      parseQuestionJson(res.data.result);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "문제 생성 오류");
    } finally {
      setLoadingQ(false);
    }
  };

  // 파일에서 직접 문제 생성 함수 수정
  const handleGenerateQuestionFromFile = async () => {
    if (!file || !user) return alert("파일 선택 및 로그인 필요");
    setLoadingQ(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("generation_type", `문제 생성_${aiQuestionPromptKeys_Korean[qTab]}`);
      fd.append("field", qField);
      fd.append("level", qLevel);
      fd.append("question_count", String(qCount));

      if (qTab === 0) {
        fd.append("choice_count", String(optCount));
        fd.append("choice_format", optionFormat);
      }
      if (qTab === 1) fd.append("array_choice_count", String(optCount));
      if (qTab === 2) fd.append("blank_count", String(blankCount));

      const res = await aiQuestionAPI.generateQuestionsFromFile(fd);
      setQuestionText(res.data.result);
      
      // JSON 파싱 시도
      parseQuestionJson(res.data.result);
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.detail || "문제 생성 오류");
    } finally {
      setLoadingQ(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!user || !fileName) return;
    
    // 모달 열기
    setSaveDialogType('question');
    setOpenSaveNameDialog(true);
  };

  // 실제 문제 저장 함수
  const handleConfirmSaveQuestion = async (customName: string) => {
    if (!user || !fileName) return;
    
    try {
      await questionAPI.saveQuestion({
        userId: user.id,
        fileName: fileName,  // 업로드한 파일명
        questionName: customName,  // 사용자가 입력한 문제 이름
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

  const handleDownloadSummary = async () => {
    try {
      setDownloadingPdf(true);
      await downloadAsPDF(
        summaryText,
        fileName || "result",
        dbSummaryTypeKorean // "기본 요약", "핵심 요약" 등으로 전달됨
      );
    } catch (error) {
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadQuestion = async () => {
    try {
      setDownloadingPdf(true);
      await downloadAsPDF(
        questionText,
        fileName || "result",
        aiQuestionPromptKeys_Korean[qTab] // "n지선다형", "순서배열형" 등으로 전달됨
      );
    } catch (error) {
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 저장된 요약 선택 핸들러
  const handleSelectSavedSummary = (summary: SummaryItem) => {
    if (summaryText && summaryText.trim() !== '') {
      // 현재 작성 중인 요약이 있으면 확인창 표시
      setSelectedSummary(summary);
      setOpenConfirmDialog(true);
    } else {
      // 없으면 바로 적용
      applySavedSummary(summary);
    }
  };

  // 선택한 저장된 요약을 현재 요약으로 적용
  const applySavedSummary = (summary: SummaryItem) => {
    setSummaryText(summary.summary_text);
    setFileName(summary.file_name);
    
    // 요약 타입도 업데이트
    const typeIndex = dbSummaryPromptKeys_Korean.indexOf(summary.summary_type as DbSummaryPromptKey_Korean);
    if (typeIndex !== -1) {
      setSumTab(typeIndex);
      setAiSummaryType(aiSummaryPromptKeys[typeIndex]);
      setDbSummaryTypeKorean(dbSummaryPromptKeys_Korean[typeIndex]);
    }
    
    setSelectedSummary(null);
  };

  // 저장된 요약으로 변경 확인
  const handleConfirmChangeSummary = () => {
    if (selectedSummary) {
      applySavedSummary(selectedSummary);
    }
    setOpenConfirmDialog(false);
  };

  return (
    <>
      <Header />
      <PageNavigator />

      <Box
        sx={{
          minHeight: "100vh",
          p: 4,
          pt: "40px",
          background: (theme) =>
            theme.palette.mode === "light"
              ? "linear-gradient(145deg, #ffffff 0%, #f4f7fa 100%)"
              : "linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)",
          position: "relative",
        }}
      >
        {/* PDF 다운로드 중 로딩 오버레이 */}
        {downloadingPdf && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1500,
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              PDF 생성 중...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              잠시만 기다려 주세요
            </Typography>
          </Box>
        )}
        
        <Container maxWidth="md">
          <Typography variant="h1" fontWeight="500" align="center" mb={3}>
            문서 업로드
          </Typography>

          {/* Upload Box */}
          <Box
            component="label"
            sx={{
              display: "block",
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              p: 6,
              textAlign: "center",
              mb: 4,
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#1976d2",
                backgroundColor: "rgba(25, 118, 210, 0.04)",
              },
            }}
          >
            <Stack spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "#1976d2",
                  "&:hover": { bgcolor: "#1565c0" },
                }}
              >
                <CloudUpload sx={{ fontSize: 40 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" gutterBottom>
                  파일 선택
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  여기를 클릭하거나 파일을 드래그하세요
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  파일명에는 특수기호가 . , - _ ( ) [ ] % 만 허용됩니다.
                </Typography>
              </Box>
              {fileName && (
                <Paper elevation={1} sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                  <Typography variant="body2" fontWeight="medium">
                    📄 {fileName}
                  </Typography>
                </Paper>
              )}
              {fileNameError && (
                <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
                  {fileNameError}
                </Alert>
              )}
            </Stack>
            <input hidden type="file" onChange={handleFileUpload} />
          </Box>

          {/* Main Tabs */}
          <Box mb={5} display="flex" justifyContent="center">
            <Tabs
              value={mainTab}
              onChange={(_, v) => setMainTab(v)}
              sx={{
                minHeight: 48,
                bgcolor: "white",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "grey.300",
                boxShadow: 1,
                "& .MuiTabs-indicator": {
                  height: "100%",
                  bgcolor: "primary.main",
                  borderRadius: 2,
                  zIndex: 0,
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  zIndex: 1,
                  color: "text.secondary",
                  "&.Mui-selected": { color: "white" },
                },
              }}
            >
              <Tab label="요약 생성" value="summary" sx={{ minWidth: 120 }} />
              <Tab label="문제 생성" value="problem" sx={{ minWidth: 120 }} />
            </Tabs>
          </Box>

          {mainTab === "summary" ? (
            <>
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

              {/* Generate Summary */}
              <Stack direction="row" justifyContent="center" sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleGenerateSummary}
                  disabled={loadingSum}
                  size="large"
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    background: (theme) =>
                      theme.palette.mode === "light"
                        ? "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)"
                        : "linear-gradient(45deg, #1565C0 30%, #0277BD 90%)",
                  }}
                >
                  ✨ 요약 생성
                </Button>
              </Stack>
              {loadingSum && (
                <LinearProgress sx={{ mb: 3, height: 6, borderRadius: 1 }} />
              )}

              {/* Summary Result */}
              {summaryText && (
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    mb: 3,
                    borderRadius: 3,
                    background: (theme) =>
                      theme.palette.mode === "light"
                        ? "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)"
                        : "linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)",
                  }}
                >
                  <Stack spacing={3}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                        pb: 2,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: "success.main",
                          color: "success.contrastText",
                        }}
                      >
                        📄
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, flexGrow: 1 }}
                      >
                        요약 결과
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleDownloadSummary}
                      >
                        📄 PDF 다운로드
                      </Button>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      minRows={8}
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                    <Stack
                      direction="row"
                      justifyContent="center"
                      spacing={2}
                      sx={{ pt: 1 }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleSaveSummary}
                        sx={{ borderRadius: 2.5, px: 3 }}
                      >
                        💾 요약 저장
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => setMainTab("problem")}
                        sx={{ borderRadius: 2.5, px: 3 }}
                      >
                        🎯 문제 생성
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              <Snackbar
                open={openSumDoneSnackbar}
                onClose={() => setOpenSumDoneSnackbar(false)}
                autoHideDuration={10000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  severity="success"
                  sx={{
                    minWidth: 380,
                    maxWidth: 450,
                    borderRadius: 2.5,
                    boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
                    display: "flex",
                    alignItems: "center",
                    py: 1.5,
                    px: 2.5,
                  }}
                  action={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/mypage')}
                        sx={{ 
                          bgcolor: '#34C759',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.813rem',
                          borderRadius: 1.5,
                          px: 2,
                          py: 0.5,
                          minWidth: 'auto',
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: '#28a745',
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(52, 199, 89, 0.3)',
                        }}
                      >
                        마이페이지
                      </Button>
                      <IconButton
                        size="small"
                        aria-label="close"
                        sx={{
                          color: 'text.secondary',
                          p: 0.5,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                        onClick={() => setOpenSumDoneSnackbar(false)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" fontWeight={600}>
                      ✅ 요약 저장이 완료되었습니다!
                    </Typography>
                  </Box>
                </Alert>
              </Snackbar>
            </>
          ) : (
            <>
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
                openSummaryDialog={openSummaryDialog}
                setOpenSummaryDialog={setOpenSummaryDialog}
                openSavedSummariesDialog={() => setOpenSavedSummariesDialog(true)}
                hasSummaryText={!!summaryText && summaryText.trim() !== ''}
              />
              
              {/* Generate Question Buttons - 두 가지 방식 제공 */}
              <Box textAlign="center" mb={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  justifyContent="center"
                  sx={{ mb: 2 }}
                >
                  {/* 요약 기반 문제 생성 버튼 */}
                  <Button
                    variant="contained"
                    onClick={handleGenerateQuestion}
                    disabled={loadingQ || !summaryText}
                    size="large"
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      background: (theme) =>
                        theme.palette.mode === "light"
                          ? "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)"
                          : "linear-gradient(45deg, #1565C0 30%, #0277BD 90%)",
                    }}
                  >
                    📝 요약본으로 문제 생성
                  </Button>

                  {/* 파일 기반 문제 생성 버튼 */}
                  <Button
                    variant="contained"
                    onClick={handleGenerateQuestionFromFile}
                    disabled={loadingQ || !file}
                    size="large"
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      background: (theme) =>
                        theme.palette.mode === "light"
                          ? "linear-gradient(45deg, #FF9800 30%, #FFCA28 90%)"
                          : "linear-gradient(45deg, #F57C00 30%, #FFB300 90%)",
                    }}
                  >
                    📄 파일로 바로 문제 생성
                  </Button>
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, fontStyle: "italic" }}
                >
                  * 요약본이 있으면 요약본을 기반으로, 없으면 파일에서 바로 문제를 생성할 수 있습니다.
                </Typography>
              </Box>
              {loadingQ && <LinearProgress sx={{ mb: 2, height: 6, borderRadius: 1 }} />}

              {/* Question Result */}
              {questionText && (
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    mb: 3,
                    borderRadius: 3,
                    background: (theme) =>
                      theme.palette.mode === "light"
                        ? "linear-gradient(145deg, #e8f0fe 0%, #f0f4ff 100%)"
                        : "linear-gradient(145deg, #2d3440 0%, #1a1f2a 100%)",
                  }}
                >
                  <Stack spacing={3}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                        pb: 2,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: "info.main",
                          color: "info.contrastText",
                        }}
                      >
                        📝
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, flexGrow: 1 }}
                      >
                        생성된 문제
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleDownloadQuestion}
                      >
                        📄 PDF 다운로드
                      </Button>
                    </Box>

                    {/* JSON 형식일 때만 파싱된 결과를 보여줌 */}
                    {isJsonFormat && parsedQuestions.length > 0 ? (
                      <QuestionRenderer questions={parsedQuestions} />
                    ) : (
                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          문제 생성 중 오류가 발생했습니다.
                        </Typography>
                        <Typography variant="body2">
                          문제를 불러올 수 없습니다.<br />
                          문제를 다시 생성해 주세요.
                        </Typography>
                      </Alert>
                    )}

                    <Stack 
                      direction="row"
                      justifyContent="center" 
                      spacing={2}
                      sx={{ pt: 1 }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleSaveQuestion}
                        disabled={!isJsonFormat || parsedQuestions.length === 0}
                        sx={{ borderRadius: 2.5, px: 3 }}
                      >
                        💾 문제 저장
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              <Snackbar
                open={openQDoneSnackbar}
                onClose={() => setOpenQDoneSnackbar(false)}
                autoHideDuration={10000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  severity="success"
                  sx={{
                    minWidth: 380,
                    maxWidth: 450,
                    borderRadius: 2.5,
                    boxShadow: '0 4px 20px rgba(46, 125, 50, 0.15)',
                    display: "flex",
                    alignItems: "center",
                    py: 1.5,
                    px: 2.5,
                  }}
                  action={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/mypage')}
                        sx={{ 
                          bgcolor: '#34C759',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.813rem',
                          borderRadius: 1.5,
                          px: 2,
                          py: 0.5,
                          minWidth: 'auto',
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: '#28a745',
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(52, 199, 89, 0.3)',
                        }}
                      >
                        마이페이지
                      </Button>
                      <IconButton
                        size="small"
                        aria-label="close"
                        sx={{
                          color: 'text.secondary',
                          p: 0.5,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                        onClick={() => setOpenQDoneSnackbar(false)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" fontWeight={600}>
                      문제 저장이 완료되었습니다!
                    </Typography>
                  </Box>
                </Alert>
              </Snackbar>
            </>
          )}

          {/* 파일명 입력 모달 추가 */}
          <SaveNameDialog
            open={openSaveNameDialog}
            onClose={() => setOpenSaveNameDialog(false)}
            onSave={saveDialogType === 'summary' ? handleConfirmSaveSummary : handleConfirmSaveQuestion}
            defaultName={fileName || 'untitled'}
            title={saveDialogType === 'summary' ? '요약 저장' : '문제 저장'}
            type={saveDialogType}
          />

          {/* 기존 Summary Dialog */}
          <Dialog
            open={openSummaryDialog}
            onClose={() => setOpenSummaryDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>요약 내용 보기</DialogTitle>
            <DialogContent dividers>
              <Typography component="pre" sx={{ whiteSpace: "pre-wrap" }}>
                {summaryText || "먼저 요약을 생성해 주세요."}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenSummaryDialog(false)}>닫기</Button>
            </DialogActions>
          </Dialog>

          {/* 저장된 요약 목록 다이얼로그 */}
          <SavedSummaryDialog
            open={openSavedSummariesDialog}
            onClose={() => setOpenSavedSummariesDialog(false)}
            onSelectSummary={handleSelectSavedSummary}
          />

          {/* 요약 변경 확인 다이얼로그 */}
          <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
            <DialogTitle>요약본 변경 확인</DialogTitle>
            <DialogContent>
              <Typography>
                현재 생성된 요약본이 있습니다. 저장된 요약본으로 변경하시겠습니까?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                변경하면 현재 작성된 요약본은 사라집니다.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenConfirmDialog(false)}>취소</Button>
              <Button onClick={handleConfirmChangeSummary} color="primary" variant="contained">
                변경
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </>
  );
}