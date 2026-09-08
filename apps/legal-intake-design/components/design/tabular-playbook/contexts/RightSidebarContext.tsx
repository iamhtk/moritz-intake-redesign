'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';

interface RightSidebarContextType {
  isOpen: boolean;
  content: ReactNode | null;
  title: string;
  titleComponent: ReactNode | null;
  sidebarWidth: number;
  openSidebar: (
    content: ReactNode,
    title?: string,
    width?: number,
    titleComp?: ReactNode | null,
  ) => void;
  closeSidebar: () => void;
  requestClose: () => void;
  updateWidth: (width: number) => void;
  updateContent: (
    content: ReactNode,
    title?: string | null,
    titleComp?: ReactNode | null,
  ) => void;
  setBeforeCloseCallback: (callback: (() => boolean) | null) => void;
}

const RightSidebarContext = createContext<RightSidebarContextType | null>(null);

interface RightSidebarProviderProps {
  children: ReactNode;
}

export const RightSidebarProvider = ({
  children,
}: RightSidebarProviderProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [title, setTitle] = useState<string>('Document Preview');
  const [titleComponent, setTitleComponent] = useState<ReactNode | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(600); // Default width
  const beforeCloseCallbackRef = useRef<(() => boolean) | null>(null);

  const DEFAULT_WIDTH = 400;

  const openSidebar = useCallback(
    (
      content: ReactNode,
      title: string = 'Document Preview',
      width?: number,
      titleComp: ReactNode | null = null,
    ): void => {
      // Clear any previous beforeClose callback when opening new content
      beforeCloseCallbackRef.current = null;
      setContent(content);
      setTitle(title);
      setTitleComponent(titleComp);
      setSidebarWidth(width ?? DEFAULT_WIDTH);
      setIsOpen(true);
    },
    [],
  );

  const closeSidebar = useCallback((): void => {
    beforeCloseCallbackRef.current = null;
    setIsOpen(false);
  }, []);

  // requestClose checks the beforeClose callback before closing
  const requestClose = useCallback((): void => {
    if (beforeCloseCallbackRef.current) {
      const shouldClose = beforeCloseCallbackRef.current();
      if (!shouldClose) {
        return; // Don't close if callback returns false
      }
    }
    beforeCloseCallbackRef.current = null;
    setIsOpen(false);
  }, []);

  const updateWidth = useCallback((width: number): void => {
    setSidebarWidth(width);
  }, []);

  const updateContent = useCallback(
    (
      content: ReactNode,
      title: string | null = null,
      titleComp: ReactNode | null = null,
    ): void => {
      setContent(content);
      if (title !== null) setTitle(title);
      if (titleComp !== null) setTitleComponent(titleComp);
    },
    [],
  );

  const setBeforeCloseCallback = useCallback(
    (callback: (() => boolean) | null): void => {
      beforeCloseCallbackRef.current = callback;
    },
    [],
  );

  return (
    <RightSidebarContext.Provider
      value={{
        isOpen,
        content,
        title,
        titleComponent,
        sidebarWidth,
        openSidebar,
        closeSidebar,
        requestClose,
        updateWidth,
        updateContent,
        setBeforeCloseCallback,
      }}
    >
      {children}
    </RightSidebarContext.Provider>
  );
};

export const useRightSidebar = (): RightSidebarContextType => {
  const context = useContext(RightSidebarContext);
  if (context === null) {
    throw new Error(
      'useRightSidebar must be used within a RightSidebarProvider',
    );
  }
  return context;
};
