import React, { useState } from "react";
import {
  Container,
  Button,
  Paper,
  Snackbar,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
  Drawer,
  Checkbox,
  Badge,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  CheckCircle,
  Create,
  LibraryBooks,
  CheckCircleOutline,
  Close,
  Check,
  Star,
  StarBorder,
  CompareArrows,
  ContentCopy,
  History,
  Visibility,
} from "@mui/icons-material";
import Header from "../components/Header";
import PageNavigator from "../components/common/PageNavigator";
import SummarySettings from "../components/upload/SummarySettings";
import ProblemSettings from "../components/upload/ProblemSettings";
import QuestionRenderer from "../components/upload/QuestionRenderer";
import { downloadAsPDF } from "../utils/pdfUtils";
import { aiQuestionPromptKeys_Korean } from "../constants/upload";
import SaveNameDialog from "../components/upload/SaveNameDialog";
import SavedSummaryDialog from "../components/upload/SavedSummaryDialog";
import { SummaryItem } from "../services/api";
import FileUploadArea from "../components/upload/FileUploadArea";
import ResultDisplay from "../components/upload/ResultDisplay";
import { ModeSelection, QuestionSourceSelection } from "../components/upload/ModeSelection";
import ErrorDisplay from "../components/upload/ErrorDisplay";
import { useUploadState } from "../hooks/useUploadState";
import { useUploadHandlers } from "../hooks/useUploadHandlers";
import { DbSummaryPromptKey_Korean } from "../types/upload";
import { useNavigate } from "react-router-dom";
import NavigationBlocker from "../components/upload/NavigationBlocker";

// 단계 애니메이션
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

// 파티클 로딩 컴포넌트
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
        background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
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
        <Create sx={{ fontSize: 60, color: "white" }} />
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
        잠시만 기다려 주세요.
      </Typography>
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

// 🎯 버전 타입 정의
interface ContentVersion {
  id: string;
  text: string;
  timestamp: Date;
  settings: {
    type: string;
    field: string;
    level: string;
  };
  favorite: boolean;
}

// 🎯 버전 비교 팝업 컴포넌트
const VersionCompareDialog = ({
  open,
  onClose,
  versions,
  currentVersion,
}: {
  open: boolean;
  onClose: () => void;
  versions: ContentVersion[];
  currentVersion: ContentVersion;
}) => {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([currentVersion.id]);

  const handleToggleVersion = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 3) {
        return [...prev, versionId];
      }
      return prev;
    });
  };

  const selectedVersionsList = versions.filter(v => selectedVersions.includes(v.id));
  const colors = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={700}>
            버전 비교
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, minHeight: 500 }}>
          {/* 좌측 버전 선택 */}
          <Paper elevation={2} sx={{ width: 280, p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              비교할 버전 선택 (최대 3개)
            </Typography>
            <List dense>
              {versions.map((version, index) => {
                const isSelected = selectedVersions.includes(version.id);
                const isDisabled = !isSelected && selectedVersions.length >= 3;
                
                return (
                  <ListItem
                    key={version.id}
                    disablePadding
                    secondaryAction={
                      version.favorite && <Star fontSize="small" sx={{ color: 'warning.main' }} />
                    }
                  >
                    <ListItemButton
                      selected={isSelected}
                      disabled={isDisabled}
                      onClick={() => handleToggleVersion(version.id)}
                    >
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        primary={`버전 ${index + 1}`}
                        secondary={
                          <Typography variant="caption" display="block">
                            {version.timestamp.toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Paper>

          {/* 우측 비교 영역 */}
          <Box sx={{ flex: 1 }}>
            {selectedVersionsList.length === 0 ? (
              <Paper 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.50'
                }}
              >
                <Stack spacing={2} alignItems="center">
                  <CompareArrows sx={{ fontSize: 64, color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.secondary">
                    비교할 버전을 선택하세요
                  </Typography>
                </Stack>
              </Paper>
            ) : (
              <Stack direction="row" spacing={2} sx={{ height: '100%' }}>
                {selectedVersionsList.map((version, index) => {
                  const versionIndex = versions.indexOf(version);
                  const borderColor = colors[index % colors.length];

                  return (
                    <Paper
                      key={version.id}
                      elevation={2}
                      sx={{
                        flex: 1,
                        p: 3,
                        border: 3,
                        borderColor,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <Stack spacing={2} height="100%">
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                            <Typography variant="h6" fontWeight={600}>
                              버전 {versionIndex + 1}
                            </Typography>
                            {version.favorite && (
                              <Star fontSize="small" sx={{ color: 'warning.main' }} />
                            )}
                            {version.id === currentVersion.id && (
                              <Chip label="현재" size="small" color="primary" />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {version.timestamp.toLocaleString('ko-KR')}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={1}>
                            <Chip label={version.settings.type} size="small" variant="outlined" />
                            <Chip label={version.settings.level} size="small" variant="outlined" />
                          </Stack>
                        </Box>

                        <Divider />

                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.8,
                            }}
                          >
                            {version.text}
                          </Typography>
                        </Box>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopy />}
                          onClick={() => navigator.clipboard.writeText(version.text)}
                        >
                          복사
                        </Button>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 🎯 좌측 버전 사이드바 컴포넌트
const VersionSidebar = ({
  versions,
  currentVersion,
  onSelectVersion,
  onToggleFavorite,
  onCompare,
}: {
  versions: ContentVersion[];
  currentVersion: ContentVersion;
  onSelectVersion: (version: ContentVersion) => void;
  onToggleFavorite: (versionId: string) => void;
  onCompare: () => void;
}) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: 280, 
        height: 'fit-content',
        position: 'sticky',
        top: 80,
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <History color="primary" />
            <Typography variant="h6" fontWeight={700}>
              버전 기록
            </Typography>
          </Stack>
          <Badge badgeContent={versions.length} color="primary" max={99}>
            <Box />
          </Badge>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          총 {versions.length}개의 버전
        </Typography>
      </Box>

      <List sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
        {versions.map((version, index) => {
          const isActive = version.id === currentVersion.id;
          
          return (
            <ListItem
              key={version.id}
              disablePadding
              sx={{
                bgcolor: isActive ? 'primary.50' : 'transparent',
                borderLeft: isActive ? 3 : 0,
                borderColor: 'primary.main',
              }}
            >
              <ListItemButton
                selected={isActive}
                onClick={() => onSelectVersion(version)}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        버전 {index + 1}
                      </Typography>
                      {isActive && (
                        <Chip label="현재" size="small" color="primary" sx={{ height: 18 }} />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5} mt={0.5}>
                      <Typography variant="caption" display="block">
                        {version.timestamp.toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Chip 
                          label={version.settings.level} 
                          size="small" 
                          sx={{ height: 16, fontSize: '0.65rem' }} 
                        />
                      </Stack>
                    </Stack>
                  }
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(version.id);
                  }}
                >
                  {version.favorite ? (
                    <Star fontSize="small" sx={{ color: 'warning.main' }} />
                  ) : (
                    <StarBorder fontSize="small" />
                  )}
                </IconButton>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {versions.length > 1 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CompareArrows />}
            onClick={onCompare}
          >
            버전 비교하기
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default function UploadPage() {
  const state = useUploadState();
  const handlers = useUploadHandlers(state);
  const navigate = useNavigate();

  // 🎯 버전 관리 상태
  const [summaryVersions, setSummaryVersions] = useState<ContentVersion[]>([]);
  const [questionVersions, setQuestionVersions] = useState<ContentVersion[]>([]);
  const [currentSummaryVersion, setCurrentSummaryVersion] = useState<ContentVersion | null>(null);
  const [currentQuestionVersion, setCurrentQuestionVersion] = useState<ContentVersion | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareType, setCompareType] = useState<'summary' | 'question'>('summary');

  const isGenerating = state.loadingSum || state.loadingQ;

  // 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!handlers.validateFile(f)) {
      e.target.value = '';
      return;
    }
    state.setFile(f);
    state.setFileName(f.name);
    handlers.markStepCompleted(0);
    state.setActiveStep(1);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) state.setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX: x, clientY: y } = e;
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) state.setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    state.setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    if (!handlers.validateFile(droppedFile)) return;
    state.setFile(droppedFile);
    state.setFileName(droppedFile.name);
    handlers.markStepCompleted(0);
    state.setActiveStep(1);
  };

  const handleStepClick = (step: number) => {
    if (isGenerating) return;
    if (state.completedSteps.has(step)) {
      state.setActiveStep(step);
    }
  };

  // 🎯 요약/문제 생성 완료 후 버전 추가
  const addSummaryVersion = (text: string) => {
    const newVersion: ContentVersion = {
      id: `summary-${Date.now()}`,
      text,
      timestamp: new Date(),
      settings: {
        type: state.dbSummaryTypeKorean,
        field: state.sumField,
        level: state.sumLevel,
      },
      favorite: false,
    };
    
    setSummaryVersions(prev => [...prev, newVersion]);
    setCurrentSummaryVersion(newVersion);
  };

  const addQuestionVersion = (text: string) => {
    const newVersion: ContentVersion = {
      id: `question-${Date.now()}`,
      text,
      timestamp: new Date(),
      settings: {
        type: aiQuestionPromptKeys_Korean[state.qTab],
        field: state.qField,
        level: state.qLevel,
      },
      favorite: false,
    };
    
    setQuestionVersions(prev => [...prev, newVersion]);
    setCurrentQuestionVersion(newVersion);
  };

  const handleNext = () => {
    if (state.mode === 'summary') {
      if (state.activeStep === 1 && !state.summaryText) { 
        handlers.markStepCompleted(1);
        state.setActiveStep(2); 
        handlers.handleGenerateSummary(); 
      }
      else if (state.activeStep === 3 && !state.questionText) { 
        handlers.markStepCompleted(3);
        state.setActiveStep(4); 
        handlers.handleGenerateQuestion(); 
      }
      else state.setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else if (state.mode === 'question' && state.questionSource === 'upload') {
      if (state.activeStep === 1 && !state.questionText) { 
        handlers.markStepCompleted(1);
        state.setActiveStep(2); 
        handlers.handleGenerateQuestionFromFile(); 
      }
      else state.setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else if (state.mode === 'question' && state.questionSource === 'saved') {
      if (state.activeStep === 1 && !state.questionText) { 
        handlers.markStepCompleted(1);
        state.setActiveStep(2); 
        handlers.handleGenerateQuestion(); 
      }
      else state.setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    if (state.activeStep === 0) {
      state.setMode(null);
      state.setQuestionSource(null);
      state.setFile(null);
      state.setFileName(null);
      state.setSummaryText('');
      state.setQuestionText('');
      state.setIsSummarySelected(false);
    } else {
      if (state.mode === 'summary' && state.activeStep === 2) state.setSummaryText('');
      if (state.mode === 'summary' && state.activeStep === 4) { state.setQuestionText(''); state.setParsedQuestions([]); state.setIsJsonFormat(false); }
      if (state.mode === 'question' && state.questionSource === 'upload' && state.activeStep === 2) { state.setQuestionText(''); state.setParsedQuestions([]); state.setIsJsonFormat(false); }
      if (state.mode === 'question' && state.questionSource === 'saved' && state.activeStep === 2) { state.setQuestionText(''); state.setParsedQuestions([]); state.setIsJsonFormat(false); }
      state.setActiveStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleRegenerate = (type: 'summary' | 'question') => {
    if (type === 'summary') { 
      state.setSummaryText(''); 
      state.setSummaryError(false);
      state.setActiveStep(2);
      handlers.handleGenerateSummary();
    }
    else {
      state.setQuestionText(''); 
      state.setParsedQuestions([]); 
      state.setIsJsonFormat(false);
      state.setQuestionError(false);
      
      if (state.mode === 'summary') {
        state.setActiveStep(4);
        handlers.handleGenerateQuestion();
      } else if (state.mode === 'question' && state.questionSource === 'upload') {
        state.setActiveStep(2);
        handlers.handleGenerateQuestionFromFile();
      } else if (state.mode === 'question' && state.questionSource === 'saved') {
        state.setActiveStep(2);
        handlers.handleGenerateQuestion();
      }
    }
  };

  // 🎯 요약/문제 생성 성공 시 버전 추가 (useEffect 대신 직접 호출)
  React.useEffect(() => {
    if (state.summaryText && !state.loadingSum && !state.summaryError) {
      // 이미 추가된 버전인지 확인
      const exists = summaryVersions.some(v => v.text === state.summaryText);
      if (!exists) {
        addSummaryVersion(state.summaryText);
      }
    }
  }, [state.summaryText, state.loadingSum, state.summaryError]);

  React.useEffect(() => {
    if (state.questionText && !state.loadingQ && !state.questionError && state.isJsonFormat) {
      const exists = questionVersions.some(v => v.text === state.questionText);
      if (!exists) {
        addQuestionVersion(state.questionText);
      }
    }
  }, [state.questionText, state.loadingQ, state.questionError, state.isJsonFormat]);

  const handleRetrySummary = () => { 
    state.setSummaryError(false); 
    state.setSummaryText(''); 
    state.setActiveStep(state.summaryErrorType === 'short_text' ? 0 : 1);
    if (state.summaryErrorType === 'short_text') {
      state.setFile(null);
      state.setFileName(null);
    }
  };
  
  const handleRetryQuestion = () => { 
    state.setQuestionError(false); 
    state.setQuestionText(''); 
    state.setParsedQuestions([]); 
    state.setIsJsonFormat(false); 
    
    if (state.questionErrorType === 'short_text') {
      state.setActiveStep(0);
      state.setFile(null);
      state.setFileName(null);
    } else {
      state.setActiveStep(state.mode === 'summary' ? 3 : 1);
    }
  };

  const handleModeSelect = (selectedMode: 'summary' | 'question' | null) => { 
    state.setMode(selectedMode); 
    if (selectedMode === 'summary') {
      state.setActiveStep(0);
      state.setCompletedSteps(new Set());
    }
  };
  
  const handleQuestionSourceSelect = (source: 'upload' | 'saved' | null) => { 
    state.setQuestionSource(source); 
    if (source === 'upload') {
      state.setActiveStep(0);
      state.setCompletedSteps(new Set());
    } else if (source === 'saved') { 
      state.setIsSummarySelected(false); 
      state.setActiveStep(0);
      state.setCompletedSteps(new Set());
    } 
  };
  
  const handleSelectSavedSummary = (summary: SummaryItem) => { 
    state.setSummaryText(summary.summary_text); 
    state.setFileName(summary.file_name); 
    state.setDbSummaryTypeKorean(summary.summary_type as DbSummaryPromptKey_Korean); 
    state.setIsSummarySelected(true);
    handlers.markStepCompleted(0);
    state.setActiveStep(0); 
    state.setOpenSavedSummariesDialog(false); 
  };
  
  const handleSave = (type: 'summary' | 'question') => { state.setSaveDialogType(type); state.setOpenSaveNameDialog(true); };

  // 🎯 버전 관리 핸들러
  const handleSelectSummaryVersion = (version: ContentVersion) => {
    setCurrentSummaryVersion(version);
    state.setSummaryText(version.text);
  };

  const handleSelectQuestionVersion = (version: ContentVersion) => {
    setCurrentQuestionVersion(version);
    state.setQuestionText(version.text);
  };

  const handleToggleFavorite = (type: 'summary' | 'question', versionId: string) => {
    if (type === 'summary') {
      setSummaryVersions(prev =>
        prev.map(v =>
          v.id === versionId ? { ...v, favorite: !v.favorite } : v
        )
      );
    } else {
      setQuestionVersions(prev =>
        prev.map(v =>
          v.id === versionId ? { ...v, favorite: !v.favorite } : v
        )
      );
    }
  };

  const handleOpenCompare = (type: 'summary' | 'question') => {
    setCompareType(type);
    setCompareDialogOpen(true);
  };

  const getSteps = () => {
    if (state.mode === 'summary') return ["파일 업로드", "요약 설정", "요약 생성", "문제 설정", "문제 생성"];
    else if (state.mode === 'question') {
      if (state.questionSource === 'upload') return ["파일 업로드", "문제 설정", "문제 생성"];
      else if (state.questionSource === 'saved') return ["요약본 선택", "문제 설정", "문제 생성"];
    }
    return ["방법 선택"];
  };
  const steps = getSteps();

  const renderStep = (step: number) => {
    if (state.mode === 'summary') {
      if (step === 0) return <FileUploadArea file={state.file} fileName={state.fileName} isDragging={state.isDragging} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onFileChange={handleFileUpload} />;
      if (step === 1) return (<Slide direction="left" in timeout={500}><Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)" }}><Typography variant="h3" gutterBottom fontWeight={700} mb={4}>⚙️ 요약 설정</Typography><SummarySettings sumTab={state.sumTab} setSumTab={state.setSumTab} sumField={state.sumField} setSumField={state.setSumField} sumLevel={state.sumLevel} setSumLevel={state.setSumLevel} sumSentCount={state.sumSentCount} setSumSentCount={state.setSumSentCount} sumTopicCount={state.sumTopicCount} setSumTopicCount={state.setSumTopicCount} sumKeywordCount={state.sumKeywordCount} setSumKeywordCount={state.setSumKeywordCount} keywords={state.keywords} setKeywords={state.setKeywords} setAiSummaryType={state.setAiSummaryType} setDbSummaryTypeKorean={state.setDbSummaryTypeKorean} /></Paper></Slide>);
      if (step === 2) {
        return state.loadingSum ? (
          <ParticleLoading message="문서를 요약하고 있습니다" />
        ) : state.summaryError ? (
          <ErrorDisplay 
            errorMessage={state.summaryErrorMessage} 
            errorType={state.summaryErrorType} 
            onRetry={handleRetrySummary} 
          />
        ) : (state.summaryText !== null && state.summaryText !== undefined) ? (
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* 좌측 버전 사이드바 */}
            {summaryVersions.length > 0 && currentSummaryVersion && (
              <VersionSidebar
                versions={summaryVersions}
                currentVersion={currentSummaryVersion}
                onSelectVersion={handleSelectSummaryVersion}
                onToggleFavorite={(id) => handleToggleFavorite('summary', id)}
                onCompare={() => handleOpenCompare('summary')}
              />
            )}
            
            {/* 우측 메인 컨텐츠 */}
            <Box sx={{ flex: 1 }}>
              <ResultDisplay
                type="summary"
                text={state.summaryText}
                fileName={state.fileName || "summary"}
                contentType={state.dbSummaryTypeKorean}
                onTextChange={state.setSummaryText}
                onSave={() => handleSave('summary')}
                onDownload={() => downloadAsPDF(state.summaryText, state.fileName || "summary", state.dbSummaryTypeKorean)}
                onRegenerate={() => handleRegenerate('summary')}
                disabled={isGenerating}
              />
            </Box>
          </Box>
        ) : null;
      }
      if (step === 3) return (<Slide direction="left" in timeout={500}><Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)" }}><Typography variant="h3" gutterBottom fontWeight={700} mb={4}>⚙️ 문제 설정</Typography><ProblemSettings qTab={state.qTab} setQTab={state.setQTab} qField={state.qField} setQField={state.setQField} qLevel={state.qLevel} setQLevel={state.setQLevel} qCount={state.qCount} setQCount={state.setQCount} optCount={state.optCount} setOptCount={state.setOptCount} blankCount={state.blankCount} setBlankCount={state.setBlankCount} optionFormat={state.optionFormat} setOptionFormat={state.setOptionFormat} summaryText={state.summaryText} openSummaryDialog={state.openSummaryDialog} setOpenSummaryDialog={state.setOpenSummaryDialog} openSavedSummariesDialog={() => {}} hasSummaryText={!!state.summaryText} showSavedSummaryButton={false} /></Paper></Slide>);
      if (step === 4) {
        return state.loadingQ ? (
          <ParticleLoading message="문제를 생성하고 있습니다" />
        ) : state.questionError ? (
          <ErrorDisplay 
            errorMessage={state.questionErrorMessage} 
            errorType={state.questionErrorType} 
            onRetry={handleRetryQuestion} 
          />
        ) : state.questionText && state.isJsonFormat ? (
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* 좌측 버전 사이드바 */}
            {questionVersions.length > 0 && currentQuestionVersion && (
              <VersionSidebar
                versions={questionVersions}
                currentVersion={currentQuestionVersion}
                onSelectVersion={handleSelectQuestionVersion}
                onToggleFavorite={(id) => handleToggleFavorite('question', id)}
                onCompare={() => handleOpenCompare('question')}
              />
            )}
            
            {/* 우측 메인 컨텐츠 */}
            <Box sx={{ flex: 1 }}>
              <ResultDisplay
                type="question"
                text={state.questionText}
                isJsonFormat={state.isJsonFormat}
                parsedQuestions={state.parsedQuestions}
                fileName={state.fileName || "questions"}
                contentType={aiQuestionPromptKeys_Korean[state.qTab]}
                onSave={() => handleSave('question')}
                onDownload={() => downloadAsPDF(state.questionText, state.fileName || "questions", aiQuestionPromptKeys_Korean[state.qTab])}
                onRegenerate={() => handleRegenerate('question')}
                disabled={isGenerating}
              />
            </Box>
          </Box>
        ) : null;
      }
    }
    
    if (state.mode === 'question' && state.questionSource === 'upload') {
      if (step === 0) return <FileUploadArea file={state.file} fileName={state.fileName} isDragging={state.isDragging} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onFileChange={handleFileUpload} />;
      if (step === 1) return (<Slide direction="left" in timeout={500}><Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)" }}><Typography variant="h3" gutterBottom fontWeight={700} mb={4}>⚙️ 문제 설정</Typography><ProblemSettings qTab={state.qTab} setQTab={state.setQTab} qField={state.qField} setQField={state.setQField} qLevel={state.qLevel} setQLevel={state.setQLevel} qCount={state.qCount} setQCount={state.setQCount} optCount={state.optCount} setOptCount={state.setOptCount} blankCount={state.blankCount} setBlankCount={state.setBlankCount} optionFormat={state.optionFormat} setOptionFormat={state.setOptionFormat} summaryText="" openSummaryDialog={false} setOpenSummaryDialog={() => {}} openSavedSummariesDialog={() => {}} hasSummaryText={false} /></Paper></Slide>);
      if (step === 2) {
        return state.loadingQ ? (
          <ParticleLoading message="문제를 생성하고 있습니다" />
        ) : state.questionError ? (
          <ErrorDisplay 
            errorMessage={state.questionErrorMessage} 
            errorType={state.questionErrorType} 
            onRetry={handleRetryQuestion} 
          />
        ) : state.questionText && state.isJsonFormat ? (
          <Box sx={{ display: 'flex', gap: 3 }}>
            {questionVersions.length > 0 && currentQuestionVersion && (
              <VersionSidebar
                versions={questionVersions}
                currentVersion={currentQuestionVersion}
                onSelectVersion={handleSelectQuestionVersion}
                onToggleFavorite={(id) => handleToggleFavorite('question', id)}
                onCompare={() => handleOpenCompare('question')}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <ResultDisplay
                type="question"
                text={state.questionText}
                isJsonFormat={state.isJsonFormat}
                parsedQuestions={state.parsedQuestions}
                fileName={state.fileName || "questions"}
                contentType={aiQuestionPromptKeys_Korean[state.qTab]}
                onSave={() => handleSave('question')}
                onDownload={() => downloadAsPDF(state.questionText, state.fileName || "questions", aiQuestionPromptKeys_Korean[state.qTab])}
                onRegenerate={() => handleRegenerate('question')}
                disabled={isGenerating}
              />
            </Box>
          </Box>
        ) : null;
      }
    }
    
    if (state.mode === 'question' && state.questionSource === 'saved') {
      if (step === 0) return (<Fade in timeout={500}><Paper elevation={6} sx={{ p: 6, borderRadius: 4, background: "#ffffff", textAlign: "center" }}><Avatar sx={{ width: 120, height: 120, margin: "0 auto 24px", background: state.isSummarySelected ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>{state.isSummarySelected ? <CheckCircle sx={{ fontSize: 60 }} /> : <LibraryBooks sx={{ fontSize: 60 }} />}</Avatar><Typography variant="h3" gutterBottom fontWeight={700}>{state.isSummarySelected ? "요약본 선택 완료!" : "요약본을 선택해주세요"}</Typography>{state.isSummarySelected ? (<><Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>선택한 요약본: {state.fileName || "untitled"}</Typography><Paper sx={{ p: 3, maxHeight: 300, overflow: "auto", bgcolor: "#f8fafc", borderRadius: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}><Typography variant="body1" sx={{ whiteSpace: "pre-wrap", textAlign: "left" }}>{state.summaryText}</Typography></Paper><Button variant="outlined" startIcon={<LibraryBooks />} onClick={() => state.setOpenSavedSummariesDialog(true)} sx={{ borderRadius: 2, px: 3, borderWidth: 2, borderColor: "#10b981", color: "#10b981", "&:hover": { borderWidth: 2, borderColor: "#059669", bgcolor: "rgba(16, 185, 129, 0.04)" } }}>요약본 다시 선택하기</Button></>) : (<><Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>아래 버튼을 클릭하여 저장된 요약본을 선택하세요</Typography><Button variant="contained" size="large" startIcon={<LibraryBooks />} onClick={() => state.setOpenSavedSummariesDialog(true)} sx={{ borderRadius: 3, px: 5, py: 1.5, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", "&:hover": { background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)" } }}>요약본 선택하기</Button></>)}</Paper></Fade>);
      if (step === 1) return (<Slide direction="left" in timeout={500}><Paper elevation={6} sx={{ p: 4, borderRadius: 4, background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)" }}><Typography variant="h3" gutterBottom fontWeight={700} mb={4}>⚙️ 문제 설정</Typography><ProblemSettings qTab={state.qTab} setQTab={state.setQTab} qField={state.qField} setQField={state.setQField} qLevel={state.qLevel} setQLevel={state.setQLevel} qCount={state.qCount} setQCount={state.setQCount} optCount={state.optCount} setOptCount={state.setOptCount} blankCount={state.blankCount} setBlankCount={state.setBlankCount} optionFormat={state.optionFormat} setOptionFormat={state.setOptionFormat} summaryText={state.summaryText} openSummaryDialog={state.openSummaryDialog} setOpenSummaryDialog={state.setOpenSummaryDialog} openSavedSummariesDialog={() => state.setOpenSavedSummariesDialog(true)} hasSummaryText={!!state.summaryText} /></Paper></Slide>);
      if (step === 2) {
        return state.loadingQ ? (
          <ParticleLoading message="문제를 생성하고 있습니다" />
        ) : state.questionError ? (
          <ErrorDisplay 
            errorMessage={state.questionErrorMessage} 
            errorType={state.questionErrorType} 
            onRetry={handleRetryQuestion} 
          />
        ) : state.questionText && state.isJsonFormat ? (
          <Box sx={{ display: 'flex', gap: 3 }}>
            {questionVersions.length > 0 && currentQuestionVersion && (
              <VersionSidebar
                versions={questionVersions}
                currentVersion={currentQuestionVersion}
                onSelectVersion={handleSelectQuestionVersion}
                onToggleFavorite={(id) => handleToggleFavorite('question', id)}
                onCompare={() => handleOpenCompare('question')}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <ResultDisplay
                type="question"
                text={state.questionText}
                isJsonFormat={state.isJsonFormat}
                parsedQuestions={state.parsedQuestions}
                fileName={state.fileName || "questions"}
                contentType={aiQuestionPromptKeys_Korean[state.qTab]}
                onSave={() => handleSave('question')}
                onDownload={() => downloadAsPDF(state.questionText, state.fileName || "questions", aiQuestionPromptKeys_Korean[state.qTab])}
                onRegenerate={() => handleRegenerate('question')}
                disabled={isGenerating}
              />
            </Box>
          </Box>
        ) : null;
      }
    }
    
    return null;
  };

  const handleForceNavigation = () => {
    state.setLoadingSum(false);
    state.setLoadingQ(false);
  };

  return (
    <>
      <Header />
      <PageNavigator />
      
      <NavigationBlocker 
        when={isGenerating}
        message={state.loadingSum ? "요약본 생성 중입니다. 페이지를 나가시겠습니까?" : "문제 생성 중입니다. 페이지를 나가시겠습니까?"}
        onNavigationAttempt={handleForceNavigation}
      />

      <Box sx={{ minHeight: "100vh", p: 4, pt: 12, background: "#ffffff" }}>
        <Container maxWidth="lg">
          {!state.mode ? <ModeSelection onSelectMode={handleModeSelect} /> : state.mode === 'question' && !state.questionSource ? <QuestionSourceSelection onSelectSource={handleQuestionSourceSelect} /> : (
            <>
              <Paper elevation={8} sx={{ p: 4, borderRadius: 4, mb: 4, background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)", border: "1px solid rgba(59, 130, 246, 0.1)" }}>
                <Stepper activeStep={state.activeStep} alternativeLabel>
                  {steps.map((label, index) => {
                    const isCompleted = state.completedSteps.has(index);
                    const isClickable = !isGenerating && isCompleted;
                    
                    return (
                      <Step 
                        key={label}
                        completed={isCompleted}
                        sx={{
                          cursor: isClickable ? 'pointer' : 'default',
                          opacity: isGenerating && !isCompleted ? 0.5 : 1,
                          '&:hover': isClickable ? {
                            '& .MuiStepLabel-label': {
                              color: '#2563eb',
                            }
                          } : {}
                        }}
                        onClick={() => handleStepClick(index)}
                      >
                        <StepLabel 
                          StepIconComponent={isCompleted ? () => (
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#10b981',
                                color: 'white',
                                transition: 'all 0.3s ease',
                                ...(isClickable && {
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    bgcolor: '#059669',
                                  }
                                })
                              }}
                            >
                              <Check sx={{ fontSize: 16 }} />
                            </Box>
                          ) : undefined}
                          sx={{ 
                            "& .MuiStepLabel-label": { 
                              fontSize: "1.1rem", 
                              fontWeight: 600,
                              transition: 'color 0.3s ease',
                            }, 
                            "& .MuiStepIcon-root": { 
                              color: "#93c5fd",
                              transition: 'all 0.3s ease',
                            }, 
                            "& .MuiStepIcon-root.Mui-active": { 
                              color: "#3b82f6",
                              transform: 'scale(1.1)',
                            }, 
                            "& .MuiStepIcon-root.Mui-completed": { 
                              color: "#10b981" 
                            } 
                          }}
                        >
                          {label}
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              </Paper>
              <Box sx={{ minHeight: 500, mb: 4 }}>{renderStep(state.activeStep)}</Box>
              <Stack direction="row" justifyContent="space-between" sx={{ px: 2 }}>
                <Button 
                  disabled={!state.mode || isGenerating} 
                  onClick={handleBack} 
                  startIcon={<ArrowBack />} 
                  size="large" 
                  sx={{ 
                    borderRadius: 3, 
                    px: 5, 
                    py: 1.5, 
                    fontSize: "1.1rem", 
                    fontWeight: 600, 
                    color: "#3b82f6", 
                    "&:hover": { bgcolor: "rgba(59, 130, 246, 0.08)" },
                    "&.Mui-disabled": {
                      color: "rgba(0, 0, 0, 0.26)",
                    }
                  }}
                >
                  이전
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext} 
                  endIcon={<ArrowForward />} 
                  disabled={(state.mode === 'summary' && state.activeStep === 0 && !state.file) || (state.mode === 'summary' && state.activeStep === 2 && !state.summaryText) || (state.mode === 'summary' && state.activeStep === 4 && !state.questionText) || (state.mode === 'question' && state.questionSource === 'upload' && state.activeStep === 0 && !state.file) || (state.mode === 'question' && state.questionSource === 'upload' && state.activeStep === 2 && !state.questionText) || (state.mode === 'question' && state.questionSource === 'saved' && state.activeStep === 0 && !state.isSummarySelected) || (state.mode === 'question' && state.questionSource === 'saved' && state.activeStep === 2 && !state.questionText) || (state.mode === 'summary' && state.activeStep === steps.length - 1) || (state.mode === 'question' && state.activeStep === steps.length - 1) || isGenerating} 
                  size="large" 
                  sx={{ 
                    borderRadius: 3, 
                    px: 5, 
                    py: 1.5, 
                    fontSize: "1.1rem", 
                    fontWeight: 600, 
                    background: "linear-gradient(135deg, #3b82f6 0%, #0891b2 100%)", 
                    boxShadow: "0 4px 20px rgba(59, 130, 246, 0.4)", 
                    "&:hover": { 
                      background: "linear-gradient(135deg, #2563eb 0%, #0e7490 100%)", 
                      boxShadow: "0 6px 30px rgba(37, 99, 235, 0.5)" 
                    } 
                  }}
                >
                  {(state.mode === 'summary' && state.activeStep === 1) ? "요약 생성" : (state.mode === 'summary' && state.activeStep === 3) ? "문제 생성" : (state.mode === 'question' && state.activeStep === steps.length - 2) ? "문제 생성" : "다음"}
                </Button>
              </Stack>
            </>
          )}
        </Container>

        <SavedSummaryDialog open={state.openSavedSummariesDialog} onClose={() => state.setOpenSavedSummariesDialog(false)} onSelectSummary={handleSelectSavedSummary} />
        <SaveNameDialog open={state.openSaveNameDialog} onClose={() => state.setOpenSaveNameDialog(false)} onSave={handlers.handleConfirmSave} defaultName={state.fileName || 'untitled'} title={state.saveDialogType === 'summary' ? '요약 저장' : '문제 저장'} type={state.saveDialogType} />
        
        {/* 🎯 버전 비교 다이얼로그 */}
        {compareDialogOpen && (
          <VersionCompareDialog
            open={compareDialogOpen}
            onClose={() => setCompareDialogOpen(false)}
            versions={compareType === 'summary' ? summaryVersions : questionVersions}
            currentVersion={
              compareType === 'summary' 
                ? currentSummaryVersion! 
                : currentQuestionVersion!
            }
          />
        )}

        <Snackbar 
          open={state.openSumDoneSnackbar} 
          onClose={() => state.setOpenSumDoneSnackbar(false)} 
          autoHideDuration={10000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 400,
              bgcolor: '#E8F9EE',
              color: '#1a5d3a',
              borderRadius: 2,
              boxShadow: 3,
              px: 2.5,
              py: 1.5,
            }}
          >
            <CheckCircleOutline sx={{ fontSize: 24, color: '#1a5d3a' }} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 500, flexGrow: 1, color: '#1a5d3a' }}>
              요약 저장이 완료되었습니다!
            </Typography>
            <Button 
              variant="contained"
              size="small"
              onClick={() => {
                state.setOpenSumDoneSnackbar(false);
                navigate('/mypage');
              }}
              sx={{
                bgcolor: '#34C759',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1.5,
                px: 2,
                py: 0.5,
                '&:hover': {
                  bgcolor: '#28a745',
                }
              }}
            >
              마이페이지
            </Button>
            <IconButton
              size="small"
              onClick={() => state.setOpenSumDoneSnackbar(false)}
              sx={{
                color: '#1a5d3a',
                '&:hover': {
                  bgcolor: 'rgba(26, 93, 58, 0.1)',
                }
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Snackbar>

        <Snackbar 
          open={state.openQDoneSnackbar} 
          onClose={() => state.setOpenQDoneSnackbar(false)} 
          autoHideDuration={10000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 400,
              bgcolor: '#E8F9EE',
              color: '#1a5d3a',
              borderRadius: 2,
              boxShadow: 3,
              px: 2.5,
              py: 1.5,
            }}
          >
            <CheckCircleOutline sx={{ fontSize: 24, color: '#1a5d3a' }} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 500, flexGrow: 1, color: '#1a5d3a' }}>
              문제 저장이 완료되었습니다!
            </Typography>
            <Button 
              variant="contained"
              size="small"
              onClick={() => {
                state.setOpenQDoneSnackbar(false);
                navigate('/mypage');
              }}
              sx={{
                bgcolor: '#34C759',
                color: 'white',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1.5,
                px: 2,
                py: 0.5,
                '&:hover': {
                  bgcolor: '#28a745',
                }
              }}
            >
              마이페이지
            </Button>
            <IconButton
              size="small"
              onClick={() => state.setOpenQDoneSnackbar(false)}
              sx={{
                color: '#1a5d3a',
                '&:hover': {
                  bgcolor: 'rgba(26, 93, 58, 0.1)',
                }
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Snackbar>
      </Box>
    </>
  );
}