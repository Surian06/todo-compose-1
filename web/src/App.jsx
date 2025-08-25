import { useEffect, useMemo, useState } from 'react'
import { listTodos, createTodo, updateTodo, deleteTodo } from './api'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts'

const DAYS = [
  { i: 0, label: 'Lun' }, { i: 1, label: 'Mar' }, { i: 2, label: 'Mié' },
  { i: 3, label: 'Jue' }, { i: 4, label: 'Vie' }, { i: 5, label: 'Sáb' }, { i: 6, label: 'Dom' },
]
const COLORS = { red:'#ff6b6b', celeste:'#5ad1ff', blue:'#2563eb' }
function todayWeekday(){ const d = new Date().getDay(); return d===0?6:d-1 }
function hhmm(v){ return v ? v.slice(0,5) : '' }

export default function App(){
  const [todos,setTodos]=useState([])
  const [title,setTitle]=useState('')
  const [weekday,setWeekday]=useState(todayWeekday())
  const [start,setStart]=useState('')  // HH:MM
  const [end,setEnd]=useState('')      // HH:MM
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  async function refresh(){
    try{ setLoading(true); setError(''); setTodos(await listTodos()) }
    catch(e){ setError(e.message) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ refresh() },[])

  function validateRange(s,e){
    if((s && !e) || (!s && e)) { alert('Si usas horario, debes poner inicio y fin.'); return false }
    if(s && e && !(s<e)) { alert('La hora de inicio debe ser menor que la de fin.'); return false }
    return true
  }

  async function onAdd(evt){
    evt.preventDefault()
    const v = title.trim(); if(!v) return
    if(!validateRange(start,end)) return
    try{
      await createTodo(v, weekday, start || null, end || null)
      setTitle(''); setStart(''); setEnd('')
      await refresh()
    }catch(e){ alert(e.message) }
  }

  async function onToggle(t){
    try{
      await updateTodo(t.id,{ title:t.title, completed:!t.completed, weekday:t.weekday, start_time:t.start_time || null, end_time:t.end_time || null })
      await refresh()
    }catch(e){ alert(e.message) }
  }
  async function onDelete(id){ try{ await deleteTodo(id); await refresh() } catch(e){ alert(e.message) } }

  async function onEdit(t){
    const newTitle = prompt('Editar tarea:', t.title); if(newTitle===null) return
    const tt = newTitle.trim(); if(!tt) return
    const s = prompt('Hora INICIO (HH:MM) — deja vacío para quitar:', hhmm(t.start_time) )
    if(s===null) return
    const e = prompt('Hora FIN (HH:MM) — deja vacío para quitar:', hhmm(t.end_time) )
    if(e===null) return
    const ns = s.trim(), ne = e.trim()
    let startPayload = ns || null
    let endPayload   = ne || null
    if((ns && !/^\d{2}:\d{2}$/.test(ns)) || (ne && !/^\d{2}:\d{2}$/.test(ne))){
      alert('Formato inválido. Usa HH:MM'); return
    }
    if(!validateRange(startPayload||'', endPayload||'')) return
    try{
      await updateTodo(t.id,{ title:tt, completed:t.completed, weekday:t.weekday, start_time:startPayload, end_time:endPayload })
      await refresh()
    }catch(err){ alert(err.message) }
  }

  // Agrupar por día y ordenar por start_time
  const grouped = useMemo(()=>{
    const acc = Array.from({length:7},()=>[])
    for(const t of todos){
      const w = typeof t.weekday==='number'? t.weekday : 0
      acc[(w>=0 && w<=6)?w:0].push(t)
    }
    for(const list of acc){
      list.sort((a,b)=>{
        const ah = a.start_time ? hhmm(a.start_time) : '99:99'
        const bh = b.start_time ? hhmm(b.start_time) : '99:99'
        if(ah===bh) return a.id-b.id
        return ah.localeCompare(bh)
      })
    }
    return acc
  },[todos])

  const total=todos.length, completed=todos.filter(t=>t.completed).length, pending=total-completed
  const pieData=[{name:'Completadas',value:completed},{name:'Pendientes',value:pending}]
  const barData=DAYS.map(d=>{
    const list=grouped[d.i]; const done=list.filter(t=>t.completed).length; const todo=list.length-done
    return {dia:d.label, Completadas:done, Pendientes:todo}
  })

  return (
    <div className="shell">
      <header className="topbar">
        <h1>Agenda Semanal</h1>
        <div className="badges">
          <span className="badge">Total: {total}</span>
          <span className="badge success">Hechas: {completed}</span>
          <span className="badge">Pendientes: {pending}</span>
        </div>
      </header>

      {/* FORM + COLUMNS */}
      <div className="container card">
        <form onSubmit={onAdd} className="row addrow">
          <input className="input" placeholder="Nueva tarea…" value={title} onChange={e=>setTitle(e.target.value)} />
          <input className="input" type="time" value={start} onChange={e=>setStart(e.target.value)} />
          <input className="input" type="time" value={end} onChange={e=>setEnd(e.target.value)} />
          <select className="select" value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>
            {DAYS.map(d=><option key={d.i} value={d.i}>{d.label}</option>)}
          </select>
          <button className="btn primary" type="submit">Añadir</button>
        </form>

        {loading && <p className="muted">Cargando…</p>}
        {error && <p className="error">⚠ {error}</p>}

        <div className="columns">
          {DAYS.map(d=>(
            <section key={d.i} className="col">
              <h3 className="col-title">{d.label}</h3>
              <ul className="list">
                {grouped[d.i].map(t=>(
                  <li key={t.id} className={`todo-card ${t.completed?'done':''}`}>
                    {/* Hora en esquina */}
                    {(t.start_time && t.end_time) && (
                      <span className="todo-time-badge">{hhmm(t.start_time)}–{hhmm(t.end_time)}</span>
                    )}
                    <div className="todo-main">
                      <label className="todo-check">
                        <input type="checkbox" checked={t.completed} onChange={()=>onToggle(t)} />
                        <span className="todo-title">{t.title}</span>
                      </label>
                    </div>
                    <div className="todo-actions">
                      <button className="btn edit" onClick={()=>onEdit(t)}>Editar</button>
                      <button className="btn outline-danger" onClick={()=>onDelete(t.id)}>Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="dashboard">
        <div className="card chart">
          <h3 className="chart-title">Completadas vs Pendientes</h3>
          <div className="chart-box">
            {total===0 ? <div className="muted">Sin datos aún</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    <Cell fill={COLORS.blue} /><Cell fill={COLORS.red} />
                  </Pie>
                  <Tooltip contentStyle={{ background:'#0f1331', border:'1px solid #28306a', color:'#e9ecff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="card chart">
          <h3 className="chart-title">Distribución por día</h3>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f66" />
                <XAxis dataKey="dia" stroke="#cfd5ff" tick={{ fill:'#cfd5ff' }} />
                <YAxis allowDecimals={false} stroke="#cfd5ff" tick={{ fill:'#cfd5ff' }} />
                <Tooltip contentStyle={{ background:'#0f1331', border:'1px solid #28306a', color:'#e9ecff' }} />
                <Legend />
                <Bar dataKey="Completadas" stackId="a" fill={COLORS.blue} />
                <Bar dataKey="Pendientes"  stackId="a" fill={COLORS.red} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
