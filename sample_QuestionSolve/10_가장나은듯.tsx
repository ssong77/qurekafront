import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, Paper, Typography, Button, 
  Divider, Alert, Card, CardContent,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { QuestionItem } from '../../types/mypage';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import FillInTheBlankQuestion from './FillInTheBlankQuestion';
import SequenceQuestion from './SequenceQuestion';
import ShortAnswerQuestion from './ShortAnswerQuestion';
import DescriptiveQuestion from './DescriptiveQuestion';

interface QuestionSolverProps {
  questionItem: QuestionItem;
  onClose: () => void;
}

interface ParsedQuestion {
  type: string;
  questions: any[];
}

// 타입 감지 유틸리티 함수들
const detectQuestionType = (question: any, displayType?: string): string => {
  // displayType 기반 감지
  if (displayType) {
    if (displayType.includes('서술') || displayType.toLowerCase().includes('descriptive')) {
      return 'descriptive';
    }
    if (displayType.includes('참/거짓') || 
        displayType.toLowerCase().includes('true/false') || 
        displayType.toLowerCase().includes('true-false')) {
      return 'true_false';
    }
  }

  // 데이터 구조 기반 자동 감지
  if ((question.answer_keywords && Array.isArray(question.answer_keywords)) || question.model_answer) {
    return 'descriptive';
  }
  if (question.correct_sequence) {
    return 'sequence';
  }
  if (question.correct_answer && 
      typeof question.correct_answer === 'string' && 
      (!question.options || question.options.length === 0)) {
    return 'short_answer';
  }
  if (question.blanks || 
      (question.question_text && question.question_text.includes('____')) || 
      question.correct_answers) {
    return 'fill_in_the_blank';
  }
  if (question.correct_answer !== undefined && 
      (question.correct_answer === true || question.correct_answer === false)) {
    return 'true_false';
  }

  return 'multiple_choice';
};

// 문제 전처리 함수
const preprocessQuestion = (question: any, type: string): void => {
  // 질문 텍스트 필드 통일
  if (!question.question_text && question.question) {
    question.question_text = question.question;
  }

  switch (type) {
    case 'true_false':
      if (typeof question.correct_answer === 'string') {
        question.correct_answer = question.correct_answer.toLowerCase() === 'true';
      }
      break;

    case 'sequence':
      if (!question.items || !Array.isArray(question.items)) {
        question.items = [];
      }
      break;

    case 'fill_in_the_blank':
      if (!question.blanks) {
        question.blanks = [];
        const blankCount = (question.question_text?.match(/____/g) || []).length;
        
        if (blankCount > 0) {
          for (let i = 0; i < blankCount; i++) {
            question.blanks.push({
              id: String(i),
              correct_answer: question.correct_answers?.[i] || ''
            });
          }
        } else if (question.correct_answer) {
          question.blanks.push({
            id: '0',
            correct_answer: question.correct_answer
          });
        }
      }
      break;

    case 'short_answer':
      question.alternative_answers = question.alternative_answers || [];
      question.case_sensitive = question.case_sensitive ?? false;
      break;

    case 'descriptive':
      if (!question.answer_keywords) {
        question.answer_keywords = [];
      } else if (typeof question.answer_keywords === 'string') {
        question.answer_keywords = question.answer_keywords.split(',').map(k => k.trim());
      }
      question.model_answer = question.model_answer || '';
      break;
  }
};

// 답안 비교 함수들
const compareAnswers = {
  multiple_choice: (userAnswer: any, correctAnswer: any) => {
    // 알파벳 형식을 숫자로 변환
    let processedCorrectAnswer = correctAnswer;
    if (typeof correctAnswer === 'string' && /^[A-Z]$/.test(correctAnswer)) {
      processedCorrectAnswer = String(correctAnswer.charCodeAt(0) - 64);
    }
    return userAnswer === processedCorrectAnswer;
  },
  
  true_false: (userAnswer: any, correctAnswer: any) => {
    // boolean 타입으로 확실하게 변환하여 비교
    const normalizedUserAnswer = Boolean(userAnswer);
    const normalizedCorrectAnswer = Boolean(correctAnswer);
    console.log('true_false 비교:', { 
      userAnswer, 
      correctAnswer, 
      normalizedUserAnswer, 
      normalizedCorrectAnswer,
      result: normalizedUserAnswer === normalizedCorrectAnswer 
    });
    return normalizedUserAnswer === normalizedCorrectAnswer;
  },
  
  sequence: (userAnswer: any, correctSequence: any[]) => {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctSequence)) return false;
    if (userAnswer.length !== correctSequence.length) return false;
    return userAnswer.every((val, index) => val === correctSequence[index]);
  },
  
  fill_in_the_blank: (userAnswer: any, question: any) => {
    if (typeof userAnswer === 'string') {
      const correctAnswer = question.correct_answer || question.blanks?.[0]?.correct_answer || '';
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }
    if (!question.blanks) return false;
    
    return Object.entries(userAnswer).every(([index, value]) => {
      const correctAnswer = question.blanks[Number(index)]?.correct_answer || 
                         question.correct_answers?.[Number(index)] || '';
      return String(value).trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    });
  },
  
  short_answer: (userAnswer: string, question: any) => {
    const correctAnswers = [
      question.correct_answer, 
      ...(question.alternative_answers || [])
    ].map(a => question.case_sensitive ? a : a.toLowerCase());
    
    const processedUserAnswer = question.case_sensitive ? userAnswer : userAnswer.toLowerCase();
    return correctAnswers.includes(processedUserAnswer);
  },
  
  descriptive: (userAnswer: string, question: any) => {
    if (!question.answer_keywords || !Array.isArray(question.answer_keywords)) return false;
    
    const lowerUserAnswer = userAnswer.toLowerCase();
    const keywordMatches = question.answer_keywords
      .filter(keyword => lowerUserAnswer.includes(keyword.toLowerCase())).length;
    
    return keywordMatches >= Math.ceil(question.answer_keywords.length / 2);
  }
};

export default function QuestionSolver({ questionItem, onClose }: QuestionSolverProps) {
  const [parsedData, setParsedData] = useState<ParsedQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionItem.rawJson) {
      setParsingError('문제 데이터가 유효하지 않습니다.');
      return;
    }

    try {
      const rawData = JSON.parse(questionItem.rawJson);
      const parsedQuestion: ParsedQuestion = {
        type: rawData.type || 'multiple_choice',
        questions: []
      };

      // questions 배열 처리
      if (rawData.questions && Array.isArray(rawData.questions)) {
        parsedQuestion.questions = rawData.questions;
        
        if (rawData.questions.length > 0) {
          // 첫 번째 질문의 타입 사용 또는 자동 감지
          parsedQuestion.type = rawData.questions[0].type || 
            detectQuestionType(rawData.questions[0], questionItem.displayType);
        }
      } else {
        // 단일 문제 처리
        parsedQuestion.type = rawData.type || 
          detectQuestionType(rawData, questionItem.displayType);
        parsedQuestion.questions = [rawData];
      }

      parsedQuestion.type = parsedQuestion.type.toLowerCase();
      
      // 각 문제 전처리
      parsedQuestion.questions.forEach(q => preprocessQuestion(q, parsedQuestion.type));

      
      setParsedData(parsedQuestion);
      setUserAnswers(Array(parsedQuestion.questions.length).fill(null));
    } catch (error) {
      console.error("문제 파싱 오류:", error);
      setParsingError('문제 데이터 형식이 올바르지 않습니다.');
    }
  }, [questionItem]);

  const currentQuestion = useMemo(() => 
    parsedData?.questions[currentQuestionIndex],
    [parsedData, currentQuestionIndex]
  );

  const handleAnswer = useCallback((answer: any) => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  }, [currentQuestionIndex]);

  const handleCheckResult = useCallback(() => {
    setShowResult(true);
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < parsedData!.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      
      // 다음 문제의 답안 초기화
      setUserAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[nextIndex] = null;
        return newAnswers;
      });
      
      setCurrentQuestionIndex(nextIndex);
      setShowResult(false);
    }
  }, [currentQuestionIndex, parsedData]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      
      // 이전 문제의 답안 초기화
      setUserAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[prevIndex] = null;
        return newAnswers;
      });
      
      setCurrentQuestionIndex(prevIndex);
      setShowResult(false);
    }
  }, [currentQuestionIndex]);

  const isCorrect = useMemo((): boolean => {
    if (!parsedData || userAnswers[currentQuestionIndex] === null) return false;
    
    const userAnswer = userAnswers[currentQuestionIndex];
    const type = parsedData.type as keyof typeof compareAnswers;
    
    console.log('isCorrect 계산:', { type, userAnswer, currentQuestion });
    
    switch (type) {
      case 'multiple_choice':
        return compareAnswers.multiple_choice(userAnswer, currentQuestion.correct_answer);
      
      case 'true_false':
        return compareAnswers.true_false(userAnswer, currentQuestion.correct_answer);
      
      case 'sequence':
        return compareAnswers.sequence(userAnswer, currentQuestion.correct_sequence);
      
      case 'fill_in_the_blank':
        return compareAnswers.fill_in_the_blank(userAnswer, currentQuestion);
      
      case 'short_answer':
        return compareAnswers.short_answer(userAnswer, currentQuestion);
      
      case 'descriptive':
        return compareAnswers.descriptive(userAnswer, currentQuestion);
      
      default:
        return false;
    }
  }, [parsedData, userAnswers, currentQuestionIndex, currentQuestion]);

  const isCheckButtonDisabled = useMemo((): boolean => {
    const answer = userAnswers[currentQuestionIndex];
    
    if (answer === null) return true;
    
    if ((parsedData?.type === 'short_answer' || parsedData?.type === 'descriptive') && 
        (answer === '' || answer.trim() === '')) {
      return true;
    }
    
    return false;
  }, [userAnswers, currentQuestionIndex, parsedData]);

  const renderQuestionComponent = useCallback(() => {
    if (!parsedData || !currentQuestion) return null;

    const type = parsedData.type.toLowerCase();
    
    const commonProps = {
      key: `question-${currentQuestionIndex}`, // 문제 인덱스를 key로 사용
      question: currentQuestion,
      userAnswer: userAnswers[currentQuestionIndex],
      onAnswer: handleAnswer,
      showResult
    };

    const componentMap: Record<string, JSX.Element> = {
      multiple_choice: <MultipleChoiceQuestion {...commonProps} />,
      true_false: <TrueFalseQuestion {...commonProps} />,
      sequence: <SequenceQuestion {...commonProps} />,
      fill_in_the_blank: <FillInTheBlankQuestion {...commonProps} />,
      short_answer: <ShortAnswerQuestion {...commonProps} />,
      descriptive: <DescriptiveQuestion {...commonProps} />
    };

    if (componentMap[type]) {
      return componentMap[type];
    }

    // 폴백: displayType 기반 감지
    if (questionItem.displayType.includes('서술') || 
        questionItem.name.includes('서술') ||
        questionItem.displayType.toLowerCase().includes('descriptive')) {
      return <DescriptiveQuestion {...commonProps} />;
    }

    console.warn("지원되지 않는 문제 유형:", type);
    return <ShortAnswerQuestion {...commonProps} />;
  }, [parsedData, currentQuestion, userAnswers, currentQuestionIndex, handleAnswer, showResult, questionItem]);

  if (parsingError) {
    return (
      <Box sx={{ mt: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onClose} sx={{ mb: 2 }}>
          돌아가기
        </Button>
        <Alert severity="error">{parsingError}</Alert>
      </Box>
    );
  }

  if (!parsedData) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentQuestion) {
    return (
      <Box sx={{ mt: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onClose} sx={{ mb: 2 }}>
          돌아가기
        </Button>
        <Alert severity="error">문제 데이터가 유효하지 않습니다.</Alert>
      </Box>
    );
  }

return (
  <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
    {/* 헤더 */}
    <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, zIndex: 100 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto', py: 2.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 600 }}>
            문제 풀이
          </Typography>
          <Typography variant="caption" sx={{ color: '#757575' }}>
            {questionItem.displayType}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#1976d2', fontWeight: 600 }}>
          목록으로
        </Button>
      </Box>
      
      {/* 프로그레스 */}
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {Array.from({ length: parsedData.questions.length }).map((_, i) => (
            <Box key={i} sx={{ flex: 1, height: 6, bgcolor: i <= currentQuestionIndex ? '#1976d2' : '#e0e0e0', borderRadius: 3, transition: 'all 0.3s' }} />
          ))}
        </Box>
      </Box>
    </Box>

    {/* 메인 */}
    <Box sx={{ maxWidth: 760, mx: 'auto', py: 5, px: 3 }}>
      {/* 문제 번호 */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 2, border: '2px solid #1976d2', display: 'inline-block' }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#1976d2' }}>
          문제 {currentQuestionIndex + 1}
        </Typography>
      </Box>

      {/* 문제 */}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3, bgcolor: 'white', mb: 4 }}>
        {renderQuestionComponent()}
      </Paper>

      {/* 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
        <Button variant="outlined" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0} sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
          이전
        </Button>

        <Box sx={{ px: 4, py: 1, bgcolor: '#e3f2fd', borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#1976d2' }}>
            {currentQuestionIndex + 1} / {parsedData.questions.length}
          </Typography>
        </Box>

        {!showResult ? (
          <Button variant="contained" onClick={handleCheckResult} disabled={isCheckButtonDisabled} sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#1976d2' }}>
            확인
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNextQuestion} disabled={currentQuestionIndex === parsedData.questions.length - 1} sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#4caf50' }}>
            다음
          </Button>
        )}
      </Box>
    </Box>

    {showResult && (
      <Box sx={{ maxWidth: 760, mx: 'auto', px: 3, pb: 5 }}>
        <Paper elevation={4} sx={{ p: 4, bgcolor: isCorrect ? '#e8f5e9' : '#ffebee', borderRadius: 3, border: `2px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: isCorrect ? '#2e7d32' : '#c62828', mb: 2 }}>
            {isCorrect ? '✓ 정답입니다' : '✗ 오답입니다'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {currentQuestion.explanation || '해설이 제공되지 않았습니다.'}
          </Typography>
        </Paper>
      </Box>
    )}
  </Box>
);
}