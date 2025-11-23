// src/components/upload/SummarySettings.tsx
import React from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import SchoolIcon from "@mui/icons-material/School";
import ShortTextIcon from "@mui/icons-material/ShortText";
import {
  summaryLabels,
  aiSummaryPromptKeys,
  dbSummaryPromptKeys_Korean,
  FIELD_OPTIONS,
  LEVEL_OPTIONS,
} from "../../constants/upload";

interface SummarySettingsProps {
  sumTab: number;
  setSumTab: (value: number) => void;
  sumField: string;
  setSumField: (value: string) => void;
  sumLevel: string;
  setSumLevel: (value: string) => void;
  sumSentCount: number; // 추가
  setSumSentCount: (value: number) => void;
  sumTopicCount: number;
  setSumTopicCount: (value: number) => void;
  sumKeywordCount: number;
  setSumKeywordCount: (value: number) => void;
  keywords: string[];
  setKeywords: (value: string[]) => void;
  setAiSummaryType: (value: any) => void;
  setDbSummaryTypeKorean: (value: any) => void;
}

export default function SummarySettings({
  sumTab,
  setSumTab,
  sumField,
  setSumField,
  sumLevel,
  setSumLevel,
  sumSentCount, // 추가
  setSumSentCount,
  sumTopicCount,
  setSumTopicCount,
  sumKeywordCount,
  setSumKeywordCount,
  keywords,
  setKeywords,
  setAiSummaryType,
  setDbSummaryTypeKorean,
}: SummarySettingsProps) {
  const handleKeywordChange = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  return (
    <>
      {/* Summary subtype Tabs */}
      <Box
        sx={{
          mb: 4,
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "background.paper",
          boxShadow: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Tabs
          value={sumTab}
          onChange={(_, v) => {
            setSumTab(v);
            setAiSummaryType(aiSummaryPromptKeys[v]);
            setDbSummaryTypeKorean(dbSummaryPromptKeys_Korean[v]);
          }}
          variant="fullWidth"
          TabIndicatorProps={{ style: { display: "none" } }}
          sx={{ "& .MuiTabs-flexContainer": { gap: 0.5, p: 1 } }}
        >
          {summaryLabels.map((label, idx) => (
            <Tab
              key={idx}
              label={label}
              sx={{
                textTransform: "none",
                color: "text.secondary",
                bgcolor: "transparent",
                borderRadius: 2,
                minHeight: 48,
                fontSize: "0.9rem",
                fontWeight: 500,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontWeight: 600,
                  transform: "translateY(-1px)",
                  boxShadow: 1,
                },
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "light"
                      ? "primary.light"
                      : "primary.dark",
                  color: "primary.contrastText",
                  transform: "translateY(-1px)",
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Summary Options */}
      <Box
        sx={{
          background: "linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)",
          borderRadius: 3,
          p: 3,
          mb: 3,
          border: "1px solid rgba(148, 163, 184, 0.2)",
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: 2.5,
            color: "#1e293b",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <TuneIcon sx={{ color: "#6366f1" }} />
          요약 설정
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {/* 분야 */}
          <Box sx={{ width: { xs: "100%", sm: "calc(33.333% - 16px)" } }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "#475569", fontWeight: 500 }}
            >
              분야
            </Typography>
            <FormControl fullWidth>
              <Select
                value={sumField}
                onChange={(e) => setSumField(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#ffffff",
                  border: "2px solid transparent",
                  "&:hover": {
                    borderColor: "#6366f1",
                    backgroundColor: "#fefefe",
                  },
                  "&.Mui-focused": {
                    borderColor: "#6366f1",
                    boxShadow: "0 0 0 3px rgba(99,102,241,0.1)",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {FIELD_OPTIONS.map((option) => (
                  <MenuItem
                    key={option}
                    value={option}
                    sx={{
                      "&:hover": { backgroundColor: "#f1f5f9" },
                      "&.Mui-selected": {
                        backgroundColor: "#e0e7ff",
                        "&:hover": { backgroundColor: "#c7d2fe" },
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SchoolIcon sx={{ fontSize: 18, color: "#6366f1" }} />
                      {option}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 난이도 */}
          <Box sx={{ width: { xs: "100%", sm: "calc(33.333% - 16px)" } }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "#475569", fontWeight: 500 }}
            >
              난이도
            </Typography>
            <FormControl fullWidth>
              <Select
                value={sumLevel}
                onChange={(e) => setSumLevel(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#ffffff",
                  border: "2px solid transparent",
                  "&:hover": {
                    borderColor: "#10b981",
                    backgroundColor: "#fefefe",
                  },
                  "&.Mui-focused": {
                    borderColor: "#10b981",
                    boxShadow: "0 0 0 3px rgba(16,185,129,0.1)",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                {LEVEL_OPTIONS.map(({ value, icon }) => (
                  <MenuItem
                    key={value}
                    value={value}
                    sx={{
                      "&:hover": { backgroundColor: "#f0fdf4" },
                      "&.Mui-selected": {
                        backgroundColor: "#dcfce7",
                        "&:hover": { backgroundColor: "#bbf7d0" },
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span style={{ fontSize: "16px" }}>{icon}</span>
                      {value}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 요약 유형별 세부 설정 */}
          {sumTab === 2 ? (
            // 주제 요약일 때는 주제 수
            <>
              {/* 문장 수 (주제 요약 옵션으로 추가) */}
              <Box sx={{ width: { xs: "100%", sm: "calc(33.333% - 16px)" } }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "#475569",
                    fontWeight: 500,
                  }}
                >
                  {/* <FormatListNumberedIcon sx={{ fontSize: 18, color: '#f59e0b' }} />*/}
                  문장 수
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={sumSentCount}
                    onChange={(e) => setSumSentCount(Number(e.target.value))}
                    displayEmpty
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                      border: "2px solid transparent",
                      "&:hover": {
                        borderColor: "#f59e0b",
                        backgroundColor: "#fefefe",
                      },
                      "&.Mui-focused": {
                        borderColor: "#f59e0b",
                        boxShadow: "0 0 0 3px rgba(245,158,11,0.1)",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <MenuItem
                        key={n}
                        value={n}
                        sx={{
                          "&:hover": { backgroundColor: "#fffbeb" },
                          "&.Mui-selected": {
                            backgroundColor: "#fef3c7",
                            "&:hover": { backgroundColor: "#fde68a" },
                          },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: "#f59e0b",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {n}
                          </Box>
                          {n}개
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* 주제 수 (기존 코드 그대로 사용) */}
              <Box sx={{ width: { xs: "100%", sm: "calc(33.333% - 16px)" } }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "#475569",
                    fontWeight: 500,
                  }}
                >
                  {/*<SubjectIcon sx={{ fontSize: 18, color: '#3b82f6' }} />*/}
                  주제 수
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={sumTopicCount}
                    onChange={(e) => setSumTopicCount(Number(e.target.value))}
                    displayEmpty
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                      border: "2px solid transparent",
                      "&:hover": {
                        borderColor: "#3b82f6",
                        backgroundColor: "#fefefe",
                      },
                      "&.Mui-focused": {
                        borderColor: "#3b82f6",
                        boxShadow: "0 0 0 3px rgba(59,130,246,0.1)",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <MenuItem
                        key={n}
                        value={n}
                        sx={{
                          "&:hover": { backgroundColor: "#eff6ff" },
                          "&.Mui-selected": {
                            backgroundColor: "#dbeafe",
                            "&:hover": { backgroundColor: "#bfdbfe" },
                          },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: "#3b82f6",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {n}
                          </Box>
                          {n}개
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </>
          ) : sumTab === 4 ? (
            // 키워드 요약일 때는 키워드 수
            <>
              {/* 문장 수 콤보박스 */}
              <Box sx={{ width: { xs: "100%", sm: "calc(33.333% - 16px)" } }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "#475569",
                    fontWeight: 500,
                  }}
                >
                  문장 수
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={sumSentCount}
                    onChange={(e) => setSumSentCount(Number(e.target.value))}
                    displayEmpty
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                      border: "2px solid transparent",
                      "&:hover": {
                        borderColor: "#f59e0b",
                        backgroundColor: "#fefefe",
                      },
                      "&.Mui-focused": {
                        borderColor: "#f59e0b",
                        boxShadow: "0 0 0 3px rgba(245,158,11,0.1)",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <MenuItem
                        key={n}
                        value={n}
                        sx={{
                          "&:hover": { backgroundColor: "#fffbeb" },
                          "&.Mui-selected": {
                            backgroundColor: "#fef3c7",
                            "&:hover": { backgroundColor: "#fde68a" },
                          },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: "#f59e0b",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {n}
                          </Box>
                          {n}개
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: "100%", sm: "calc(33.333% - 16px)" } }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "#475569",
                    fontWeight: 500,
                  }}
                >
                  {/*<ShortTextIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />*/}
                  키워드 수
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={sumKeywordCount}
                    onChange={(e) => setSumKeywordCount(Number(e.target.value))}
                    displayEmpty
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                      border: "2px solid transparent",
                      "&:hover": {
                        borderColor: "#8b5cf6",
                        backgroundColor: "#fefefe",
                      },
                      "&.Mui-focused": {
                        borderColor: "#8b5cf6",
                        boxShadow: "0 0 0 3px rgba(139,92,246,0.1)",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <MenuItem
                        key={n}
                        value={n}
                        sx={{
                          "&:hover": { backgroundColor: "#f5f3ff" },
                          "&.Mui-selected": {
                            backgroundColor: "#ede9fe",
                            "&:hover": { backgroundColor: "#ddd6fe" },
                          },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: "#8b5cf6",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {n}
                          </Box>
                          {n === 0 ? "자동" : `${n}개`}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </>
          ) : (
            // 기본/핵심/목차 요약일 때는 문장 수
            <Box sx={{ width: { xs: "100%", sm: "calc(33.333% - 16px)" } }}>
              <Box sx={{ position: "relative" }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, color: "#475569", fontWeight: 500 }}
                >
                  문장 수
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={sumSentCount}
                    onChange={(e) => setSumSentCount(Number(e.target.value))}
                    displayEmpty
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                      border: "2px solid transparent",
                      "&:hover": {
                        borderColor: "#f59e0b",
                        backgroundColor: "#fefefe",
                      },
                      "&.Mui-focused": {
                        borderColor: "#f59e0b",
                        boxShadow: "0 0 0 3px rgba(245,158,11,0.1)",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <MenuItem
                        key={n}
                        value={n}
                        sx={{
                          "&:hover": { backgroundColor: "#fffbeb" },
                          "&.Mui-selected": {
                            backgroundColor: "#fef3c7",
                            "&:hover": { backgroundColor: "#fde68a" },
                          },
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: "#f59e0b",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {n}
                          </Box>
                          {n}개
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </Box>

        {/* 키워드 입력 필드 (새로 추가) */}
        {sumTab === 4 && sumKeywordCount > 0 && (
          <Box
            sx={{
              width: "100%",
              mt: 2,
              p: 2,
              backgroundColor: "#f3f4f6",
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
              >
                <ShortTextIcon sx={{ fontSize: 20, color: "#8b5cf6" }} />
                키워드 입력 (각 10자 이내)
              </Typography>

              <Button
                size="small"
                variant="outlined"
                onClick={() => setKeywords(Array(sumKeywordCount).fill(""))}
                sx={{
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.5,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#8b5cf6",
                  borderColor: "#8b5cf6",
                  "&:hover": {
                    borderColor: "#7c3aed",
                    backgroundColor: "rgba(139,92,246,0.05)",
                  },
                }}
              >
                전체 초기화
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {Array.from({ length: sumKeywordCount }).map((_, index) => (
                <TextField
                  key={index}
                  value={keywords[index] || ""}
                  onChange={(e) => handleKeywordChange(index, e.target.value)}
                  placeholder="키워드를 입력하세요"
                  size="small"
                  inputProps={{ maxLength: 10 }}
                  sx={{
                    width: {
                      xs: "100%",
                      sm: "calc(50% - 8px)",
                      md: "calc(33.333% - 11px)",
                    },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "#ffffff",
                      border: "2px solid transparent",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      "&:hover": {
                        borderColor: "#8b5cf6",
                        backgroundColor: "#fefefe",
                      },
                      "&.Mui-focused": {
                        borderColor: "#8b5cf6",
                        boxShadow: "0 0 0 3px rgba(139,92,246,0.1)",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Optional: Summary Preview Card */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: "rgba(99,102,241,0.05)",
            borderRadius: 2,
            border: "1px dashed rgba(99,102,241,0.2)",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#6366f1", fontWeight: 500, fontSize: "1rem" }}
          >
            설정 미리보기: {sumField} 분야의 {sumLevel} 수준으로
            {sumTab === 0 && ` ${sumSentCount}개 문장 기본 요약`}
            {sumTab === 1 && ` ${sumSentCount}개 문장 핵심 요약`}
            {sumTab === 2 && ` ${sumTopicCount}개 주제 요약`}
            {sumTab === 3 && ` ${sumSentCount}개 문장 목차 요약`}
            {sumTab === 4 &&
              ` ${sumSentCount}개 문장, ${
                sumKeywordCount === 0 ? "자동" : sumKeywordCount + "개"
              } 키워드 요약`}
            {sumTab === 4 &&
              sumKeywordCount > 0 &&
              keywords.filter((k) => k && k.trim()).length > 0 && (
                <Box
                  component="span"
                  sx={{ display: "block", mt: 1, color: "#8b5cf6" }}
                >
                  입력 키워드:{" "}
                  {keywords.filter((k) => k && k.trim()).join(", ")}
                </Box>
              )}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
