import React, { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getRole } from '../../utils/tokenStorage';
import {
  getJobApplicationsReport,
  getPlacementsReport,
  getTrainingReport,
  getEmployersReport,
  getComplianceReport,
} from '../../api/adminApi';

const C = {
  teal:   '#00897b',
  tealLt: '#e0f2f1',
  coral:  '#ff6b35',
  blue:   '#0ea5e9',
  green:  '#22c55e',
  red:    '#ef4444',
  amber:  '#f59e0b',
  purple: '#8b5cf6',
  slate:  '#64748b',
};

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
const pct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);

/* ── KPI card ── */
const KPI = ({ label, value, sub, color = C.teal, icon }) => (
  <div className="col-6 col-md-3">
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ height: 3, background: color }} />
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
          <div className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32, background: color + '18', color, fontSize: '0.85rem' }}>
            <i className={`fas ${icon}`} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0d1f1c', lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>{value}</div>
        {sub && <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>{sub}</div>}
      </div>
    </div>
  </div>
);

const Section = ({ title, icon, color = C.teal, children }) => (
  <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16, overflow: 'hidden' }}>
    <div className="d-flex align-items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #f0f4f2', background: '#fafcfb' }}>
      <div className="rounded-circle d-flex align-items-center justify-content-center"
        style={{ width: 34, height: 34, background: color + '18', color, fontSize: '0.9rem' }}>
        <i className={`fas ${icon}`} />
      </div>
      <h6 className="fw-bold mb-0" style={{ color: '#0d1f1c', fontFamily: "'Syne', sans-serif" }}>{title}</h6>
    </div>
    <div className="card-body p-4">{children}</div>
  </div>
);

const RateBar = ({ label, value, color }) => (
  <div className="mb-2">
    <div className="d-flex justify-content-between mb-1">
      <span className="small text-muted">{label}</span>
      <span className="small fw-bold" style={{ color }}>{pct(value)}</span>
    </div>
    <div style={{ height: 8, background: '#f0f4f2', borderRadius: 99 }}>
      <div style={{ height: '100%', width: `${Math.min(value, 100)}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  </div>
);

const AdminReports = () => {
  const navigate = useNavigate();
  const role = getRole();
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [r, setR]             = useState({});

  useEffect(() => {
    if (role !== 'ADMIN') { navigate('/login'); return; }
    (async () => {
      try {
        setLoading(true);
        const [jobApplications, placements, training, employers, compliance] = await Promise.all([
          getJobApplicationsReport(),
          getPlacementsReport(),
          getTrainingReport(),
          getEmployersReport(),
          getComplianceReport(),
        ]);
        setR({ jobApplications, placements, training, employers, compliance });
      } catch (e) {
        setError(e.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, role]);

  if (role !== 'ADMIN') return null;

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 400 }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: C.teal }} />
        <div className="text-muted small">Loading reports…</div>
      </div>
    </div>
  );

  if (error) return <div className="alert alert-danger m-4">{error}</div>;

  const ja = r.jobApplications || {};
  const pl = r.placements     || {};
  const tr = r.training       || {};
  const em = r.employers      || {};
  const co = r.compliance     || {};

  /* chart data */
  const appBarData = [
    { name: 'Submitted', value: Number(ja.pending   || 0), fill: C.amber  },
    { name: 'Approved',  value: Number(ja.approved  || 0), fill: C.green  },
    { name: 'Rejected',  value: Number(ja.rejected  || 0), fill: C.red    },
  ];
  const placementPieData = [
    { name: 'Confirmed', value: Number(pl.successfulPlacements || 0) },
    { name: 'Cancelled', value: Number(pl.cancelledPlacements  || 0) },
  ];
  const trainingBarData = [
    { name: 'Active',     value: Number(tr.activeEnrollments    || 0), fill: C.blue  },
    { name: 'Completed',  value: Number(tr.completedEnrollments || 0), fill: C.green },
  ];
  const employerPieData = [
    { name: 'Active',   value: Number(em.activeEmployers   || 0) },
    { name: 'Inactive', value: Number(em.inactiveEmployers || 0) },
  ];
  const compliancePieData = [
    { name: 'Compliant',     value: Number(co.compliantCount    || 0) },
    { name: 'Non-Compliant', value: Number(co.nonCompliantCount || 0) },
  ];

  const generatedDate = ja.generatedDate || new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0" style={{ fontFamily: "'Syne', sans-serif", color: '#0d1f1c' }}>
            Reports & Analytics
          </h4>
          <div className="text-muted small">Generated: {String(generatedDate)}</div>
        </div>
        <span className="badge px-3 py-2" style={{ background: C.tealLt, color: C.teal, fontWeight: 700, borderRadius: 20 }}>
          <i className="fas fa-shield-alt me-1" /> Admin View
        </span>
      </div>
      <Section title="Job Applications" icon="fa-inbox" color={C.teal}>
        <div className="row g-3 mb-4">
          <KPI label="Total"     value={fmt(ja.totalApplications)} icon="fa-layer-group"  color={C.teal}  sub="All applications" />
          <KPI label="Submitted" value={fmt(ja.pending)}           icon="fa-clock"        color={C.amber} sub="Awaiting review" />
          <KPI label="Approved"  value={fmt(ja.approved)}          icon="fa-check-circle" color={C.green} sub="Accepted" />
          <KPI label="Rejected"  value={fmt(ja.rejected)}          icon="fa-times-circle" color={C.red}   sub="Declined" />
        </div>
        <div className="row g-4 align-items-center">
          <div className="col-md-7" style={{ height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={appBarData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f2" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {appBarData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="col-md-5">
            <div className="p-3 rounded-3" style={{ background: '#f8fffe', border: '1px solid #e0f0ed' }}>
              <div className="fw-bold small mb-3" style={{ color: C.teal }}>KPI Summary</div>
              <RateBar label="Approval Rate" value={ja.approvalRate || 0} color={C.green} />
              <RateBar label="Rejection Rate" value={ja.totalApplications ? (ja.rejected / ja.totalApplications) * 100 : 0} color={C.red} />
              <RateBar label="Pending Rate"   value={ja.totalApplications ? (ja.pending  / ja.totalApplications) * 100 : 0} color={C.amber} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Placements" icon="fa-handshake" color={C.green}>
        <div className="row g-3 mb-4">
          <KPI label="Total"     value={fmt(pl.totalPlacements)}      icon="fa-layer-group"  color={C.teal}  sub="All placements" />
          <KPI label="Confirmed" value={fmt(pl.successfulPlacements)}  icon="fa-check-circle" color={C.green} sub="Successful hires" />
          <KPI label="Cancelled" value={fmt(pl.cancelledPlacements)}   icon="fa-ban"          color={C.red}   sub="Cancelled" />
          <KPI label="Success Rate" value={pct(pl.successRate)}        icon="fa-chart-line"   color={C.blue}  sub="Confirmation rate" />
        </div>
        <div className="row g-4 align-items-center">
          <div className="col-md-5" style={{ height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={placementPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  <Cell fill={C.green} />
                  <Cell fill={C.red} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="col-md-7">
            <RateBar label="Success Rate"      value={pl.successRate || 0} color={C.green} />
            <RateBar label="Cancellation Rate" value={pl.totalPlacements ? (pl.cancelledPlacements / pl.totalPlacements) * 100 : 0} color={C.red} />
          </div>
        </div>
      </Section>

      <Section title="Training Programs" icon="fa-graduation-cap" color={C.blue}>
        <div className="row g-3 mb-4">
          <KPI label="Programs"    value={fmt(tr.totalPrograms)}        icon="fa-book"         color={C.blue}   sub="Total programs" />
          <KPI label="Enrollments" value={fmt(tr.totalEnrollments)}     icon="fa-users"        color={C.teal}   sub="Total enrolled" />
          <KPI label="Active"      value={fmt(tr.activeEnrollments)}    icon="fa-play-circle"  color={C.amber}  sub="In progress" />
          <KPI label="Completed"   value={fmt(tr.completedEnrollments)} icon="fa-check-double" color={C.green}  sub="Finished" />
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={trainingBarData} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f2" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {trainingBarData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
      <div className="row g-4">
        <div className="col-md-6">
          <Section title="Employers" icon="fa-building" color={C.purple}>
            <div className="row g-3 mb-3">
              <KPI label="Total"    value={fmt(em.totalEmployers)}    icon="fa-building"     color={C.purple} sub="Registered" />
              <KPI label="Active"   value={fmt(em.activeEmployers)}   icon="fa-check-circle" color={C.green}  sub="Approved" />
              <KPI label="Inactive" value={fmt(em.inactiveEmployers)} icon="fa-pause-circle" color={C.slate}  sub="Inactive" />
              <KPI label="Active %" value={pct(em.totalEmployers ? (em.activeEmployers / em.totalEmployers) * 100 : 0)} icon="fa-chart-pie" color={C.blue} sub="Activity rate" />
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={employerPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    <Cell fill={C.green} />
                    <Cell fill={C.slate} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        <div className="col-md-6">
          <Section title="Compliance" icon="fa-shield-alt" color={C.coral}>
            <div className="row g-3 mb-3">
              <KPI label="Total Checks"  value={fmt(co.totalChecks)}      icon="fa-clipboard-check" color={C.coral}  sub="All checks" />
              <KPI label="Compliant"     value={fmt(co.compliantCount)}    icon="fa-check-circle"    color={C.green}  sub="Passed" />
              <KPI label="Non-Compliant" value={fmt(co.nonCompliantCount)} icon="fa-exclamation-circle" color={C.red} sub="Failed" />
              <KPI label="Pass Rate"     value={pct(co.totalChecks ? (co.compliantCount / co.totalChecks) * 100 : 0)} icon="fa-chart-line" color={C.blue} sub="Compliance rate" />
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={compliancePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    <Cell fill={C.green} />
                    <Cell fill={C.red} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
