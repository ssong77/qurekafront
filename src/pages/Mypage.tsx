// src/pages/Mypage.tsx
import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  IconButton,
  Stack,
} from "@mui/material";
import { Close, CheckCircleOutline, DeleteForever } from "@mui/icons-material";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { summaryAPI, questionAPI } from "../services/api";
import { FileItem, QuestionItem } from "../types/mypage";
import FileListSection from "../components/mypage/FileListSection";
import QuestionDetailDialog from "../components/mypage/QuestionDetailDialog";
import { downloadAsPDF } from "../utils/pdfUtils";
import PageNavigator from "../components/common/PageNavigator"; // 추가 임포트
import RenameDialog from "../components/mypage/RenameDialog";

export default function Mypage() {
  const { user } = useAuth();
  const [summaryItems, setSummaryItems] = useState<FileItem[]>([]);
  const [questionItems, setQuestionItems] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryPage, setSummaryPage] = useState(1);
  const [questionPage, setQuestionPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogText, setDialogText] = useState("");
  const [activeViewItem, setActiveViewItem] = useState<
    FileItem | QuestionItem | null
  >(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    type: "summary" | "question";
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  // PDF 다운로드 상태 추가
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // 폰트 로드
  useEffect(() => {
    fetch("/fonts/NotoSansKR-Regular.ttf")
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        const b64 = btoa(
          new Uint8Array(buf).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        // @ts-ignore
        jsPDF.API.addFileToVFS("NotoSansKR-Regular.ttf", b64);
        // @ts-ignore
        jsPDF.API.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
      })
      .catch(console.error);
  }, []);

  // 데이터 불러오기
  useEffect(() => {
    if (!user?.id) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    Promise.all([
      summaryAPI.getUserSummaries(user.id),
      questionAPI.getUserQuestions(user.id),
    ])
      .then(([sRes, qRes]) => {
        setSummaryItems(
          sRes.data.summaries.map((s) => {
            const date = new Date(s.created_at);

            return {
              id: s.selection_id,
              name: s.file_name, // 원본 파일명
              displayName: s.summary_name || s.file_name, // 요약본 이름 (없으면 파일명)
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
              text: s.summary_text,
              summaryType: s.summary_type || "기본 요약",
            };
          })
        );

        setQuestionItems(
          qRes.data.questions.map((q) => {
            const date = new Date(q.created_at);

            // 문제 텍스트 저장
            const questionText = q.question_text;

            try {
              const data = JSON.parse(q.question_text);
              return {
                id: q.selection_id,
                name: q.file_name, // 원본 파일명
                displayName: q.question_name || q.file_name, // 문제 이름 (없으면 파일명)
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
                name: q.file_name, // 원본 파일명
                displayName: q.question_name || q.file_name, // 문제 이름 (없으면 파일명)
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
      .catch(() => setError("내역을 불러오는 중 오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, [user]);

  // 다이얼로그 열기 함수
  const handleOpenDialog = (item: FileItem | QuestionItem) => {
    setDialogTitle(item.displayName); // displayName으로 변경
    setDialogText(item.text);
    setActiveViewItem(item);
    setDialogOpen(true);
  };

  // 삭제 확인 다이얼로그 표시 함수
  const handleDeleteConfirm = (id: number, type: "summary" | "question") => {
    setItemToDelete({ id, type });
    setDeleteConfirmOpen(true);
  };

  // 실제 삭제 수행 함수
  const handleDeleteConfirmed = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "summary") {
        await summaryAPI.deleteSummary(itemToDelete.id);
        setSummaryItems((prev) =>
          prev.filter((item) => item.id !== itemToDelete.id)
        );
        setSnackbar({
          open: true,
          message: "요약이 삭제되었습니다.",
          severity: "success",
        });
      } else {
        await questionAPI.deleteQuestion(itemToDelete.id);
        setQuestionItems((prev) =>
          prev.filter((item) => item.id !== itemToDelete.id)
        );
        setSnackbar({
          open: true,
          message: "문제가 삭제되었습니다.",
          severity: "success",
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: `${
          itemToDelete.type === "summary" ? "요약" : "문제"
        } 삭제에 실패했습니다.`,
        severity: "error",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  // PDF 다운로드 함수
  const handleDownloadPDF = async (
    item: FileItem | QuestionItem,
    skipLoading?: boolean
  ) => {
    try {
      if (!skipLoading) {
        setDownloadingPdf(true);
      }
      if ("rawJson" in item && item.rawJson) {
        await downloadAsPDF(
          item.rawJson,
          item.displayName || item.name || "question",
          (item as QuestionItem).displayType || "문제"
        );
      } else {
        await downloadAsPDF(
          item.text,
          item.displayName || item.name || "summary",
          (item as FileItem).summaryType || "요약"
        );
      }
    } catch (error) {
      console.error("PDF 다운로드 오류:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    } finally {
      if (!skipLoading) {
        setDownloadingPdf(false);
      }
    }
  };

  // 이름 변경 관련 상태 추가
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<{
    item: FileItem | QuestionItem;
    type: "summary" | "question";
  } | null>(null);

  // 이름 변경 다이얼로그 열기
  const handleRenameClick = (
    item: FileItem | QuestionItem,
    type: "summary" | "question"
  ) => {
    setItemToRename({ item, type });
    setRenameDialogOpen(true);
  };

  // 이름 변경 확인 처리
  // 🔄 이름 변경 확인 처리 - 로컬 상태만 업데이트
  const handleRenameConfirm = async (newName: string) => {
    if (!itemToRename) return;

    const { item, type } = itemToRename;

    try {
      if (type === "summary") {
        await summaryAPI.updateSummaryName(item.id, newName);
        setSummaryItems((prev) =>
          prev.map((s) =>
            s.id === item.id ? { ...s, displayName: newName } : s
          )
        );
        setSnackbar({
          open: true,
          message: "요약 이름이 변경되었습니다.",
          severity: "success",
        });
      } else {
        await questionAPI.updateQuestionName(item.id, newName);
        setQuestionItems((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, displayName: newName } : q
          )
        );
        setSnackbar({
          open: true,
          message: "문제 이름이 변경되었습니다.",
          severity: "success",
        });
      }

      // 활성 뷰 아이템이 변경된 아이템이면 업데이트
      if (activeViewItem && activeViewItem.id === item.id) {
        setActiveViewItem({ ...activeViewItem, displayName: newName });
        setDialogTitle(newName);
      }

      // 🗑️ loadAllData() 호출 제거 - 로컬 상태 업데이트로 충분
    } catch (error: any) {
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          `${type === "summary" ? "요약" : "문제"} 이름 변경에 실패했습니다.`,
        severity: "error",
      });
      throw error;
    }
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
    <Box
      sx={{
        bgcolor: "background.paper",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <Header />
      <PageNavigator />

      {/* PDF 다운로드 중 로딩 오버레이 */}
      {downloadingPdf && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            zIndex: 1500,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: "medium" }}>
            PDF 생성 중...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            잠시만 기다려 주세요
          </Typography>
        </Box>
      )}

      <Box sx={{ pt: "60px", px: 4, pb: 6, maxWidth: 1200, mx: "auto" }}>
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
          마이페이지
        </Typography>

        {/* 스낵바 - UploadPage.tsx 스타일 적용 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={10000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ mt: 8 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              
              bgcolor: snackbar.severity === "success" ? "#E8F9EE" : "#FFEBEE",
              color: snackbar.severity === "success" ? "#1a5d3a" : "#c62828",
              borderRadius: 2,
              boxShadow: 3,
              px: 2.5,
              py: 1.5,
            }}
          >
            {snackbar.severity === "success" && (
              <CheckCircleOutline sx={{ fontSize: 24, color: "#1a5d3a" }} />
            )}
            <Typography sx={{ fontSize: "1rem", fontWeight: 500, flexGrow: 1 }}>
              {snackbar.message}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))}
              sx={{
                color: snackbar.severity === "success" ? "#1a5d3a" : "#c62828",
                "&:hover": {
                  bgcolor:
                    snackbar.severity === "success"
                      ? "rgba(26, 93, 58, 0.1)"
                      : "rgba(198, 40, 40, 0.1)",
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Snackbar>

        <FileListSection
          title="📄 저장된 요약"
          titleVariant="h4"
          items={summaryItems}
          currentPage={summaryPage}
          onPageChange={(_, p) => setSummaryPage(p)}
          onView={handleOpenDialog}
          onDelete={(item) => handleDeleteConfirm(item.id, "summary")}
          onDownload={handleDownloadPDF}
          onRename={(item) => handleRenameClick(item, "summary")}
        />

        <FileListSection
          title="❓ 생성된 문제"
          titleVariant="h4"
          items={questionItems}
          currentPage={questionPage}
          onPageChange={(_, p) => setQuestionPage(p)}
          onView={handleOpenDialog}
          onDelete={(item) => handleDeleteConfirm(item.id, "question")}
          onDownload={handleDownloadPDF}
          onRename={(item) => handleRenameClick(item, "question")}
        />
      </Box>

      {/* 상세 보기 다이얼로그 */}
      <QuestionDetailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        item={activeViewItem}
        dialogTitle={dialogTitle}
        dialogText={dialogText}
        onDownload={handleDownloadPDF}
        onRename={(item) => {
          const type = summaryItems.find((s) => s.id === item.id)
            ? "summary"
            : "question";
          handleRenameClick(item, type);
        }}
      />

      {/* 이름 변경 다이얼로그 */}
      <RenameDialog
        open={renameDialogOpen}
        onClose={() => {
          setRenameDialogOpen(false);
          setItemToRename(null);
        }}
        currentName={itemToRename?.item.displayName || ""}
        itemType={itemToRename?.type || "summary"}
        onConfirm={handleRenameConfirm}
      />

      {/* 🎨 삭제 확인 다이얼로그 - 개선된 디자인 */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            padding: 2,
            minWidth: 420,
          },
        }}
      >
        <Box sx={{ textAlign: "center", pt: 2 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <DeleteForever sx={{ fontSize: 32, color: "#DC2626" }} />
          </Box>

          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ mb: 1, color: "#1F2937" }}
          >
            {itemToDelete?.type === "summary" ? "요약" : "문제"} 삭제
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
            정말 이 {itemToDelete?.type === "summary" ? "요약" : "문제"}을(를)
            삭제하시겠습니까?
          </Typography>

          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 2, fontWeight: 500 }}
          >
            삭제한 항목은 복구할 수 없습니다
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, mt: 3, px: 2, pb: 1 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleDeleteConfirmed}
            sx={{
              py: 1.5,
              borderRadius: 2,
              bgcolor: "#DC2626",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "#B91C1C",
              },
            }}
          >
            삭제하기
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{
              py: 1.5,
              borderRadius: 2,
              borderColor: "#D1D5DB",
              color: "#6B7280",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#9CA3AF",
                bgcolor: "#F9FAFB",
              },
            }}
          >
            취소
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
