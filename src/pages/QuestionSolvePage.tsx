import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Pagination
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { questionAPI } from '../services/api';
import { QuestionItem } from '../types/mypage';
import QuestionSolver from '../components/questions/QuestionSolver';
import PageNavigator from '../components/common/PageNavigator';

export default function QuestionSolvePage() {
  const { user } = useAuth();
  const [questionItems, setQuestionItems] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionPage, setQuestionPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [solveMode, setSolveMode] = useState(false);

  // 데이터 불러오기
  useEffect(() => {
    if (!user?.id) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    questionAPI.getUserQuestions(user.id)
      .then((qRes) => {
        setQuestionItems(
          qRes.data.questions.map((q) => {
            const date = new Date(q.created_at);

            // 문제 텍스트 저장
            const questionText = q.question_text;

            try {
              const data = JSON.parse(q.question_text);
              return {
                id: q.selection_id,
                name: q.file_name,  // 원본 파일명
                displayName: q.question_name || q.file_name,  // 문제 이름 (없으면 파일명)
                date: date.toLocaleDateString("ko-KR"),
                time: date.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                createdAt: date.toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                text:
                  data.question ||
                  data.questions?.[0]?.question_text ||
                  "문제 내용 없음",
                type: data.type,
                displayType: q.question_type || "기타",
                options: data.options,
                answer: data.answer,
                correct_option_index: data.correct_option_index,
                explanation: data.explanation,
                rawJson: questionText, // 원본 JSON 저장
              };
            } catch {
              return {
                id: q.selection_id,
                name: q.file_name,  // 원본 파일명
                displayName: q.question_name || q.file_name,  // 문제 이름 (없으면 파일명)
                date: date.toLocaleDateString("ko-KR"),
                time: date.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                createdAt: date.toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                text: q.question_text,
                type: "unknown",
                displayType: q.question_type || "기타",
                rawJson: questionText, // 원본 JSON 저장
              };
            }
          })
        );
      })
      .catch(() => setError("문제 목록을 불러오는 중 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, [user]);

  // 문제 선택 처리 함수
  const handleQuestionSelect = (item: QuestionItem) => {
    setSelectedQuestion(item);
    setSolveMode(true);
  };

  // 문제 풀기 종료 처리
  const handleCloseSolver = () => {
    setSolveMode(false);
    setSelectedQuestion(null);
  };

  if (loading)
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box textAlign="center" mt={8}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  return (
    <Box sx={{ bgcolor: "background.paper", minHeight: "100vh" }}>
      <Header />
      <PageNavigator />
      <Box sx={{ pt: "60px", px: 4, pb: 6, maxWidth: 1200, mx: "auto" }}>
        {!solveMode ? (
          <>
            <Typography
              variant="h2"
              fontWeight="bold"
              gutterBottom
              sx={{
                mb: 4,
                color: "text.primary",
                borderBottom: "2px solid",
                borderColor: "primary.light",
                paddingBottom: 2,
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: -2,
                  left: 0,
                  width: "80px",
                  height: "4px",
                  backgroundColor: "primary.dark",
                },
              }}
            >
              문제 풀기
            </Typography>

            <Paper elevation={3} sx={{ mb: 5, p: 3, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.main">
                내가 생성한 문제로 학습하기
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" paragraph>
                문제를 풀면서 핵심 내용을 다시 한번 확인하세요. 아래 목록에서 문제를 선택하면 해당 문제를 풀어볼 수 있습니다.
              </Typography>
              <Typography variant="body1" paragraph>
                문제를 풀고 나면 정답과 해설을 통해 자신의 이해도를 확인할 수 있습니다.
              </Typography>
            </Paper>

            <Box mb={6}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>❓ 내 문제 모음</Typography>
              <TableContainer component={Paper}>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>이름</TableCell>
                      <TableCell align="center">생성 날짜</TableCell>
                      <TableCell align="center">유형</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questionItems.slice((questionPage - 1) * 5, questionPage * 5).map(item => (
                      <TableRow key={item.id} hover onClick={() => handleQuestionSelect(item)} sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Box sx={{ display:'flex', alignItems:'center' }}>
                            <PictureAsPdfIcon color="error" sx={{ mr:1 }} />
                            <Typography noWrap>{item.displayName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{item.createdAt}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={item.displayType || '기타'} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {questionItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">저장된 항목이 없습니다.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {Math.ceil(questionItems.length / 5) > 0 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination 
                    count={Math.ceil(questionItems.length / 5)} 
                    page={questionPage}
                    onChange={(_, p) => setQuestionPage(p)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Box>
          </>
        ) : (
          selectedQuestion && (
            <QuestionSolver 
              questionItem={selectedQuestion} 
              onClose={handleCloseSolver}
            />
          )
        )}
      </Box>
    </Box>
  );
}