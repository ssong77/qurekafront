import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Button,
  Box,
  Alert,
  Fade,
} from '@mui/material';
import { Error as ErrorIcon, Refresh, Description, Warning } from '@mui/icons-material';

interface ErrorDisplayProps {
  errorMessage?: string;
  errorType?: 'short_text' | 'invalid_file' | 'generation_failed' | 'unknown';
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errorMessage,
  errorType = 'unknown',
  onRetry,
}) => {
  // 에러 타입별 설정
  const errorConfig = {
    short_text: {
      title: '텍스트가 너무 짧습니다',
      icon: <Description sx={{ fontSize: 60, color: 'white' }} />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      message: errorMessage || '파일에서 추출된 텍스트가 너무 짧습니다. 최소 200자 이상이어야 합니다.',
      suggestions: [
        '더 많은 내용이 포함된 파일을 업로드해주세요.',
        'PDF의 경우 텍스트가 이미지로 되어있지 않은지 확인해주세요.',
        'PPTX의 경우 슬라이드에 충분한 텍스트가 있는지 확인해주세요.',
      ]
    },
    invalid_file: {
      title: '파일을 읽을 수 없습니다',
      icon: <Warning sx={{ fontSize: 60, color: 'white' }} />,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      message: errorMessage || '파일에서 텍스트를 추출할 수 없습니다.',
      suggestions: [
        '파일이 손상되지 않았는지 확인해주세요.',
        '다른 파일로 다시 시도해주세요.',
        'PDF 또는 PPTX 형식인지 확인해주세요.',
      ]
    },
    generation_failed: {
      title: '생성 중 오류가 발생했습니다',
      icon: <ErrorIcon sx={{ fontSize: 60, color: 'white' }} />,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      message: errorMessage || '문제를 생성하는 중 오류가 발생했습니다.',
      suggestions: [
        '생성된 문제가 올바른 형식이 아닐 수 있습니다.',
        '다시 시도하거나 설정을 변경해주세요.',
        '문제가 계속되면 다른 파일로 시도해보세요.',
      ]
    },
    unknown: {
      title: '오류가 발생했습니다',
      icon: <ErrorIcon sx={{ fontSize: 60, color: 'white' }} />,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      message: errorMessage || '알 수 없는 오류가 발생했습니다.',
      suggestions: [
        '잠시 후 다시 시도해주세요.',
        '문제가 계속되면 다른 파일로 시도해보세요.',
      ]
    }
  };

  const config = errorConfig[errorType];

  return (
    <Fade in timeout={500}>
      <Paper
        elevation={6}
        sx={{
          p: 6,
          borderRadius: 4,
          background: "#ffffff",
          textAlign: "center",
        }}
      >
        <Stack spacing={4} alignItems="center">
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: config.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 32px ${config.color}40`,
            }}
          >
            {config.icon}
          </Box>

          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: config.color }}>
              {config.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {config.message}
            </Typography>
          </Box>

          <Alert severity={errorType === 'short_text' ? 'warning' : 'error'} sx={{ maxWidth: 600, textAlign: 'left' }}>
            <Typography variant="body2" component="div">
              {config.suggestions.map((suggestion, index) => (
                <React.Fragment key={index}>
                  • {suggestion}
                  {index < config.suggestions.length - 1 && <br />}
                </React.Fragment>
              ))}
            </Typography>
          </Alert>

          <Button
            variant="contained"
            size="large"
            startIcon={<Refresh />}
            onClick={onRetry}
            sx={{
              borderRadius: 3,
              px: 5,
              py: 1.5,
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              },
            }}
          >
            {errorType === 'short_text' ? '다른 파일 선택하기' : '다시 시도하기'}
          </Button>
        </Stack>
      </Paper>
    </Fade>
  );
};

export default ErrorDisplay;
