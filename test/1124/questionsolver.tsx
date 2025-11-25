import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { QuestionItem } from "../../types/mypage";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import TrueFalseQuestion from "./TrueFalseQuestion";
import FillInTheBlankQuestion from "./FillInTheBlankQuestion";
import SequenceQuestion from "./SequenceQuestion";
import ShortAnswerQuestion from "./ShortAnswerQuestion";
import DescriptiveQuestion from "./DescriptiveQuestion";
import QuestionResultSummary from "./QuestionResultSummary";
import { favoriteAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

interface QuestionSolverProps {
  questionItem: QuestionItem;
  favoritesList?: QuestionItem[];
  onClose: () => void;
}

interface ParsedQuestion {
  type: string;
  questions: any[];
}

// 🆕 문제 결과 인터페이스
interface QuestionResult {
  questionIndex: number;
  isCorrect: boolean;
  userAnswer: any;
}

// 타입 감지 유틸리티 함수들
const detectQuestionType = (question: any, displayType?: string): string => {
  // displayType 기반 감지
  if (displayType) {
    if (
      displayType.includes("서술") ||
      displayType.toLowerCase().includes("descriptive")
    ) {
      return "descriptive";
    }
    if (
      displayType.includes("참/거짓") ||
      displayType.toLowerCase().includes("true/false") ||
      displayType.toLowerCase().includes("true-false")
    ) {
      return "true_false";
    }
  }

  // 데이터 구조 기반 자동 감지
  if (
    (question.answer_keywords && Array.isArray(question.answer_keywords)) ||
    question.model_answer
  ) {
    return "descriptive";
  }
  if (question.correct_sequence) {
    return "sequence";
  }
  if (
    question.correct_answer &&
    typeof question.correct_answer === "string" &&
    (!question.options || question.options.length === 0)
  ) {
    return "short_answer";
  }
  if (
    question.blanks ||
    (question.question_text && question.question_text.includes("____")) ||
    question.correct_answers
  ) {
    return "fill_in_the_blank";
  }
  if (
    question.correct_answer !== undefined &&
    (question.correct_answer === true || question.correct_answer === false)
  ) {
    return "true_false";
  }

  return "multiple_choice";
};

// 문제 전처리 함수
const preprocessQuestion = (question: any, type: string): void => {
  // 질문 텍스트 필드 통일
  if (!question.question_text && question.question) {
    question.question_text = question.question;
  }

  switch (type) {
    case "true_false":
      if (typeof question.correct_answer === "string") {
        question.correct_answer =
          question.correct_answer.toLowerCase() === "true";
      }
      break;

    case "sequence":
      if (!question.items || !Array.isArray(question.items)) {
        question.items = [];
      }
      break;

    case "fill_in_the_blank":
      if (!question.blanks) {
        question.blanks = [];
        const blankCount = (question.question_text?.match(/____/g) || [])
          .length;

        if (blankCount > 0) {
          for (let i = 0; i < blankCount; i++) {
            question.blanks.push({
              id: String(i),
              correct_answer: question.correct_answers?.[i] || "",
            });
          }
        } else if (question.correct_answer) {
          question.blanks.push({
            id: "0",
            correct_answer: question.correct_answer,
          });
        }
      }
      break;

    case "short_answer":
      question.alternative_answers = question.alternative_answers || [];
      question.case_sensitive = question.case_sensitive ?? false;
      break;

    case "descriptive":
      if (!question.answer_keywords) {
        question.answer_keywords = [];
      } else if (typeof question.answer_keywords === "string") {
        question.answer_keywords = question.answer_keywords
          .split(",")
          .map((k) => k.trim());
      }
      question.model_answer = question.model_answer || "";
      break;
  }
};

// 답안 비교 함수들
const compareAnswers = {
  multiple_choice: (userAnswer: any, correctAnswer: any) => {
    // 알파벳 형식을 숫자로 변환
    let processedCorrectAnswer = correctAnswer;
    if (typeof correctAnswer === "string" && /^[A-Z]$/.test(correctAnswer)) {
      processedCorrectAnswer = String(correctAnswer.charCodeAt(0) - 64);
    }
    return userAnswer === processedCorrectAnswer;
  },

  true_false: (userAnswer: any, correctAnswer: any) => {
    // boolean 타입으로 확실하게 변환하여 비교
    const normalizedUserAnswer = Boolean(userAnswer);
    const normalizedCorrectAnswer = Boolean(correctAnswer);
    return normalizedUserAnswer === normalizedCorrectAnswer;
  },

  sequence: (userAnswer: any, correctSequence: any[]) => {
    if (!Array.isArray(userAnswer) || !Array.isArray(correctSequence))
      return false;
    if (userAnswer.length !== correctSequence.length) return false;
    return userAnswer.every((val, index) => val === correctSequence[index]);
  },

  fill_in_the_blank: (userAnswer: any, question: any) => {
    if (typeof userAnswer === "string") {
      const correctAnswer =
        question.correct_answer || question.blanks?.[0]?.correct_answer || "";
      return (
        userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      );
    }
    if (!question.blanks) return false;

    return Object.entries(userAnswer).every(([index, value]) => {
      const correctAnswer =
        question.blanks[Number(index)]?.correct_answer ||
        question.correct_answers?.[Number(index)] ||
        "";
      return (
        String(value).trim().toLowerCase() ===
        correctAnswer.trim().toLowerCase()
      );
    });
  },

  short_answer: (userAnswer: string, question: any) => {
    const correctAnswers = [
      question.correct_answer,
      ...(question.alternative_answers || []),
    ].map((a) => (question.case_sensitive ? a : a.toLowerCase()));

    const processedUserAnswer = question.case_sensitive
      ? userAnswer
      : userAnswer.toLowerCase();
    return correctAnswers.includes(processedUserAnswer);
  },

  descriptive: (userAnswer: string, question: any) => {
    if (!question.answer_keywords || !Array.isArray(question.answer_keywords))
      return false;

    const lowerUserAnswer = userAnswer.toLowerCase();
    const keywordMatches = question.answer_keywords.filter((keyword) =>
      lowerUserAnswer.includes(keyword.toLowerCase())
    ).length;

    return keywordMatches >= Math.ceil(question.answer_keywords.length / 2);
  },
};

export default function QuestionSolver({
  questionItem,
  favoritesList,
  onClose,
}: QuestionSolverProps) {
  const { user } = useAuth();
  const [parsedData, setParsedData] = useState<ParsedQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    questionItem.questionIndex || 0
  );
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);

  // 🔄 즐겨찾기 상태를 Map으로 관리 (캐싱)
  const [favoriteStatusMap, setFavoriteStatusMap] = useState<
    Map<string, { isFavorite: boolean; favoriteId: number | null }>
  >(new Map());
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentQuestionItem, setCurrentQuestionItem] =
    useState<QuestionItem>(questionItem);

  // --- Prototype: hardcoded folder list for selecting target folder when adding favorite
  const demoFolders = [
    { id: 1, name: "기본 폴더" },
    { id: 2, name: "중요" },
    { id: 3, name: "복습" },
  ];
  const [openFolderDialog, setOpenFolderDialog] = useState(false);
  const [selectedFolderToAdd, setSelectedFolderToAdd] = useState<number | null>(
    demoFolders[0].id
  );

  // 🆕 결과 추적 상태
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [wrongQuestionIndices, setWrongQuestionIndices] = useState<number[]>(
    []
  );

  // 🆕 즐겨찾기 변경 추적
  const [favoriteChanged, setFavoriteChanged] = useState(false);

  const isFavoriteMode = !!favoritesList && favoritesList.length > 0;
  const [currentFavoriteIndex, setCurrentFavoriteIndex] = useState(() => {
    if (!isFavoriteMode) return 0;
    return favoritesList.findIndex(
      (item) =>
        item.id === questionItem.id &&
        (item.questionIndex === questionItem.questionIndex ||
          (!item.questionIndex && !questionItem.questionIndex))
    );
  });

  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (!currentQuestionItem.rawJson) {
      setParsingError("문제 데이터가 유효하지 않습니다.");
      return;
    }

    try {
      const rawData = JSON.parse(currentQuestionItem.rawJson);
      const parsedQuestion: ParsedQuestion = {
        type: rawData.type || "multiple_choice",
        questions: [],
      };

      // questions 배열 처리
      if (rawData.questions && Array.isArray(rawData.questions)) {
        parsedQuestion.questions = rawData.questions;

        if (rawData.questions.length > 0) {
          parsedQuestion.type =
            rawData.questions[0].type ||
            detectQuestionType(
              rawData.questions[0],
              currentQuestionItem.displayType
            );
        }
      } else {
        parsedQuestion.type =
          rawData.type ||
          detectQuestionType(rawData, currentQuestionItem.displayType);
        parsedQuestion.questions = [rawData];
      }

      parsedQuestion.type = parsedQuestion.type.toLowerCase();
      parsedQuestion.questions.forEach((q) =>
        preprocessQuestion(q, parsedQuestion.type)
      );

      setParsedData(parsedQuestion);
      setUserAnswers(Array(parsedQuestion.questions.length).fill(null));
    } catch (error) {
      console.error("문제 파싱 오류:", error);
      setParsingError("문제 데이터 형식이 올바르지 않습니다.");
    }
  }, [currentQuestionItem]);

  const currentQuestion = useMemo(
    () => parsedData?.questions[currentQuestionIndex],
    [parsedData, currentQuestionIndex]
  );

  const handleAnswer = useCallback(
    (answer: any) => {
      setUserAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = answer;
        return newAnswers;
      });
    },
    [currentQuestionIndex]
  );

  // 🔄 정답 확인 로직을 별도 함수로 분리
  const checkIfCorrect = useCallback(
    (questionIndex: number): boolean => {
      if (!parsedData || userAnswers[questionIndex] === null) return false;

      const userAnswer = userAnswers[questionIndex];
      const question = parsedData.questions[questionIndex];
      const type = parsedData.type as keyof typeof compareAnswers;

      switch (type) {
        case "multiple_choice":
          return compareAnswers.multiple_choice(
            userAnswer,
            question.correct_answer
          );

        case "true_false":
          return compareAnswers.true_false(userAnswer, question.correct_answer);

        case "sequence":
          return compareAnswers.sequence(userAnswer, question.correct_sequence);

        case "fill_in_the_blank":
          return compareAnswers.fill_in_the_blank(userAnswer, question);

        case "short_answer":
          return compareAnswers.short_answer(userAnswer, question);

        case "descriptive":
          return compareAnswers.descriptive(userAnswer, question);

        default:
          return false;
      }
    },
    [parsedData, userAnswers]
  );

  const handleCheckResult = useCallback(() => {
    setShowResult(true);

    // 🆕 결과 기록 - checkIfCorrect 사용
    const isAnswerCorrect = checkIfCorrect(currentQuestionIndex);

    const result: QuestionResult = {
      questionIndex: isFavoriteMode
        ? currentFavoriteIndex
        : currentQuestionIndex, // 🔄 즐겨찾기 모드에서는 currentFavoriteIndex 사용
      isCorrect: isAnswerCorrect,
      userAnswer: userAnswers[currentQuestionIndex],
    };

    setQuestionResults((prev) => {
      const newResults = [...prev];
      const existingIndex = newResults.findIndex(
        (r) =>
          r.questionIndex ===
          (isFavoriteMode ? currentFavoriteIndex : currentQuestionIndex)
      );
      if (existingIndex >= 0) {
        newResults[existingIndex] = result;
      } else {
        newResults.push(result);
      }
      return newResults;
    });
  }, [
    currentQuestionIndex,
    currentFavoriteIndex,
    userAnswers,
    checkIfCorrect,
    isFavoriteMode,
  ]);

  const handleNextQuestion = useCallback(() => {
    if (isFavoriteMode && favoritesList) {
      // 🔄 재도전 모드일 때
      if (retryMode && wrongQuestionIndices.length > 0) {
        const currentWrongIndex = wrongQuestionIndices.findIndex(
          (i) => i === currentFavoriteIndex
        );

        if (currentWrongIndex < wrongQuestionIndices.length - 1) {
          // 다음 틀린 문제로 이동
          const nextFavoriteIndex = wrongQuestionIndices[currentWrongIndex + 1];
          const nextFavorite = favoritesList[nextFavoriteIndex];

          try {
            const rawData = JSON.parse(nextFavorite.rawJson || "{}");
            const parsedQuestion: ParsedQuestion = {
              type: rawData.type || "multiple_choice",
              questions: [],
            };

            if (rawData.questions && Array.isArray(rawData.questions)) {
              parsedQuestion.questions = rawData.questions;
              if (rawData.questions.length > 0) {
                parsedQuestion.type =
                  rawData.questions[0].type ||
                  detectQuestionType(
                    rawData.questions[0],
                    nextFavorite.displayType
                  );
              }
            } else {
              parsedQuestion.type =
                rawData.type ||
                detectQuestionType(rawData, nextFavorite.displayType);
              parsedQuestion.questions = [rawData];
            }

            parsedQuestion.type = parsedQuestion.type.toLowerCase();
            parsedQuestion.questions.forEach((q) =>
              preprocessQuestion(q, parsedQuestion.type)
            );

            setCurrentQuestionItem(nextFavorite);
            setParsedData(parsedQuestion);
            setUserAnswers(Array(parsedQuestion.questions.length).fill(null));
            setCurrentQuestionIndex(nextFavorite.questionIndex || 0);
            setCurrentFavoriteIndex(nextFavoriteIndex);
            setShowResult(false);
          } catch (error) {
            console.error("문제 파싱 오류:", error);
            alert("다음 문제를 불러오는데 실패했습니다.");
          }
        } else {
          // 재도전 완료
          setShowSummary(true);
        }
      } else {
        // 일반 모드 - 다음 즐겨찾기 문제
        if (currentFavoriteIndex < favoritesList.length - 1) {
          const nextFavorite = favoritesList[currentFavoriteIndex + 1];

          try {
            const rawData = JSON.parse(nextFavorite.rawJson || "{}");
            const parsedQuestion: ParsedQuestion = {
              type: rawData.type || "multiple_choice",
              questions: [],
            };

            if (rawData.questions && Array.isArray(rawData.questions)) {
              parsedQuestion.questions = rawData.questions;
              if (rawData.questions.length > 0) {
                parsedQuestion.type =
                  rawData.questions[0].type ||
                  detectQuestionType(
                    rawData.questions[0],
                    nextFavorite.displayType
                  );
              }
            } else {
              parsedQuestion.type =
                rawData.type ||
                detectQuestionType(rawData, nextFavorite.displayType);
              parsedQuestion.questions = [rawData];
            }

            parsedQuestion.type = parsedQuestion.type.toLowerCase();
            parsedQuestion.questions.forEach((q) =>
              preprocessQuestion(q, parsedQuestion.type)
            );

            setCurrentQuestionItem(nextFavorite);
            setParsedData(parsedQuestion);
            setUserAnswers(Array(parsedQuestion.questions.length).fill(null));
            setCurrentQuestionIndex(nextFavorite.questionIndex || 0);
            setCurrentFavoriteIndex(currentFavoriteIndex + 1);
            setShowResult(false);
          } catch (error) {
            console.error("문제 파싱 오류:", error);
            alert("다음 문제를 불러오는데 실패했습니다.");
          }
        }
      }
    } else {
      // 일반 모드 (즐겨찾기 아님)
      const nextIndex = retryMode
        ? wrongQuestionIndices[
            wrongQuestionIndices.findIndex((i) => i === currentQuestionIndex) +
              1
          ]
        : currentQuestionIndex + 1;

      if (retryMode) {
        const currentWrongIndex = wrongQuestionIndices.findIndex(
          (i) => i === currentQuestionIndex
        );
        if (currentWrongIndex < wrongQuestionIndices.length - 1) {
          setCurrentQuestionIndex(nextIndex);
          setShowResult(false);
        } else {
          setShowSummary(true);
        }
      } else {
        if (currentQuestionIndex < parsedData!.questions.length - 1) {
          setUserAnswers((prev) => {
            const newAnswers = [...prev];
            newAnswers[nextIndex] = null;
            return newAnswers;
          });

          setCurrentQuestionIndex(nextIndex);
          setShowResult(false);
        } else {
          setShowSummary(true);
        }
      }
    }
  }, [
    currentQuestionIndex,
    currentFavoriteIndex,
    parsedData,
    isFavoriteMode,
    favoritesList,
    retryMode,
    wrongQuestionIndices,
    currentQuestionItem,
  ]);

  const handlePrevQuestion = useCallback(() => {
    if (isFavoriteMode && favoritesList) {
      if (currentFavoriteIndex > 0) {
        const prevFavorite = favoritesList[currentFavoriteIndex - 1];

        try {
          const rawData = JSON.parse(prevFavorite.rawJson || "{}");
          const parsedQuestion: ParsedQuestion = {
            type: rawData.type || "multiple_choice",
            questions: [],
          };

          if (rawData.questions && Array.isArray(rawData.questions)) {
            parsedQuestion.questions = rawData.questions;
            if (rawData.questions.length > 0) {
              parsedQuestion.type =
                rawData.questions[0].type ||
                detectQuestionType(
                  rawData.questions[0],
                  prevFavorite.displayType
                );
            }
          } else {
            parsedQuestion.type =
              rawData.type ||
              detectQuestionType(rawData, prevFavorite.displayType);
            parsedQuestion.questions = [rawData];
          }

          parsedQuestion.type = parsedQuestion.type.toLowerCase();
          parsedQuestion.questions.forEach((q) =>
            preprocessQuestion(q, parsedQuestion.type)
          );

          // 🔄 상태 업데이트 순서 개선
          setCurrentQuestionItem(prevFavorite); // 문제 항목 먼저 업데이트
          setParsedData(parsedQuestion);
          setUserAnswers(Array(parsedQuestion.questions.length).fill(null));
          setCurrentQuestionIndex(prevFavorite.questionIndex || 0);
          setCurrentFavoriteIndex(currentFavoriteIndex - 1);
          setShowResult(false);
        } catch (error) {
          console.error("문제 파싱 오류:", error);
          alert("이전 문제를 불러오는데 실패했습니다.");
        }
      }
    } else {
      if (currentQuestionIndex > 0) {
        const prevIndex = currentQuestionIndex - 1;

        setUserAnswers((prev) => {
          const newAnswers = [...prev];
          newAnswers[prevIndex] = null;
          return newAnswers;
        });

        setCurrentQuestionIndex(prevIndex);
        setShowResult(false);
      }
    }
  }, [
    currentQuestionIndex,
    currentFavoriteIndex,
    isFavoriteMode,
    favoritesList,
  ]);

  // 🔄 isCorrect는 화면 표시용으로만 사용
  const isCorrect = useMemo((): boolean => {
    return checkIfCorrect(currentQuestionIndex);
  }, [checkIfCorrect, currentQuestionIndex]);

  const isCheckButtonDisabled = useMemo((): boolean => {
    const answer = userAnswers[currentQuestionIndex];

    if (answer === null) return true;

    if (
      (parsedData?.type === "short_answer" ||
        parsedData?.type === "descriptive") &&
      (answer === "" || answer.trim() === "")
    ) {
      return true;
    }

    return false;
  }, [userAnswers, currentQuestionIndex, parsedData]);

  const renderQuestionComponent = useCallback(() => {
    if (!parsedData || !currentQuestion) return null;

    const type = parsedData.type.toLowerCase();

    const commonProps = {
      question: currentQuestion,
      userAnswer: userAnswers[currentQuestionIndex],
      onAnswer: handleAnswer,
      showResult,
    };

    const componentMap: Record<string, JSX.Element> = {
      multiple_choice: (
        <MultipleChoiceQuestion
          key={`question-${currentQuestionIndex}`}
          {...commonProps}
        />
      ),
      true_false: (
        <TrueFalseQuestion
          key={`question-${currentQuestionIndex}`}
          {...commonProps}
        />
      ),
      sequence: (
        <SequenceQuestion
          key={`question-${currentQuestionIndex}`}
          {...commonProps}
        />
      ),
      fill_in_the_blank: (
        <FillInTheBlankQuestion
          key={`question-${currentQuestionIndex}`}
          {...commonProps}
        />
      ),
      short_answer: (
        <ShortAnswerQuestion
          key={`question-${currentQuestionIndex}`}
          {...commonProps}
        />
      ),
      descriptive: (
        <DescriptiveQuestion
          key={`question-${currentQuestionIndex}`}
          {...commonProps}
        />
      ),
    };

    if (componentMap[type]) {
      return componentMap[type];
    }

    // 🔄 currentQuestionItem 사용
    if (
      currentQuestionItem.displayType.includes("서술") ||
      currentQuestionItem.name.includes("서술") ||
      currentQuestionItem.displayType.toLowerCase().includes("descriptive")
    ) {
      return (
        <DescriptiveQuestion
          key={`question-${currentQuestionIndex}`}
          {...commonProps}
        />
      );
    }

    return (
      <ShortAnswerQuestion
        key={`question-${currentQuestionIndex}`}
        {...commonProps}
      />
    );
  }, [
    parsedData,
    currentQuestion,
    userAnswers,
    currentQuestionIndex,
    handleAnswer,
    showResult,
    currentQuestionItem,
  ]);

  // 🆕 즐겨찾기 상태 일괄 조회 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    const loadFavoriteStatuses = async () => {
      if (!user?.id || !parsedData) return;

      try {
        // 현재 문제 세트의 모든 문제에 대해 즐겨찾기 상태 확인
        const questions = parsedData.questions.map((_, index) => ({
          questionId: currentQuestionItem.id,
          questionIndex: index,
        }));

        const response = await favoriteAPI.checkMultipleQuestions(
          user.id,
          questions
        );

        // Map으로 변환하여 저장
        const statusMap = new Map();
        response.data.statuss.forEach((status: any) => {
          const key = `${status.questionId}-${status.questionIndex}`;
          statusMap.set(key, {
            isFavorite: status.isFavorite,
            favoriteId: status.favoriteId || null,
          });
        });

        setFavoriteStatusMap(statusMap);
      } catch (error) {
        console.error("즐겨찾기 상태 조회 오류:", error);
      }
    };

    loadFavoriteStatuses();
  }, [user?.id, parsedData, currentQuestionItem.id]);

  // 🔄 현재 문제의 즐겨찾기 상태 가져오기 (캐시에서)
  const getCurrentFavoriteStatus = () => {
    const key = `${currentQuestionItem.id}-${currentQuestionIndex}`;
    return (
      favoriteStatusMap.get(key) || { isFavorite: false, favoriteId: null }
    );
  };

  const { isFavorite, favoriteId } = getCurrentFavoriteStatus();

  // 즐겨찾기 토글 핸들러 - 캐시 업데이트 + 변경 플래그 설정
  const handleFavoriteToggle = async () => {
    if (!user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    setFavoriteLoading(true);

    try {
      const key = `${currentQuestionItem.id}-${currentQuestionIndex}`;

      if (isFavorite && favoriteId) {
        await favoriteAPI.removeQuestion(favoriteId, user.id);
        // 캐시 업데이트
        setFavoriteStatusMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, { isFavorite: false, favoriteId: null });
          return newMap;
        });
        // 🆕 변경 플래그 설정
        setFavoriteChanged(true);
      } else {
        // Prototype: open folder selection dialog instead of immediately adding
        setSelectedFolderToAdd(demoFolders[0].id);
        setOpenFolderDialog(true);
        // stop loading since user will confirm
        setFavoriteLoading(false);
      }
    } catch (error: any) {
      console.error("즐겨찾기 처리 오류:", error);
      alert(
        error.response?.data?.message || "즐겨찾기 처리 중 오류가 발생했습니다."
      );
    } finally {
      // if dialog is open, we already set loading false above
      if (!openFolderDialog) setFavoriteLoading(false);
    }
  };

  // Confirm adding favorite into selected folder (prototype)
  const handleConfirmAddFavorite = async () => {
    if (!user?.id) return alert("로그인이 필요합니다.");
    if (!selectedFolderToAdd) return alert("폴더를 선택해주세요.");

    setFavoriteLoading(true);
    try {
      const response = await favoriteAPI.addQuestion({
        userId: user.id,
        folderId: selectedFolderToAdd,
        questionId: currentQuestionItem.id,
        questionIndex: currentQuestionIndex,
      });

      const key = `${currentQuestionItem.id}-${currentQuestionIndex}`;
      setFavoriteStatusMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(key, {
          isFavorite: true,
          favoriteId: response.data.favoriteId,
        });
        return newMap;
      });

      setFavoriteChanged(true);
      setOpenFolderDialog(false);
    } catch (error: any) {
      console.error("즐겨찾기 추가 오류:", error);
      alert(error.response?.data?.message || "즐겨찾기 추가 중 오류가 발생했습니다.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // 🆕 다시 시작하기
  const handleRestart = useCallback(() => {
    if (isFavoriteMode && favoritesList && favoritesList.length > 0) {
      // 🔄 즐겨찾기 모드일 때: 첫 번째 즐겨찾기 항목으로 이동
      const firstFavorite = favoritesList[0];

      try {
        const rawData = JSON.parse(firstFavorite.rawJson || "{}");
        const parsedQuestion: ParsedQuestion = {
          type: rawData.type || "multiple_choice",
          questions: [],
        };

        if (rawData.questions && Array.isArray(rawData.questions)) {
          parsedQuestion.questions = rawData.questions;
          if (rawData.questions.length > 0) {
            parsedQuestion.type =
              rawData.questions[0].type ||
              detectQuestionType(
                rawData.questions[0],
                firstFavorite.displayType
              );
          }
        } else {
          parsedQuestion.type =
            rawData.type ||
            detectQuestionType(rawData, firstFavorite.displayType);
          parsedQuestion.questions = [rawData];
        }

        parsedQuestion.type = parsedQuestion.type.toLowerCase();
        parsedQuestion.questions.forEach((q) =>
          preprocessQuestion(q, parsedQuestion.type)
        );

        setCurrentQuestionItem(firstFavorite);
        setParsedData(parsedQuestion);
        setUserAnswers(Array(parsedQuestion.questions.length).fill(null));
        setCurrentQuestionIndex(firstFavorite.questionIndex || 0);
        setCurrentFavoriteIndex(0); // 🔄 첫 번째 인덱스로 설정
        setShowResult(false);
        setQuestionResults([]);
        setShowSummary(false);
        setRetryMode(false);
        setWrongQuestionIndices([]);
      } catch (error) {
        console.error("문제 파싱 오류:", error);
        alert("문제를 불러오는데 실패했습니다.");
      }
    } else {
      // 일반 모드일 때
      setCurrentQuestionIndex(0);
      setUserAnswers(Array(parsedData!.questions.length).fill(null));
      setShowResult(false);
      setQuestionResults([]);
      setShowSummary(false);
      setRetryMode(false);
      setWrongQuestionIndices([]);
    }
  }, [parsedData, isFavoriteMode, favoritesList]);

  // 🆕 틀린 문제만 다시 풀기
  const handleRetryWrong = useCallback(() => {
    if (isFavoriteMode && favoritesList) {
      // 🔄 즐겨찾기 모드: favoritesList의 인덱스 기반으로 처리
      const wrongFavoriteIndices = questionResults
        .filter((r) => !r.isCorrect)
        .map((r) => {
          // questionResults의 questionIndex는 각 문제 세트 내의 인덱스
          // 실제 favoritesList에서의 인덱스를 찾아야 함
          return favoritesList.findIndex(
            (item) =>
              item.id === currentQuestionItem.id &&
              (item.questionIndex === r.questionIndex ||
                (!item.questionIndex && r.questionIndex === 0))
          );
        })
        .filter((index) => index !== -1)
        .sort((a, b) => a - b);

      if (wrongFavoriteIndices.length === 0) {
        alert("틀린 문제가 없습니다.");
        return;
      }

      // 첫 번째 틀린 문제로 이동
      const firstWrongFavorite = favoritesList[wrongFavoriteIndices[0]];

      try {
        const rawData = JSON.parse(firstWrongFavorite.rawJson || "{}");
        const parsedQuestion: ParsedQuestion = {
          type: rawData.type || "multiple_choice",
          questions: [],
        };

        if (rawData.questions && Array.isArray(rawData.questions)) {
          parsedQuestion.questions = rawData.questions;
          if (rawData.questions.length > 0) {
            parsedQuestion.type =
              rawData.questions[0].type ||
              detectQuestionType(
                rawData.questions[0],
                firstWrongFavorite.displayType
              );
          }
        } else {
          parsedQuestion.type =
            rawData.type ||
            detectQuestionType(rawData, firstWrongFavorite.displayType);
          parsedQuestion.questions = [rawData];
        }

        parsedQuestion.type = parsedQuestion.type.toLowerCase();
        parsedQuestion.questions.forEach((q) =>
          preprocessQuestion(q, parsedQuestion.type)
        );

        setWrongQuestionIndices(wrongFavoriteIndices);
        setRetryMode(true);
        setCurrentQuestionItem(firstWrongFavorite);
        setParsedData(parsedQuestion);
        setUserAnswers(Array(parsedQuestion.questions.length).fill(null));
        setCurrentQuestionIndex(firstWrongFavorite.questionIndex || 0);
        setCurrentFavoriteIndex(wrongFavoriteIndices[0]);
        setShowResult(false);
        setShowSummary(false);
      } catch (error) {
        console.error("문제 파싱 오류:", error);
        alert("문제를 불러오는데 실패했습니다.");
      }
    } else {
      // 일반 모드
      const wrongIndices = questionResults
        .filter((r) => !r.isCorrect)
        .map((r) => r.questionIndex)
        .sort((a, b) => a - b);

      if (wrongIndices.length === 0) {
        alert("틀린 문제가 없습니다.");
        return;
      }

      setWrongQuestionIndices(wrongIndices);
      setRetryMode(true);
      setCurrentQuestionIndex(wrongIndices[0]);
      setShowResult(false);
      setShowSummary(false);

      // 틀린 문제의 답변만 초기화
      setUserAnswers((prev) => {
        const newAnswers = [...prev];
        wrongIndices.forEach((index) => {
          newAnswers[index] = null;
        });
        return newAnswers;
      });
    }
  }, [questionResults, isFavoriteMode, favoritesList, currentQuestionItem]);

  // 🆕 특정 문제로 이동
  const handleViewQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
    setShowResult(false);
    setShowSummary(false);
  }, []);

  // 🆕 마지막 문제인지 확인
  const isLastQuestion = useMemo(() => {
    if (isFavoriteMode && favoritesList) {
      if (retryMode && wrongQuestionIndices.length > 0) {
        // 재도전 모드: 마지막 틀린 문제인지 확인
        return (
          wrongQuestionIndices.indexOf(currentFavoriteIndex) ===
          wrongQuestionIndices.length - 1
        );
      }
      // 일반 모드: 마지막 즐겨찾기인지 확인
      return currentFavoriteIndex === favoritesList.length - 1;
    }
    if (retryMode) {
      return (
        wrongQuestionIndices.findIndex((i) => i === currentQuestionIndex) ===
        wrongQuestionIndices.length - 1
      );
    }
    return currentQuestionIndex === (parsedData?.questions.length || 0) - 1;
  }, [
    isFavoriteMode,
    favoritesList,
    currentFavoriteIndex,
    retryMode,
    wrongQuestionIndices,
    currentQuestionIndex,
    parsedData,
  ]);

  if (parsingError) {
    return (
      <Box sx={{ mt: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => onClose()} // 🔄 변경사항 없으므로 false 전달 불필요
          sx={{ mb: 2 }}
        >
          돌아가기
        </Button>
        <Alert severity="error">{parsingError}</Alert>
      </Box>
    );
  }

  if (!parsedData) {
    return (
      <Box sx={{ mt: 4, textAlign: "center" }}>
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

  // 🆕 결과 요약 화면
  if (showSummary) {
    return (
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onClose}>
            목록으로 돌아가기
          </Button>
          <Typography variant="h4" sx={{ ml: 2, flexGrow: 1 }}>
            {retryMode ? "재도전 결과" : "학습 완료"}
          </Typography>
        </Box>

        <QuestionResultSummary
          results={questionResults}
          totalQuestions={
            isFavoriteMode && favoritesList
              ? favoritesList.length
              : parsedData.questions.length
          }
          onRestart={handleRestart}
          onRetryWrong={handleRetryWrong}
          onClose={onClose}
          onViewQuestion={handleViewQuestion}
        />
      </Box>
    );
  }

  // 🆕 정답 표시 함수 추가
  const renderCorrectAnswer = () => {
    if (!parsedData || !currentQuestion) return null;

    const type = parsedData.type.toLowerCase();

    switch (type) {
      case "multiple_choice":
        const options = currentQuestion.options || [];
        const correctOption = options.find(
          (opt: any) => opt.id === String(currentQuestion.correct_answer)
        );
        return correctOption
          ? `${correctOption.id}. ${correctOption.text}`
          : currentQuestion.correct_answer;

      case "true_false":
        return currentQuestion.correct_answer ? "참 (True)" : "거짓 (False)";

      case "sequence":
        const correctSequence = currentQuestion.correct_sequence || [];
        const items = currentQuestion.items || [];
        return correctSequence
          .map((id: number, index: number) => {
            const item = items.find((i: any) => i.id === id);
            return `${index + 1}. ${item?.text || `항목 ${id}`}`;
          })
          .join(" → ");

      case "fill_in_the_blank":
        if (
          currentQuestion.correct_answers &&
          Array.isArray(currentQuestion.correct_answers)
        ) {
          return currentQuestion.correct_answers.join(", ");
        }
        return (
          currentQuestion.correct_answer ||
          currentQuestion.blanks?.[0]?.correct_answer ||
          ""
        );

      case "short_answer":
        const alternatives = currentQuestion.alternative_answers || [];
        if (alternatives.length > 0) {
          return `${currentQuestion.correct_answer} (또는 ${alternatives.join(
            ", "
          )})`;
        }
        return currentQuestion.correct_answer;

      case "descriptive":
        return currentQuestion.model_answer || "모범 답안 참조";

      default:
        return currentQuestion.correct_answer || "정답 정보 없음";
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      {/* Prototype: folder selection dialog for adding favorite */}
      <Dialog open={openFolderDialog} onClose={() => setOpenFolderDialog(false)}>
        <DialogTitle>즐겨찾기 폴더 선택 </DialogTitle>
        <DialogContent>
          <RadioGroup
            value={String(selectedFolderToAdd ?? "")}
            onChange={(e) => setSelectedFolderToAdd(Number(e.target.value))}
          >
            {demoFolders.map((f) => (
              <FormControlLabel
                key={f.id}
                value={String(f.id)}
                control={<Radio />}
                label={f.name}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFolderDialog(false)}>취소</Button>
          <Button variant="contained" onClick={handleConfirmAddFavorite}>
            선택 및 추가
          </Button>
        </DialogActions>
      </Dialog>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onClose}>
          목록으로 돌아가기
        </Button>
        <Typography variant="h4" sx={{ ml: 2, flexGrow: 1 }}>
          {retryMode ? "틀린 문제 재도전" : "문제 풀기"}
        </Typography>
        <Tooltip
          title={isFavorite ? "이 문제 즐겨찾기 제거" : "이 문제 즐겨찾기 추가"}
        >
          <IconButton
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
            sx={{ mr: 2 }}
          >
            {favoriteLoading ? (
              <CircularProgress size={24} />
            ) : isFavorite ? (
              <StarIcon sx={{ color: "#FFD700", fontSize: 32 }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: 32 }} />
            )}
          </IconButton>
        </Tooltip>
        <Typography variant="subtitle1" color="text.secondary">
          {retryMode && isFavoriteMode && wrongQuestionIndices.length > 0
            ? `${wrongQuestionIndices.indexOf(currentFavoriteIndex) + 1} / ${
                wrongQuestionIndices.length
              } (틀린 문제)`
            : retryMode
            ? `${
                wrongQuestionIndices.findIndex(
                  (i) => i === currentQuestionIndex
                ) + 1
              } / ${wrongQuestionIndices.length} (틀린 문제)`
            : isFavoriteMode
            ? `즐겨찾기 ${currentFavoriteIndex + 1} / ${favoritesList.length}`
            : `${currentQuestionIndex + 1} / ${
                parsedData?.questions.length || 0
              }`}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          파일명: {currentQuestionItem.name}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          문제 유형: {currentQuestionItem.displayType}
        </Typography>
        <Divider sx={{ my: 2 }} />

        {renderQuestionComponent()}

        {/* 🆕 정답 확인 후 간단한 정답 정보 표시 */}
        {showResult && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              mb: 3,
              mt: 3,
              borderRadius: 2,
              bgcolor: isCorrect ? "success.main" : "error.main",
            }}
          >
            <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
              {isCorrect ? "정답입니다!" : "오답입니다!"}
            </Typography>

            <Card sx={{ bgcolor: "background.paper" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  정답
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {renderCorrectAnswer()}
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        )}

        {/* 🆕 해설 토글 버튼 및 필드 */}
        {showResult && (
          <Box sx={{ mt: 3, mb: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setShowExplanation(!showExplanation)}
              sx={{ mb: showExplanation ? 2 : 0 }}
            >
              {showExplanation ? "해설 숨기기" : "해설 보기"}
            </Button>

            {showExplanation && (
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "grey.100",
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  해설
                </Typography>

                <Card sx={{ bgcolor: "background.paper" }}>
                  <CardContent>
                    <Typography variant="body1">
                      {currentQuestion.explanation ||
                        "이 문제에 대한 해설이 없습니다."}
                    </Typography>
                  </CardContent>
                </Card>
              </Paper>
            )}
          </Box>
        )}

        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={handlePrevQuestion}
            disabled={
              isFavoriteMode
                ? currentFavoriteIndex === 0
                : currentQuestionIndex === 0
            }
          >
            이전 문제
          </Button>

          {!showResult ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheckResult}
              disabled={isCheckButtonDisabled}
            >
              정답 확인
            </Button>
          ) : (
            <Button
              variant="contained"
              color={isLastQuestion ? "success" : "primary"}
              onClick={
                isLastQuestion ? () => setShowSummary(true) : handleNextQuestion
              }
            >
              {isLastQuestion ? "결과 보기" : "다음 문제"}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
