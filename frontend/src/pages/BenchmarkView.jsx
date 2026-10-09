import React, { useState } from 'react';
import { Zap, Database, CheckCircle } from 'lucide-react';
import reportApi from '../api/reportApi';

export const BenchmarkView = () => {
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [genCount, setGenCount] = useState(null);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate50k = async () => {
    setGenerating(true);
    setErrorMsg('');
    try {
      const count = await reportApi.generate50k();
      setGenCount(count || 50000);
      alert(`Đã tạo ${count?.toLocaleString() || '50.000'} hợp đồng mẫu ✓`);
    } catch (err) {
      console.error('Tạo dữ liệu mẫu thất bại', err);
      setErrorMsg(err.message || 'Không tạo được dữ liệu mẫu, bạn thử lại nhé');
    } finally {
      setGenerating(false);
    }
  };

  const handleRunBenchmark = async () => {
    setRunning(true);
    setErrorMsg('');
    try {
      const result = await reportApi.runBenchmark();
      setBenchmarkResult(result);
    } catch (err) {
      console.error('Chạy kiểm tra thất bại', err);
      setErrorMsg(err.message || 'Không đo được hiệu năng, bạn thử lại nhé');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Title Header */}
      <div className="v2-anim v2-d1" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>Kiểm tra tốc độ hệ thống</h1>
        <p style={{ color: 'var(--text-muted)' }}>Đo thời gian phản hồi và hiệu quả truy vấn dữ liệu</p>
      </div>

      {errorMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled-text)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Action Cards Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card v2-card-lift v2-anim">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div className="user-avatar" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: 48, height: 48 }}>
              <Database size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>1. Tạo 50.000 hợp đồng mẫu</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tạo ngẫu nhiên 50.000 hợp đồng hợp lệ để test</p>
            </div>
          </div>

          <button onClick={handleGenerate50k} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={generating}>
            {generating ? 'Đang tạo 50.000 hợp đồng mẫu...' : 'Tạo dữ liệu mẫu'}
          </button>

          {genCount && (
            <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--status-active-bg)', color: 'var(--status-active-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} />
              <span>Đang có {genCount.toLocaleString()} hợp đồng mẫu trong hệ thống</span>
            </div>
          )}
        </div>

        <div className="card v2-card-lift v2-anim">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div className="user-avatar" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', width: 48, height: 48 }}>
              <Zap size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>2. Đo tốc độ xử lý</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chạy 3 truy vấn chính và ghi lại kết quả</p>
            </div>
          </div>

          <button onClick={handleRunBenchmark} className="btn btn-secondary" style={{ width: '100%', padding: '0.8rem' }} disabled={running}>
            {running ? 'Đang chạy các truy vấn đo tốc độ...' : 'Bắt đầu đo'}
          </button>
        </div>
      </div>

      {/* Benchmark Results Display */}
      {benchmarkResult && (
        <div className="card v2-card-lift v2-anim">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={22} style={{ color: 'var(--secondary)' }} />
            <span>Kết quả đo hiệu năng</span>
          </h3>

          <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong>Tổng số bản ghi đã quét:</strong> <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{benchmarkResult.totalDocsInCollection?.toLocaleString()} hợp đồng</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong>Đo lúc:</strong> {new Date(benchmarkResult.benchmarkTimestamp).toLocaleString('vi-VN')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {benchmarkResult.queryMetrics?.map((m, idx) => (
              <div key={idx} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{m.queryName}</h4>
                  <span className="brand-badge" style={{ fontSize: '0.8rem' }}>Giai đoạn: {m.winningPlanStage}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{m.queryDescription}</p>

                <div className="grid-4">
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thời gian chạy</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)' }}>{m.executionTimeMillis} ms</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Số bản ghi đã duyệt</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{m.totalDocsExamined}</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Số bản ghi trả về</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>{m.nReturned}</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Đã tối ưu</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>{m.indexName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkView;
