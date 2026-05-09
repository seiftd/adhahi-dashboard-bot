import { useState } from 'react';
import { Button } from '../components/Button';
import { apiService } from '../services/api';
import { useAppStore } from '../store/useAppStore';

const fields = [
  ['fullName', 'الاسم الكامل', 'مثال: محمد بن علي'],
  ['phone', 'رقم الهاتف', '0550000000'],
  ['nationalId', 'رقم التعريف', '18 رقمًا'],
  ['wilaya', 'الولاية', 'سوق أهراس'],
  ['commune', 'البلدية', 'اسم البلدية'],
  ['extraInfo', 'معلومات إضافية', 'ملاحظات اختيارية']
];

export function UserInfo() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const notify = useAppStore((state) => state.notify);
  const [form, setForm] = useState(user);
  const [loading, setLoading] = useState(false);

  async function save(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const saved = await apiService.saveUser(form);
      setUser(saved);
      notify({ type: 'success', message: 'تم حفظ معلومات المستخدم' });
    } catch (error) {
      notify({ type: 'error', message: error.response?.data?.message || 'تعذر الحفظ' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="glass neon-border rounded-[2rem] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">معلومات المستخدم</h2>
          <p className="mt-1 text-sm text-slate-400">تُستخدم هذه البيانات عند فتح التسجيل تلقائيًا.</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">وضع التعديل</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([name, label, placeholder]) => (
          <label key={name} className={name === 'extraInfo' ? 'md:col-span-2' : ''}>
            <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
            {name === 'extraInfo' ? (
              <textarea value={form[name] || ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} placeholder={placeholder} className="min-h-28 w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-300" />
            ) : (
              <input required={name !== 'extraInfo'} value={form[name] || ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} placeholder={placeholder} className="w-full rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 outline-none transition focus:border-cyan-300" />
            )}
          </label>
        ))}
      </div>

      <Button className="mt-5 w-full md:w-auto" disabled={loading}>{loading ? 'جارٍ الحفظ...' : 'حفظ المعلومات'}</Button>
    </form>
  );
}
