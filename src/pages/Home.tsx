import React from "react";
import { Container, Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import PageNavigator from "../components/common/PageNavigator";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Fade from "@mui/material/Fade";
import { styled } from "@mui/material/styles";

import questionTypesImage from "../assets/images/questionType.png";
import projectMatterImage from "../assets/images/project_matter.png";
import projectMatter2Image from "../assets/images/project_matter2.png";
import aiImage from "../assets/images/ai.png";
import heyImage from "../assets/images/heyImage.png";

import ServiceFlowDemo from '../components/ServiceFlowDemo';


// 스타일드 컴포넌트
const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: "20vh",
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)",
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: "#ffffff",
  borderRadius: theme.spacing(2.5),
  border: "1px solid rgba(229, 231, 235, 0.8)",
  boxShadow: "0 4px 25px rgba(0, 0, 0, 0.04)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
  border: 0,
  borderRadius: theme.spacing(3),
  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
  color: "white",
  height: 56,
  padding: "0 32px",
  fontSize: "1.1rem",
  fontWeight: "600",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)",
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)", // 파란색 계열로 변경 (PrimaryButton과 동일)
  border: 0,
  borderRadius: theme.spacing(3),
  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)", // 그림자 색상도 파란색에 맞게 변경
  color: "white",
  height: 56,
  padding: "0 32px",
  fontSize: "1.1rem",
  fontWeight: "600",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)", // hover 색상도 PrimaryButton과 맞춤
    transform: "translateY(-2px)",
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.4)", // 그림자 색상도 파란색에 맞게 변경
  },
}));

const FeatureImage = styled("img")(({ theme }) => ({
  width: "100%",
  maxWidth: 400,
  height: "auto",
  borderRadius: theme.spacing(2),
  transition: "transform 0.3s ease",
  filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))",
  "&:hover": {
    transform: "scale(1.03)",
  },
}));

const NumberBadge = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  fontSize: "1.3rem",
  marginRight: theme.spacing(3),
  flexShrink: 0,
  boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
}));

const AccentSection = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)",
  },
}));

function Home() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <>
      {/* 수정된 Hero Section - 텍스트 왼쪽, 이미지 오른쪽 */}
      <HeroSection>
        <Header />
        <PageNavigator />
        <Container
          maxWidth="lg"
          sx={{
            flex: 1,
            display: "flex",
            position: "relative",
            zIndex: 1,
            pt: 1, // 상단 여백 추가
          }}
        >
          <Fade in timeout={1000}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* 왼쪽 텍스트 영역 */}
              <Box
                sx={{
                  flex: 1,
                  textAlign: { xs: "center", md: "left" },
                  mb: { xs: 6, md: 0 },
                  pr: { md: 6 },
                  pl: { xs: 3, md: 6 },
                }}
              >
                <Typography
                  variant="h2"
                  fontWeight="800"
                  gutterBottom
                  sx={{
                    color: "#1F2937",
                    mb: 3,
                    fontSize: { xs: "2.0rem", md: "3.0rem" },
                    background:
                      "linear-gradient(135deg, #1F2937 0%, #374151 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Qureka와 함께라면 <br/>공부 걱정은 끝!
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: "#6B7280",
                    mb: 5,
                    lineHeight: 1.6,
                    fontSize: "1.2rem",
                    fontWeight: "400",
                  }}
                >
                  강의자료를 업로드하면 AI가 요약과 맞춤형 문제를 제공합니다.
                  <br /> 더 효율적인 공부, 지금 경험해보세요!
                </Typography>
                <PrimaryButton
                  size="large"
                  onClick={() => {
                    if (isLoggedIn) {
                      navigate("/upload");
                    } else {
                      navigate("/login");
                    }
                  }}
                >
                  시작하기! 🚀
                </PrimaryButton>
              </Box>

              {/* 오른쪽 이미지 영역 */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <FeatureImage
                  src={aiImage}
                  alt="문서 도우미"
                  sx={{
                    maxWidth: { xs: "80%", md: "90%" },
                    transform: "translateY(-20px)",
                  }}
                />
              </Box>
            </Box>
          </Fade>
        </Container>
      </HeroSection>
      {/* 문제 정의 섹션 */}
      <Box sx={{ py: 12, bgcolor: "#F8FAFC" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            fontWeight="700"
            align="center"
            sx={{
              color: "#1F2937",
              mb: 6,
              fontSize: { xs: "2rem", md: "2.8rem" },
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {/* 혹시 모르니 살려두자 */}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 6,
              mb: 6,
            }}
          >
            {/* 첫 번째 문제 정의 항목 */}
            <Fade in timeout={1000}>
              <StyledCard sx={{ flex: 1 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={projectMatterImage}
                      alt="다양한 유형 지원"
                      sx={{
                        width: "100%",
                        maxWidth: 280,
                        height: "auto",
                        mb: 3,
                        borderRadius: 2,
                        filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))",
                      }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight="700"
                      align="center"
                      fontSize={"1.4rem"}
                      sx={{ mb: 2 }}
                    >
                      다양한 유형 지원
                    </Typography>
                    <Typography
                      variant="body1"
                      align="center"
                      sx={{
                        fontSize: "1.2rem",
                        lineHeight: 1.7,
                        color: "#4B5563",
                      }}
                    >
                      요약의 유형이나 문제의 유형을 다양하게 지원하여
                      <br />
                      맞춤형 콘텐츠 생성을 통한 학습 효율성 강화
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Fade>

            {/* 두 번째 문제 정의 항목 */}
            <Fade in timeout={1500}>
              <StyledCard sx={{ flex: 1 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={projectMatter2Image}
                      alt="초보자도 쉽게 사용 가능"
                      sx={{
                        width: "100%",
                        maxWidth: 450,
                        height: 215,
                        mb: 3,
                        borderRadius: 2,
                        filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))",
                      }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight="700"
                      align="center"
                      fontSize={"1.4rem"}
                      sx={{ mb: 2 }}
                    >
                      초보자도 쉽게 사용 가능
                    </Typography>
                    <Typography
                      variant="body1"
                      align="center"
                      sx={{
                        fontSize: "1.2rem",
                        lineHeight: 1.7,
                        color: "#4B5563",
                      }}
                    >
                      분야, 난이도 등을 사용자가 직접 선택하여
                      <br />
                      쉽고 편하게 다양한 자료 생성 가능
                    </Typography>
                  </Box>
                </CardContent>
              </StyledCard>
            </Fade>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 12, bgcolor: "#ffffff" }}>
        {/* Section 1 */}
        <Container maxWidth="lg" sx={{ mb: 12 }}>
          <Fade in timeout={1500}>
            <StyledCard>
              <CardContent sx={{ p: 6 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {/* 좌측 텍스트 영역 */}
                  <Box sx={{ flex: 1, width: "100%" }}>
                    <Typography
                      variant="h3"
                      fontWeight="700"
                      mb={4}
                      sx={{
                        fontSize: "2rem",
                        color: "#1F2937",
                        background:
                          "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        whiteSpace: "nowrap", // 텍스트를 한 줄로 고정
                        overflow: "hidden", // 넘치는 텍스트 숨김
                        textOverflow: "ellipsis", // 필요시 말줄임표 표시
                      }}
                    >
                      AI로 더 똑똑하고 빠르게 요약 및 문제 생성
                    </Typography>
                    <Typography
                      variant="h6"
                      color="#4B5563"
                      sx={{
                        whiteSpace: "nowrap", // 텍스트를 한 줄로 고정
                        overflow: "hidden", // 넘치는 텍스트 숨김
                        textOverflow: "ellipsis",
                        lineHeight: 1.8,
                        fontSize: "1.2rem",
                        fontWeight: "400",
                      }}
                    >
                      복잡한 문서도 핵심만 뽑아 요약하고 맞춤형 문제를 만들어줍니다. <br />
                      클릭 몇 번으로 요약본 및 문제를 생성할 수 있습니다.
                      <br/>
                      공부는 간단하게, 시험 대비는 똑똑하게 준비해 보세요.
                    </Typography>
                  </Box>

                  {/* 우측 이미지 영역 */}
                  <Box
                    sx={{
                      flex: 1,
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <FeatureImage 
                    src={heyImage} 
                    alt="문서 요약"
                    sx={{
                        maxWidth: 300,
                        width: "100%",
                        height: 'auto',
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Fade>
        </Container>

        {/* Section 2 */}
        <Container maxWidth="lg" sx={{ mb: 12 }}>
          <Fade in timeout={2000}>
            <StyledCard>
              <CardContent sx={{ p: 6 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {/* 좌측 이미지 영역 */}
                  <Box
                    sx={{
                      flex: 1,
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <FeatureImage
                      src={questionTypesImage}
                      alt="문제 유형"
                      sx={{
                        maxWidth: 550, // 크기 증가 (원래 기본값은 400)
                        width: "100%",
                        height: "auto",
                      }}
                    />
                  </Box>

                  {/* 우측 텍스트 영역 */}
                  <Box sx={{ flex: 1, width: "100%" }}>
                    <Typography
                      variant="h3"
                      fontWeight="700"
                      mb={4}
                      sx={{
                        fontSize: "1.8rem",
                        color: "#1F2937",
                        background:
                          "linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      내 스타일, 내 방식대로 나만의 학습 설계
                    </Typography>
                    <Typography
                      variant="h6"
                      color="#4B5563"
                      sx={{
                        whiteSpace: "nowrap", // 텍스트를 한 줄로 고정
                        overflow: "hidden", // 넘치는 텍스트 숨김
                        textOverflow: "ellipsis",
                        lineHeight: 1.8,
                        fontSize: "1.2rem",
                        fontWeight: "400",
                      }}
                    >
                      기본 요약부터 주제별, 목차별 요약까지, 선택형부터
                      서술형까지 <br/>다양한 옵션을 제공합니다. <br/>
                      나에게 맞는 방식으로 요약하고, 원하는 형태로 문제를 만들어
                      보세요.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Fade>
        </Container>

        {/* Section 3 - How to Use */}
        <Container maxWidth="lg">
          <Fade in timeout={2500}>
            <StyledCard>
              <CardContent sx={{ p: 6 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {/* 좌측 텍스트 영역 */}
                  <Box sx={{ flex: 1, width: "100%" }}>
                    <Typography
                      variant="h3"
                      fontWeight="700"
                      mb={4}
                      sx={{
                        fontSize: "2rem",
                        color: "#1F2937",
                        background:
                          "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      큐레카 사용 방법
                    </Typography>
                    <Box mb={4}>
                      { [
                        "요약 또는 문제 생성 중 원하는 기능을 선택하세요.",
                        "학습할 강의자료를 업로드하세요.",
                        "원하는 옵션을 설정하고 생성 버튼을 클릭하세요.",
                        "생성된 요약 내용을 수정 및 다운로드 할 수 있습니다.",
                        "같은 방식으로 문제도 생성할 수 있습니다.",
                      ].map((step, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            mb: 3,
                          }}
                        >
                          <NumberBadge>{index + 1}</NumberBadge>
                          <Typography
                            variant="h6"
                            color="#4B5563"
                            sx={{
                              fontSize: "1.2rem",
                              lineHeight: 1.6,
                              fontWeight: "400",
                              paddingTop: "8px", // 텍스트 맞추기
                            }}
                          >
                            {step}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Box display="flex" justifyContent="center" mt={4} mb={2}>
                      <PrimaryButton
                        size="large"
                        onClick={() => {
                          if (isLoggedIn) {
                            navigate("/upload");
                          } else {
                            navigate("/login");
                          }
                        }}
                        sx={{ 
                          fontSize: "1rem",
                          height: 50,
                          padding: "0 24px",
                          background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                          "&:hover": {
                            background: "linear-gradient(135deg, #5253C7 0%, #4338CA 100%)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px rgba(99, 102, 241, 0.4)",
                          }
                        }}
                      >
                        지금 시작하기 ✨
                      </PrimaryButton>
                    </Box>
                  </Box>

                  {/* 우측 이미지 영역 */}
                  <Box
                    sx={{
                      flex: 1,
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <ServiceFlowDemo maxWidth="100%" />
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Fade>
        </Container>
      </Box>

      {/* CTA Footer */}
      <AccentSection sx={{ py: 12, position: "relative" }}>
        <Container
          maxWidth="md"
          sx={{ textAlign: "center", position: "relative", zIndex: 1 }}
        >
          <Typography
            variant="h3"
            fontWeight="700"
            fontSize={"2.2rem"}
            sx={{
              color: "#1F2937",
              mb: 3,
              background: "linear-gradient(135deg, #1F2937 0%, #374151 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            지금 바로 Qureka와 함께!
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: "1.3rem",
              color: "#6B7280",
              mb: 5,
              fontWeight: "400",
            }}
          >
            나만의 요약본 및 문제를 생성하세요!
          </Typography>
          <SecondaryButton
            size="large"
            onClick={() => {
              if (isLoggedIn) {
                navigate("/upload");
              } else {
                navigate("/login");
              }
            }}
          >
            지금 시작하기 ✨
          </SecondaryButton>
        </Container>
      </AccentSection>
    </>
  );
}

export default Home;
