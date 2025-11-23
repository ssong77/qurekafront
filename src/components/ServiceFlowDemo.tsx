// src/components/ServiceFlowDemo.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import styled from '@emotion/styled';

// 이미지 import
import flowStep1 from './images/flow-step-1.png';
import flowStep2 from './images/flow-step-2.png';
import flowStep3 from './images/flow-step-3.png';
import flowStep4 from './images/flow-step-4.png';
import flowStep5 from './images/flow-step-5.png';

// 커스텀 스타일 컴포넌트
const DemoContainer = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: '20px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  padding: '20px',
  maxWidth: '800px',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  margin: '0 auto',
}));

const ScreenContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '400px',
  borderRadius: '15px',
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  backgroundColor: '#f8f9fa',
  margin: '20px 0',
}));

// 클릭 효과 커서
const CursorClick = styled(Box)(({ theme }) => ({
  position: 'absolute',
  pointerEvents: 'none',
  width: '32px',
  height: '32px',
  marginTop: '-16px',
  marginLeft: '-16px',
  zIndex: 10,
}));

// 서비스 플로우 단계 정의
const steps = [
  {
    title: "1단계: 기능 선택",
    description: "요약 또는 문제 생성 중 원하는 기능을 선택하세요.",
    imageSrc: flowStep1,
    clickPosition: { x: 35, y: 55 } // 클릭할 위치 (%)
  },
  {
    title: "2단계: 파일 업로드",
    description: "학습할 강의자료를 업로드하세요.",
    imageSrc: flowStep2,
    clickPosition: { x: 90, y: 65 }
  },
  {
    title: "3단계: 설정 및 생성",
    description: "원하는 옵션을 설정하고 생성 버튼을 클릭하세요.",
    imageSrc: flowStep3,
    clickPosition: { x: 60, y: 68 }
  },
  {
    title: "4단계: 요약 결과 확인",
    description: "생성된 요약 내용을 수정 및 다운로드 할 수 있습니다.",
    imageSrc: flowStep4,
    clickPosition: { x: 54, y: 72 }
  },
  {
    title: "5단계: 저장 또는 문제 생성",
    description: "이와 동일하게 문제도 생성할 수 있습니다.",
    imageSrc: flowStep5,
    clickPosition: { x: 80, y: 65 }
  }
];

interface ServiceFlowDemoProps {
  maxWidth?: string;
}

const ServiceFlowDemo: React.FC<ServiceFlowDemoProps> = ({ maxWidth = '800px' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clickPosition, setClickPosition] = useState({ left: '0%', top: '0%' });
  const playInterval = useRef<number | null>(null);
  const screenContainerRef = useRef<HTMLDivElement>(null);

  // 자동 재생 기능
  useEffect(() => {
    if (isPlaying) {
      // 슬라이드 전환은 3초마다 실행
      playInterval.current = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 3000);

      return () => {
        if (playInterval.current) clearInterval(playInterval.current);
      };
    }

    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying]);

  // 클릭 위치 업데이트
  useEffect(() => {
    const updateClickPosition = () => {
      if (!screenContainerRef.current || !steps[currentStep]?.clickPosition) return;
      
      const { x, y } = steps[currentStep].clickPosition;
      setClickPosition({
        left: `${x}%`,
        top: `${y}%`
      });
    };

    // 약간의 딜레이를 주어 DOM이 완전히 렌더링된 후 위치 계산
    const timer = setTimeout(updateClickPosition, 50);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <DemoContainer sx={{ maxWidth }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
      </Box>

      <ScreenContainer ref={screenContainerRef}>
        {steps.map((step, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              opacity: currentStep === index ? 1 : 0,
              transform: currentStep === index ? 'translateX(0)' : 'translateX(50px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box 
              component="img" 
              src={step.imageSrc} 
              alt={step.title} 
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </Box>
        ))}
        
        {/* 클릭 효과 - 항상 표시 및 애니메이션 속도 조절 */}
        <Box
          sx={{
            position: 'absolute',
            left: clickPosition.left,
            top: clickPosition.top,
            width: '60px',
            height: '60px',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 마우스 커서 아이콘 */}
          <Box
            sx={{
              position: 'absolute',
              width: '24px',
              height: '24px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'%3E%3Cpath d='M13.64,21.97C13.14,22.21 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.76,20.05 17.26,20.28L13.64,21.97Z' /%3E%3C/svg%3E")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              zIndex: 11,
            }}
          />
          
          {/* 클릭 파동 효과 - 더 느린 애니메이션으로 변경 */}
          <Box
            sx={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              border: '2px solid #4285f4',
              borderRadius: '50%',
              animation: 'clickRipple 1.5s ease-out infinite', // 0.6s → 2s로 변경
              '@keyframes clickRipple': {
                '0%': { 
                  opacity: 1,
                  transform: 'scale(0)',
                },
                '70%': { // 중간 단계 추가
                  opacity: 0.3,
                  transform: 'scale(1.5)',
                },
                '100%': { 
                  opacity: 0,
                  transform: 'scale(2.5)', // 더 큰 확장
                }
              },
            }}
          />
          
          {/* 클릭 중앙 원 */}
          <Box
            sx={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#4285f4',
              opacity: 0.8,
              animation: 'clickPulse 1.5s ease-in-out infinite alternate', // 1s → 1.5s로 변경
              '@keyframes clickPulse': {
                '0%': { 
                  transform: 'scale(1)',
                  opacity: 1
                },
                '100%': { 
                  transform: 'scale(0.8)',
                  opacity: 0.8
                }
              },
            }}
          />
        </Box>
      </ScreenContainer>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={prevStep}
          disabled={currentStep === 0}
          sx={{
            whiteSpace: "nowrap", // 텍스트를 한 줄로 고정
            overflow: "hidden", // 넘치는 텍스트 숨김
            textOverflow: "ellipsis", // 필요시 말줄임표 표시
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #5254D9 0%, #4338CA 100%)' },
            '&.Mui-disabled': { bgcolor: '#ccc', color: 'white' }
          }}
        >
          이전
        </Button>
        
        <Button
          variant="contained"
          startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          onClick={togglePlay}
          sx={{
            whiteSpace: "nowrap", // 텍스트를 한 줄로 고정
            overflow: "hidden", // 넘치는 텍스트 숨김
            textOverflow: "ellipsis", // 필요시 말줄임표 표시
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #5254D9 0%, #4338CA 100%)' }
          }}
        >
          {isPlaying ? '일시정지' : '자동 재생'}
        </Button>
        
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
          sx={{
            whiteSpace: "nowrap", // 텍스트를 한 줄로 고정
            overflow: "hidden", // 넘치는 텍스트 숨김
            textOverflow: "ellipsis", // 필요시 말줄임표 표시
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #5254D9 0%, #4338CA 100%)' },
            '&.Mui-disabled': { bgcolor: '#ccc', color: 'white' }
          }}
        >
          다음
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
        {steps.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentStep(index)}
            sx={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: currentStep === index ? '#4285f4' : '#ddd',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              transform: currentStep === index ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </Stack>

      <Box sx={{
        textAlign: 'center',
        mt: 2,
        p: 2,
        bgcolor: '#f8f9fa',
        borderRadius: '10px'
      }}>
        <Typography variant="subtitle1" sx={{ fontSize: "1.3rem", fontWeight: 600, color: '#333' }}>
          {steps[currentStep].title}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "1.1rem", color: '#666' }}>
          {steps[currentStep].description}
        </Typography>
      </Box>
    </DemoContainer>
  );
};

export default ServiceFlowDemo;