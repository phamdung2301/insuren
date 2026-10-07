import React, { useState } from 'react';
import { Cpu, Zap, Database, CheckCircle, Clock, ShieldCheck, Play, AlertCircle } from 'lucide-react';
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
      alert(`🎉 Đã sinh & bulk insert thành công ${count?.toLocaleString() || 50000} Hợp đồng Bảo hiểm vào MongoDB database 'insurance'!`);
    } catch (err) {
      console.error('Lỗi khi sinh 50k document', err);
      setErrorMsg(err.message || 'Không thể thực thi script nạp 50k document');
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
      console.error('Lỗi chạy benchmark', err);
      setErrorMsg(err.message || 'Không thể đo lường chỉ số benchmark');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>Thử Nghiệm Hiệu Năng Benchmark 50,000 Bản Ghi (Thử nghiệm P11)</h1>
        <p style={{ color: 'var(--text-muted)' }}>Đo lường thời gian phản hồi, chỉ số quét bản ghi `totalDocsExamined` & `winningPlan` khi sử dụng Compound Index trên MongoDB</p>
      </div>

      {errorMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled-text)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Action Cards Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div className="user-avatar" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: 48, height: 48 }}>
              <Database size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>1. Sinh Dữ Liệu 50,000 Hợp Đồng Mẫu</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Khởi tạo ngẫu nhiên 50,000 hợp đồng hợp lệ (Bulk Insert MongoTemplate)</p>
            </div>
          </div>

          <button onClick={handleGenerate50k} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={generating}>
            {generating ? 'Đang nạp 50,000 hợp đồng vào MongoDB...' : 'Chạy Script Sinh 50k Document'}
          </button>

          {genCount && (
            <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--status-active-bg)', color: 'var(--status-active-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} />
              <span>Tổng số Document đang có trong CSDL 'insurance': {genCount.toLocaleString()} hợp đồng</span>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div className="user-avatar" style={{ backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', width: 48, height: 48 }}>
              <Zap size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>2. Chạy Thử Nghiệm Benchmark</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Thực thi 3 câu lệnh truy vấn cốt lõi và trích xuất chỉ số `winningPlan`</p>
            </div>
          </div>

          <button onClick={handleRunBenchmark} className="btn btn-secondary" style={{ width: '100%', padding: '0.8rem' }} disabled={running}>
            {running ? 'Đang thực thi 3 câu lệnh truy vấn Index Scan...' : 'Đo Lường Chỉ Số Hiệu Năng (Run Benchmark)'}
          </button>
        </div>
      </div>

      {/* Benchmark Results Display */}
      {benchmarkResult && (
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={22} style={{ color: 'var(--secondary)' }} />
            <span>Kết Quả Đo Lường Hiệu Năng MongoDB Indexing (Real Runtime Execution)</span>
          </h3>

          <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong>Tổng số Document quét thực tế:</strong> <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{benchmarkResult.totalDocsInCollection?.toLocaleString()} hợp đồng</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <strong>Thời điểm đo:</strong> {new Date(benchmarkResult.benchmarkTimestamp).toLocaleString('vi-VN')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {benchmarkResult.queryMetrics?.map((m, idx) => (
              <div key={idx} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{m.queryName}</h4>
                  <span className="brand-badge" style={{ fontSize: '0.8rem' }}>Stage: {m.winningPlanStage}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{m.queryDescription}</p>

                <div className="grid-4">
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thời gian thực thi</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)' }}>{m.executionTimeMillis} ms</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Số bản ghi bị duyệt</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{m.totalDocsExamined}</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Số bản ghi trả về</span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>{m.nReturned}</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Index Tối Ưu</span>
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
