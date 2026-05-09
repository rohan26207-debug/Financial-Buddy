import React from 'react';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { useStore } from '../lib/store';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import PageTopBar from '../components/PageTopBar';

export default function ContactInfo() {
  const { state, updateContact } = useStore();
  const contact = state.contact || { name: '', phone: '', email: '', address: '' };
  const set = (patch) => updateContact(patch);

  return (
    <div className="px-5 pt-4">
      <PageTopBar />
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Contact Info</h1>
      <p className="text-sm text-gray-500 mt-1">Saved on this device only — nothing is sent anywhere.</p>

      <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-4 grid gap-4">
        <div className="grid gap-1.5">
          <Label className="text-xs flex items-center gap-1.5 text-gray-500"><User size={12} /> Name</Label>
          <Input value={contact.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your full name" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs flex items-center gap-1.5 text-gray-500"><Phone size={12} /> Phone</Label>
          <Input value={contact.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+1 555 0100" inputMode="tel" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs flex items-center gap-1.5 text-gray-500"><Mail size={12} /> Email</Label>
          <Input type="email" value={contact.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@example.com" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs flex items-center gap-1.5 text-gray-500"><MapPin size={12} /> Address</Label>
          <Textarea rows={3} value={contact.address} onChange={(e) => set({ address: e.target.value })} placeholder="Street, City, Postal code" />
        </div>
      </div>

      <p className="mt-4 text-[11px] text-center text-gray-400">Changes save automatically.</p>

      <div className="mt-6 mb-6 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-left">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">App made by</div>
        <div className="mt-1 text-base font-bold text-gray-900">Rohan R Khandve</div>
        <div className="mt-2 text-xs text-gray-500">Contact</div>
        <a
          href="mailto:vishnuparvatipetroleum@gmail.com"
          className="text-sm font-semibold text-teal-600 hover:underline break-all"
        >
          vishnuparvatipetroleum@gmail.com
        </a>
      </div>
    </div>
  );
}
