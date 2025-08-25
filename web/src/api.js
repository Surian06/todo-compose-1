const base = import.meta.env.VITE_API_URL || ''

async function parseOrText(r){
  const text = await r.text()
  try { return JSON.parse(text) } catch { return { detail: text || r.statusText } }
}

export async function listTodos() {
  const r = await fetch(`${base}/api/todos`)
  if (!r.ok) throw new Error((await parseOrText(r)).detail || 'Error fetching todos')
  return r.json()
}

export async function createTodo(title, weekday, start_time, end_time) {
  const body = { title, weekday, start_time: start_time || null, end_time: end_time || null }
  const r = await fetch(`${base}/api/todos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error((await parseOrText(r)).detail || 'Error creating todo')
  return r.json()
}

export async function updateTodo(id, data) {
  const r = await fetch(`${base}/api/todos/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  })
  if (!r.ok) throw new Error((await parseOrText(r)).detail || 'Error updating todo')
  return r.json()
}

export async function deleteTodo(id) {
  const r = await fetch(`${base}/api/todos/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error((await parseOrText(r)).detail || 'Error deleting todo')
}
