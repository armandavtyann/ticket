'use client';

import { Progress, Button, Space, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { jobApi } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

interface JobProgressBannerProps {
  job: {
    id: string;
    status: string;
    progress: number;
  };
}

export default function JobProgressBanner({ job }: JobProgressBannerProps) {
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await jobApi.cancel(job.id);
    } catch (error) {
      console.error('Failed to cancel job', error);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'default';
      case 'running':
        return 'active';
      case 'succeeded':
      case 'completed':
        return 'success';
      case 'failed':
        return 'exception';
      case 'canceled':
        return 'normal';
      default:
        return 'default';
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        border: '1px solid #d9d9d9',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>
            Job {job.id.slice(0, 8)}... - {job.status} ({job.progress || 0}%)
          </Text>
          <Space>
            <Button
              type="link"
              size="small"
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              View Details
            </Button>
            {job.status === 'running' && (
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={handleCancel}
                loading={cancelling}
              >
                Cancel
              </Button>
            )}
          </Space>
        </div>
        <Progress
          percent={job.progress || 0}
          status={getStatusColor(job.status) as any}
          strokeColor={job.status === 'running' ? '#1890ff' : undefined}
          format={(percent) => `${Math.round(percent || 0)}%`}
          showInfo={true}
          size="default"
        />
      </Space>
    </div>
  );
}
