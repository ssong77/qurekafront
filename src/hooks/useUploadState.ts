import { useState } from 'react';
import {
  AiSummaryPromptKey,
  DbSummaryPromptKey_Korean,
  Question,
} from '../types/upload';
import {
  aiSummaryPromptKeys,
  dbSummaryPromptKeys_Korean,
} from '../constants/upload';

type Mode = 'summary' | 'question' | null;
type QuestionSource = 'upload' | 'saved' | null;

export const useUploadState = () => {
  // 모드 상태
  const [mode, setMode] = useState<Mode>(null);
  const [questionSource, setQuestionSource] = useState<QuestionSource>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 요약 상태
  const [sumTab, setSumTab] = useState(0);
  const [aiSummaryType, setAiSummaryType] = useState<AiSummaryPromptKey>(aiSummaryPromptKeys[0]);
  const [dbSummaryTypeKorean, setDbSummaryTypeKorean] = useState<DbSummaryPromptKey_Korean>(dbSummaryPromptKeys_Korean[0]);
  const [sumField, setSumField] = useState('언어');
  const [sumLevel, setSumLevel] = useState('비전공자');
  const [sumSentCount, setSumSentCount] = useState(3);
  const [summaryText, setSummaryText] = useState('');
  const [loadingSum, setLoadingSum] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [summaryErrorType, setSummaryErrorType] = useState<'short_text' | 'invalid_file' | 'generation_failed' | 'unknown'>('unknown');
  const [summaryErrorMessage, setSummaryErrorMessage] = useState('');
  const [sumTopicCount, setSumTopicCount] = useState(1);
  const [sumKeywordCount, setSumKeywordCount] = useState(3);
  const [keywords, setKeywords] = useState<string[]>([]);

  // 문제 상태
  const [qTab, setQTab] = useState(0);
  const [qField, setQField] = useState('언어');
  const [qLevel, setQLevel] = useState('비전공자');
  const [qCount, setQCount] = useState(3);
  const [optCount, setOptCount] = useState(4);
  const [blankCount, setBlankCount] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [loadingQ, setLoadingQ] = useState(false);
  const [questionError, setQuestionError] = useState(false);
  const [questionErrorType, setQuestionErrorType] = useState<'short_text' | 'invalid_file' | 'generation_failed' | 'unknown'>('unknown');
  const [questionErrorMessage, setQuestionErrorMessage] = useState('');
  const [optionFormat, setOptionFormat] = useState('단답형');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [isJsonFormat, setIsJsonFormat] = useState(false);

  // 다이얼로그 상태
  const [openSavedSummariesDialog, setOpenSavedSummariesDialog] = useState(false);
  const [isSummarySelected, setIsSummarySelected] = useState(false);
  const [openSumDoneSnackbar, setOpenSumDoneSnackbar] = useState(false);
  const [openQDoneSnackbar, setOpenQDoneSnackbar] = useState(false);
  const [openSaveNameDialog, setOpenSaveNameDialog] = useState(false);
  const [saveDialogType, setSaveDialogType] = useState<'summary' | 'question'>('summary');
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);

  // 초기화 함수
  const resetAll = () => {
    setMode(null);
    setQuestionSource(null);
    setActiveStep(0);
    setCompletedSteps(new Set());
    setFile(null);
    setFileName(null);
    setSummaryText('');
    setQuestionText('');
    setIsSummarySelected(false);
    setParsedQuestions([]);
    setIsJsonFormat(false);
  };

  return {
    // 모드
    mode, setMode,
    questionSource, setQuestionSource,
    activeStep, setActiveStep,
    completedSteps, setCompletedSteps,
    file, setFile,
    fileName, setFileName,
    isDragging, setIsDragging,
    
    // 요약
    sumTab, setSumTab,
    aiSummaryType, setAiSummaryType,
    dbSummaryTypeKorean, setDbSummaryTypeKorean,
    sumField, setSumField,
    sumLevel, setSumLevel,
    sumSentCount, setSumSentCount,
    summaryText, setSummaryText,
    loadingSum, setLoadingSum,
    summaryError, setSummaryError,
    summaryErrorType, setSummaryErrorType,
    summaryErrorMessage, setSummaryErrorMessage,
    sumTopicCount, setSumTopicCount,
    sumKeywordCount, setSumKeywordCount,
    keywords, setKeywords,
    
    // 문제
    qTab, setQTab,
    qField, setQField,
    qLevel, setQLevel,
    qCount, setQCount,
    optCount, setOptCount,
    blankCount, setBlankCount,
    questionText, setQuestionText,
    loadingQ, setLoadingQ,
    questionError, setQuestionError,
    questionErrorType, setQuestionErrorType,
    questionErrorMessage, setQuestionErrorMessage,
    optionFormat, setOptionFormat,
    parsedQuestions, setParsedQuestions,
    isJsonFormat, setIsJsonFormat,
    
    // 다이얼로그
    openSavedSummariesDialog, setOpenSavedSummariesDialog,
    isSummarySelected, setIsSummarySelected,
    openSumDoneSnackbar, setOpenSumDoneSnackbar,
    openQDoneSnackbar, setOpenQDoneSnackbar,
    openSaveNameDialog, setOpenSaveNameDialog,
    saveDialogType, setSaveDialogType,
    openSummaryDialog, setOpenSummaryDialog,
    
    // 유틸리티
    resetAll,
  };
};
