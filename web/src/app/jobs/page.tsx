'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Select, Tag, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { jobApi } from '@/lib/api';
import { Job } from '@/types/api.types';
import { useRouter } from 'next/navigation';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ type?: string; status?: string }>({});
  const router = useRouter();

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await jobApi.getAll(filters);
      setJobs(data);
    } catch (error: any) {
      message.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => id.slice(0, 8) + '...',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          queued: 'default',
          running: 'processing',
          succeeded: 'success',
          completed: 'success',
          failed: 'error',
          canceled: 'warning',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => `${progress}%`,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Job) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/jobs/${record.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Job Center</h1>
        <Button onClick={() => router.push('/tickets')}>Back to Tickets</Button>
      </div>

      <Space style={{ marginBottom: '16px' }}>
        <Select
          placeholder="Filter by Type"
          allowClear
          style={{ width: 200 }}
          onChange={(value: string) => setFilters({ ...filters, type: value || undefined })}
        >
          <Select.Option value="bulk-delete">Bulk Delete</Select.Option>
        </Select>
        <Select
          placeholder="Filter by Status"
          allowClear
          style={{ width: 200 }}
          onChange={(value: string) => setFilters({ ...filters, status: value || undefined })}
        >
          <Select.Option value="queued">Queued</Select.Option>
          <Select.Option value="running">Running</Select.Option>
          <Select.Option value="succeeded">Succeeded</Select.Option>
          <Select.Option value="completed">Completed</Select.Option>
          <Select.Option value="failed">Failed</Select.Option>
          <Select.Option value="canceled">Canceled</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={jobs}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
}
