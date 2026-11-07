import { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import DesignSplitLayout, { LotusDivider } from '@/components/layout/DesignSplitLayout';
import { getContactSettings } from '@/profile/accountProfileStorage';
import { addActivity } from '@/menu/menuStorage';

interface ContactPageProps {
  userId: string;
  onBack: () => void;
}

export default function ContactPage({ userId, onBack }: ContactPageProps) {
  const settings = getContactSettings();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    addActivity(userId, 'Feedback sent', trimmed.slice(0, 120));
    setMessage('');
    setSent('Thank you — your message was saved.');
    setTimeout(() => setSent(''), 4000);
  };

  return (
    <DesignSplitLayout artSrc="/designs/contact.jpg" artAlt="Woman writing at a wooden desk" onBack={onBack} tall>
      <LotusDivider />
      <h1 className="font-serif text-[2.35rem] text-[#2b2118] mb-8">Contact Us</h1>

      <div className="space-y-6">
        <ContactRow
          icon={Mail}
          iconClass="bg-[#c45c4a]"
          label="Email Us"
          lines={[settings.email]}
        />
        <ContactRow
          icon={Phone}
          iconClass="bg-[#3d6b4f]"
          label="Call Us"
          lines={[settings.phone, settings.phoneHours]}
        />
        <ContactRow
          icon={MapPin}
          iconClass="bg-[#c9a227]"
          label="Our Office"
          lines={['123, Green Park, 5th Floor', 'HSR Layout, Bangalore - 560102']}
        />
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-xl text-[#2b2118] mb-2 flex items-center gap-2">
          <span className="text-[#8b6914]">✿</span>
          Share Your Recommendation
        </h2>
        <p className="text-sm text-[#6b5a48] mb-3">
          Have a suggestion, feedback or a kind word? We&apos;d love to hear it!
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message here..."
          rows={4}
          className="w-full bg-transparent border border-[#c9b08a] rounded-lg px-3 py-2.5 text-sm text-[#3d2f24] placeholder-[#9a8b78] focus:outline-none focus:border-[#8b5a2b] resize-none min-h-[110px]"
        />
        {sent && <p className="text-xs text-emerald-700 mt-2">{sent}</p>}
        <button
          type="button"
          onClick={handleSend}
          className="mt-4 px-8 py-2.5 rounded-md text-sm font-medium text-[#faf6ee] bg-[#6b4423] hover:bg-[#5a381c] inline-flex items-center gap-2"
        >
          Send
          <Send className="w-4 h-4" />
        </button>
      </div>
    </DesignSplitLayout>
  );
}

function ContactRow({
  icon: Icon,
  iconClass,
  label,
  lines,
}: {
  icon: typeof Mail;
  iconClass: string;
  label: string;
  lines: string[];
}) {
  return (
    <div className="flex gap-3 items-start pb-5 border-b border-[#e4d5be]">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${iconClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="font-medium text-[#2b2118]">{label}</p>
        {lines.filter(Boolean).map((line) => (
          <p key={line} className="text-sm text-[#5c4d3d] mt-0.5">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
