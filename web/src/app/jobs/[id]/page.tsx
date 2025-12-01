'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Table, Tag, Button, Progress, Space, Typography, Descriptions, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { jobApi } from '@/lib/api';
import { Job } from '@/types/api.types';
import { useSocket } from '@/hooks/useSocket';

const { Title } = Typography;

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadJob = async () => {
    try {
      const data = await jobApi.getById(jobId);
      setJob(data);
    } catch (error: any) {
      message.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  useSocket('user-1', (event, data) => {
    if (data.jobId === jobId) {
      if (event === 'jobs:progress') {
        setJob((prev) => prev ? { ...prev, progress: data.progress, status: data.status } : null);
      } else if (event === 'jobs:completed' || event === 'jobs:failed' || event === 'jobs:canceled') {
        loadJob(); // Reload to get final state
      }
    }
  });

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await jobApi.cancel(jobId);
      message.success('Job cancellation requested');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to cancel job');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  if (!job) {
    return <div style={{ padding: '24px' }}>Job not found</div>;
  }

  const itemColumns = [
    {
      title: 'Ticket ID',
      dataIndex: 'ticketId',
      key: 'ticketId',
      render: (id: string) => id.slice(0, 8) + '...',
    },
    {
      title: 'Ticket Title',
      dataIndex: ['ticket', 'title'],
      key: 'ticketTitle',
      render: (title: string) => title || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean) => (
        <Tag color={success ? 'success' : 'error'}>
          {success ? 'Success' : 'Failed'}
        </Tag>
      ),
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      render: (error: string) => error || '-',
    },
  ];

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
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/jobs')}>
            Back to Jobs
          </Button>
        </div>

        <Card>
          <Title level={2}>Job Details</Title>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Job ID">{job.id}</Descriptions.Item>
            <Descriptions.Item label="Type">{job.type}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(job.status)}>{job.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Progress">{job.progress}%</Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(job.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {new Date(job.updatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: '16px' }}>
            <Progress
              percent={job.progress}
              status={getStatusColor(job.status) as any}
              strokeColor={job.status === 'running' ? '#1890ff' : undefined}
            />
          </div>

          {job.status === 'running' && (
            <div style={{ marginTop: '16px' }}>
              <Button danger onClick={handleCancel} loading={cancelling}>
                Cancel Job
              </Button>
            </div>
          )}

          {job.summary && (
            <div style={{ marginTop: '16px' }}>
              <Title level={4}>Summary</Title>
              <Descriptions column={3}>
                <Descriptions.Item label="Total">{job.summary.total}</Descriptions.Item>
                <Descriptions.Item label="Succeeded">
                  <Tag color="success">{job.summary.succeeded}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Failed">
                  <Tag color="error">{job.summary.failed}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Card>

        <Card>
          <Title level={3}>Item-Level Results</Title>
          <Table
            columns={itemColumns}
            dataSource={job.items || []}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </Space>
    </div>
  );
}

