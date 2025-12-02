'use client';
import React from 'react';

interface MemberFormProps {
  form: any;
  setForm: (form: any) => void;
  members: any[];
  onSubmit: () => void;
}

export default function MemberForm({ form, setForm, members, onSubmit }: MemberFormProps) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <input
        placeholder="Name"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Role"
        value={form.role}
        onChange={e => setForm({ ...form, role: e.target.value })}
      />
      <select
        value={form.father_id}
        onChange={e => setForm({ ...form, father_id: e.target.value })}
      >
        <option value="">Select Father</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <select
        value={form.mother_id}
        onChange={e => setForm({ ...form, mother_id: e.target.value })}
      >
        <option value="">Select Mother</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <input type="file" onChange={e => setForm({ ...form, avatar: e.target.files?.[0] || null })} />
      <button onClick={onSubmit}>Add Member</button>
    </div>
  );
}
