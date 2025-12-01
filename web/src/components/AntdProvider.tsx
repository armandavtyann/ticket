'use client';

import { ConfigProvider, App } from 'antd';
import '@ant-design/v5-patch-for-react-19';
import { useEffect, useState } from 'react';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ConfigProvider
      theme={{
        cssVar: true,
        hashed: false,
      }}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
}

