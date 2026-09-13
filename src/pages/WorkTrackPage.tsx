import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listWorkItems } from '../lib/storage';
import { computeWorkItemActiveMs, isResumable, formatDuration } from '../lib/timer';
import type { WorkItem } from '../types/work';

export default function WorkTrackPage() {
  const [items, setItems] = useState<WorkItem[]>([]); const [loading, setLoading] = useState(true); const navigate = useNavigate();
  useEffect(() => { listWorkItems().then((all) => { setItems(all); setLoading(false); }); }, []);
  if (loading) return null;
  return <div><h1 style={{ fontSize: 22, marginBottom: 6 }}>Work Track</h1><p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>What actually happened across every Work Item. Select resumable work to continue it in a new session.</p>{items.length === 0 ? <div className="empty-state">No work records found yet.</div> : <div className="panel" style={{ overflow: 'hidden' }}><table className="table"><thead><tr><th>Work ID</th><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th style={{ textAlign: 'right' }}>Total Active Time</th></tr></thead><tbody>{items.map((item) => { const resumable = isResumable(item); return <tr key={item.id} onClick={() => resumable && navigate('/', { state: { continueItemId: item.id } })} style={resumable ? { cursor: 'pointer' } : undefined} title={resumable ? 'Continue this Work Item in a new session' : undefined}><td className="mono">{item.workId}</td><td>{item.taskTitle}{resumable && <span style={{ display: 'block', fontSize: 11, color: 'var(--brand-strong)' }}>Continue existing work</span>}</td><td>{item.project}</td><td><span className="badge badge-neutral">{item.status}</span></td><td>{item.priority}</td><td className="mono" style={{ textAlign: 'right' }}>{formatDuration(computeWorkItemActiveMs(item, new Date()))}</td></tr>; })}</tbody></table></div>}</div>;
}
