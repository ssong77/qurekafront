import React, { useEffect } from 'react';

interface NavigationBlockerProps {
  when: boolean;
  message?: string;
  onNavigationAttempt?: () => void;
}

const NavigationBlocker: React.FC<NavigationBlockerProps> = ({
  when,
  message = '생성 중인 작업이 있습니다. 페이지를 나가시겠습니까?',
  onNavigationAttempt,
}) => {
  // 브라우저의 beforeunload 이벤트 처리
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [when, message]);

  // 헤더 링크 클릭 차단
  useEffect(() => {
    if (!when) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 링크나 버튼 클릭인지 확인
      const link = target.closest('a, button');
      if (!link) return;

      // 헤더 내부의 링크인지 확인
      const isHeaderLink = link.closest('header, [role="banner"], .MuiAppBar-root');
      if (!isHeaderLink) return;

      // 현재 페이지가 아닌 다른 페이지로 이동하려는 경우
      const href = link.getAttribute('href');
      const isExternalNavigation = href && href !== window.location.pathname;

      if (
        isExternalNavigation ||
        link.textContent?.includes('홈') ||
        link.textContent?.includes('실습하기') ||
        link.textContent?.includes('문제 풀기') ||
        link.textContent?.includes('마이페이지')
      ) {
        e.preventDefault();
        e.stopPropagation();

        const confirmed = window.confirm(message);
        if (confirmed && onNavigationAttempt) {
          onNavigationAttempt();
        }
      }
    };

    // 캡처 단계에서 이벤트를 가로챔
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [when, message, onNavigationAttempt]);

  return null;
};

export default NavigationBlocker;
