import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  aiSummaryAPI,
  aiQuestionAPI,
  summaryAPI,
  questionAPI,
  SummaryItem,
} from '../services/api';
import { aiQuestionPromptKeys_Korean } from '../constants/upload';

export const useUploadHandlers = (state: ReturnType<typeof useUploadState>) => {
  const { user } = useAuth();

  // 단계 완료 표시 헬퍼 함수
  const markStepCompleted = useCallback((step: number) => {
    state.setCompletedSteps(prev => new Set(prev).add(step));
  }, [state]);

  // 파일 유효성 검사
  const validateFile = useCallback((f: File): boolean => {
    const allowedExtensions = ['pdf', 'ppt', 'pptx'];
    const fileExtension = f.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      alert('PDF, PPT, PPTX 파일만 업로드 가능합니다.');
      return false;
    }
    
    const fileNameWithoutExt = f.name.substring(0, f.name.lastIndexOf('.'));
    // 한글 자음(ㄱ-ㅎ), 모음(ㅏ-ㅣ), 완성형 한글(가-힣) 모두 허용
    const validFileNamePattern = /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9.\-_()[\]% ]+$/;
    
    if (!validFileNamePattern.test(fileNameWithoutExt)) {
      alert('파일명에는 한글, 영문, 숫자, 공백, 그리고 . - _ ( ) [ ] % 기호만 사용할 수 있습니다.');
      return false;
    }
    
    return true;
  }, []);

  // JSON 파싱
  const parseQuestionJson = useCallback((jsonText: string): boolean => {
    try {
      const data = JSON.parse(jsonText);
      
      if (!data.questions || !Array.isArray(data.questions)) {
        console.error('Invalid JSON structure: questions array not found');
        return false;
      }
      
      if (data.questions.length === 0) {
        console.error('No questions generated');
        return false;
      }
      
      for (const question of data.questions) {
        if (!question.question_text) {
          console.error('Invalid question: missing question_text');
          return false;
        }
      }
      
      state.setParsedQuestions(data.questions);
      state.setIsJsonFormat(true);
      return true;
    } catch (error) {
      console.error('JSON parsing error:', error);
      state.setIsJsonFormat(false);
      return false;
    }
  }, [state]);

  const parseErrorResponse = (error: any): { type: 'short_text' | 'invalid_file' | 'generation_failed' | 'unknown', message: string } => {
    const errorMessage = error.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.';
    
    if (errorMessage.includes('텍스트가 너무 짧습니다') || errorMessage.includes('최소 200자')) {
      return { type: 'short_text', message: errorMessage };
    }
    if (errorMessage.includes('텍스트를 추출할 수 없습니다') || errorMessage.includes('파일에서')) {
      return { type: 'invalid_file', message: errorMessage };
    }
    if (errorMessage.includes('프롬프트') || errorMessage.includes('생성')) {
      return { type: 'generation_failed', message: errorMessage };
    }
    return { type: 'unknown', message: errorMessage };
  };

  // 요약 생성
  const handleGenerateSummary = useCallback(async () => {
    if (!state.file || !user) return alert('파일 선택 및 로그인 필요');
    
    state.setLoadingSum(true);
    state.setSummaryError(false);
    state.setSummaryErrorType('unknown');
    state.setSummaryErrorMessage('');

    const formData = new FormData();
    formData.append('file', state.file);
    formData.append('summary_type', state.aiSummaryType);
    formData.append('field', state.sumField);
    formData.append('level', state.sumLevel);
    formData.append('sentence_count', String(state.sumSentCount));
    
    if (state.sumTab === 2) formData.append('topic_count', String(state.sumTopicCount));
    if (state.sumTab === 4) {
      formData.append('keyword_count', String(state.sumKeywordCount));
      if (state.sumKeywordCount > 0) {
        const validKeywords = state.keywords.filter((k: string) => k && k.trim().length > 0);
        if (validKeywords.length > 0) {
          formData.append('user_keywords', validKeywords.join(','));
        }
      }
    }

    try {
      const res = await aiSummaryAPI.generateSummary(formData);
      state.setSummaryText(res.data.summary);
      markStepCompleted(2); // 요약 생성 완료 표시 (설정은 handleNext에서 이미 완료)
      state.setActiveStep(2);
    } catch (error: any) {
      console.error('요약 생성 오류:', error);
      const { type, message } = parseErrorResponse(error);
      state.setSummaryError(true);
      state.setSummaryErrorType(type);
      state.setSummaryErrorMessage(message);
    } finally {
      state.setLoadingSum(false);
    }
  }, [state, user, markStepCompleted]);

  // 파일에서 문제 생성
  const handleGenerateQuestionFromFile = useCallback(async () => {
    if (!state.file || !user) return alert('파일 선택 및 로그인 필요');
    
    state.setLoadingQ(true);
    state.setQuestionError(false);
    state.setQuestionErrorType('unknown');
    state.setQuestionErrorMessage('');

    const formData = new FormData();
    formData.append('file', state.file);
    formData.append('generation_type', `문제 생성_${aiQuestionPromptKeys_Korean[state.qTab]}`);
    formData.append('field', state.qField);
    formData.append('level', state.qLevel);
    formData.append('question_count', String(state.qCount));
    
    if (state.qTab === 0) {
      formData.append('choice_count', String(state.optCount));
      formData.append('choice_format', state.optionFormat);
    }
    if (state.qTab === 1) formData.append('array_choice_count', String(state.optCount));
    if (state.qTab === 2) formData.append('blank_count', String(state.blankCount));

    try {
      const res = await aiQuestionAPI.generateQuestionsFromFile(formData);
      state.setQuestionText(res.data.result);
      const isValid = parseQuestionJson(res.data.result);
      if (!isValid) state.setQuestionError(true);
      markStepCompleted(2); // 문제 생성 완료 표시 (설정은 handleNext에서 이미 완료)
      state.setActiveStep(2);
    } catch (error: any) {
      console.error('문제 생성 오류:', error);
      const { type, message } = parseErrorResponse(error);
      state.setQuestionError(true);
      state.setQuestionErrorType(type);
      state.setQuestionErrorMessage(message);
    } finally {
      state.setLoadingQ(false);
    }
  }, [state, user, parseQuestionJson, markStepCompleted]);

  // 요약본에서 문제 생성
  const handleGenerateQuestion = useCallback(async () => {
    if (!state.summaryText || !user) return alert('요약 후 문제 생성을 눌러주세요');
    
    state.setLoadingQ(true);
    state.setQuestionError(false);
    state.setQuestionErrorType('unknown');
    state.setQuestionErrorMessage('');

    try {
      const payload: any = {
        generation_type: `문제 생성_${aiQuestionPromptKeys_Korean[state.qTab]}`,
        summary_text: state.summaryText,
        field: state.qField,
        level: state.qLevel,
        question_count: state.qCount,
      };
      
      if (state.qTab === 0) {
        payload.choice_count = state.optCount;
        payload.choice_format = state.optionFormat;
      }
      if (state.qTab === 1) payload.array_choice_count = state.optCount;
      if (state.qTab === 2) payload.blank_count = state.blankCount;

      const res = await aiQuestionAPI.generateQuestions(payload);
      state.setQuestionText(res.data.result);
      const isValid = parseQuestionJson(res.data.result);
      if (!isValid) state.setQuestionError(true);
      
      if (state.mode === 'summary') {
        markStepCompleted(4); // 문제 생성 완료 표시 (설정은 handleNext에서 이미 완료)
        state.setActiveStep(4);
      } else if (state.mode === 'question' && state.questionSource === 'saved') {
        markStepCompleted(2); // 문제 생성 완료 표시 (설정은 handleNext에서 이미 완료)
        state.setActiveStep(2);
      }
    } catch (error: any) {
      console.error('문제 생성 오류:', error);
      const { type, message } = parseErrorResponse(error);
      state.setQuestionError(true);
      state.setQuestionErrorType(type);
      state.setQuestionErrorMessage(message);
      
      if (state.mode === 'summary') {
        state.setActiveStep(4);
      } else if (state.mode === 'question' && state.questionSource === 'saved') {
        state.setActiveStep(2);
      }
    } finally {
      state.setLoadingQ(false);
    }
  }, [state, user, parseQuestionJson, markStepCompleted]);

  // 저장
  const handleConfirmSave = useCallback(async (customName: string) => {
    if (!user || !state.fileName) return;
    
    try {
      if (state.saveDialogType === 'summary') {
        await summaryAPI.saveSummary({
          userId: user.id,
          fileName: state.fileName,
          summaryName: customName,
          summaryType: state.dbSummaryTypeKorean,
          summaryText: state.summaryText,
        });
        state.setOpenSumDoneSnackbar(true);
      } else {
        await questionAPI.saveQuestion({
          userId: user.id,
          fileName: state.fileName,
          questionName: customName,
          questionType: aiQuestionPromptKeys_Korean[state.qTab],
          questionText: state.questionText,
        });
        state.setOpenQDoneSnackbar(true);
      }
      state.setOpenSaveNameDialog(false);
    } catch (e) {
      alert('저장 중 오류');
    }
  }, [state, user]);

  return {
    validateFile,
    parseQuestionJson,
    handleGenerateSummary,
    handleGenerateQuestionFromFile,
    handleGenerateQuestion,
    handleConfirmSave,
    markStepCompleted,
  };
};
