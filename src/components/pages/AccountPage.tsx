import { useState, type ReactNode } from 'react';
import {
  Calendar,
  Crown,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
} from 'lucide-react';
import type { AuthUser } from '@/auth';
import type { WardrobeCollection, WardrobeItem } from '@/types';
import FieldEditDialog from '@/components/layout/FieldEditDialog';
import DesignSplitLayout, { LotusDivider } from '@/components/layout/DesignSplitLayout';
import { ensureProfilesForUser, updateProfileName } from '@/menu/menuStorage';
import {
  getAccountProfile,
  updateAccountProfile,
  type AccountProfile,
} from '@/profile/accountProfileStorage';

interface AccountPageProps {
  user: AuthUser;
  items: WardrobeItem[];
  collections: WardrobeCollection[];
  giftRecorderEnabled: boolean;
  onToggleGiftRecorder: (enabled: boolean) => void;
  onBack: () => void;
  onUpdateUser: (user: AuthUser) => void;
  onOpenMembership: () => void;
}

type EditKey = 'email' | 'phone' | 'address' | null;

export default function AccountPage({
  user,
  items,
  collections,
  giftRecorderEnabled,
  onToggleGiftRecorder,
  onBack,
  onUpdateUser,
  onOpenMembership,
}: AccountPageProps) {
  const [profile, setProfile] = useState<AccountProfile>(() =>
    getAccountProfile(user.id, user.displayName ?? undefined, user.email ?? undefined)
  );
  const [editKey, setEditKey] = useState<EditKey>(null);
  const [bulkEdit, setBulkEdit] = useState(false);
  const [bulkName, setBulkName] = useState(user.displayName ?? '');
  const [bulkPhone, setBulkPhone] = useState(profile.phone);
  const [bulkAddress, setBulkAddress] = useState(profile.shippingAddress);

  const displayName = user.displayName ?? 'Your name';
  const email = profile.contactEmail || user.email || '—';

  const saveEdit = (value: string) => {
    if (!value) return;
    if (editKey === 'email') {
      setProfile(updateAccountProfile(user.id, { contactEmail: value }));
    } else if (editKey === 'phone') {
      setProfile(updateAccountProfile(user.id, { phone: value }));
    } else if (editKey === 'address') {
      setProfile(updateAccountProfile(user.id, { shippingAddress: value }));
    }
    setEditKey(null);
  };

  const editDialogValue =
    editKey === 'email' ? email : editKey === 'phone' ? profile.phone : editKey === 'address' ? profile.shippingAddress : '';

  return (
    <div className="w-full">
      <DesignSplitLayout artSrc="/designs/account.jpg" artAlt="Woman in a maroon saree" onBack={onBack} tall>
        <LotusDivider />
        <h1 className="font-serif text-[2rem] text-[#2b2118] mb-6">Account Information</h1>

        <div className="flex items-center gap-4 pb-5 mb-1">
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden border border-[#c9b08a] bg-[#ede4d4] flex-shrink-0">
            <img src="/designs/account.jpg" alt="" className="w-[210%] max-w-none h-full object-cover object-left" />
          </div>
          <div>
            <p className="font-serif text-xl text-[#2b2118]">{displayName}</p>
            <p className="text-sm text-[#6b5a48]">{email}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[#6b4423] text-[#faf6ee]">
              <Shield className="w-3 h-3" />
              {profile.membershipLevel}
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#e4d5be]">
          <AccountRow icon={Mail} label="Email Address" value={email} onEdit={() => setEditKey('email')} />
          <AccountRow icon={Phone} label="Phone Number" value={profile.phone} onEdit={() => setEditKey('phone')} />
          <AccountRow
            icon={MapPin}
            label="Shipping Address"
            value={profile.shippingAddress}
            onEdit={() => setEditKey('address')}
            multiline
          />
          <AccountRow
            icon={Crown}
            label="Membership Level"
            value={profile.membershipLevel}
            trailing={
              <button
                type="button"
                onClick={onOpenMembership}
                className="text-[11px] font-medium text-[#8b3d1a] hover:underline whitespace-nowrap"
              >
                Modify
              </button>
            }
          />
          <AccountRow icon={Calendar} label="Member Since" value={profile.memberSince} />
        </div>

        <div className="mt-5 rounded-xl border border-[#e4d5be] bg-[#f8f1e4]/80 p-4">
          <p className="text-sm font-medium text-[#3d2f24] mb-3 flex items-center gap-2">
            <span className="text-[#8b6914]">✿</span> Additional Details
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-[#5c4d3d] list-disc pl-4">
            <li>Preferred Language: {profile.preferredLanguage}</li>
            <li>Notifications: {profile.notifications ? 'Enabled' : 'Off'}</li>
            <li>Newsletter: {profile.newsletter ? 'Subscribed' : 'Unsubscribed'}</li>
            <li>Login via: {profile.loginVia}</li>
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-[#e4d5be] bg-[#f8f1e4]/80 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#3d2f24]">Gift Recorder</p>
            <p className="text-xs text-[#6b5a48] mt-1">Track gifts you receive and give.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#5c4d3d]">
            <input
              type="checkbox"
              checked={giftRecorderEnabled}
              onChange={(event) => onToggleGiftRecorder(event.target.checked)}
              className="accent-[#8b6914]"
            />
            {giftRecorderEnabled ? 'Enabled' : 'Disabled'}
          </label>
        </div>

        <p className="sr-only">
          {collections.length} wardrobes, {items.length} items
        </p>

        <button
          type="button"
          onClick={() => {
            setBulkName(displayName);
            setBulkPhone(profile.phone);
            setBulkAddress(profile.shippingAddress);
            setBulkEdit(true);
          }}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium text-[#faf6ee] bg-[#6b4423] hover:bg-[#5a381c]"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </button>
        <button
          type="button"
          onClick={onOpenMembership}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium text-[#6b4423] border border-[#c9b08a] hover:bg-[#ede4d4]"
        >
          <Crown className="w-4 h-4" />
          Modify membership
        </button>
      </DesignSplitLayout>

      <FieldEditDialog
        open={editKey !== null}
        title="Edit field"
        label={editKey === 'email' ? 'Email address' : editKey === 'phone' ? 'Phone number' : 'Shipping address'}
        value={editDialogValue}
        multiline={editKey === 'address'}
        onClose={() => setEditKey(null)}
        onSave={saveEdit}
      />

      <FieldEditDialog
        open={bulkEdit}
        title="Edit Profile"
        value={bulkName}
        onClose={() => setBulkEdit(false)}
        onSave={() => {
          const trimmed = bulkName.trim();
          if (trimmed) {
            updateProfileName(user.id, trimmed);
            onUpdateUser({ ...user, displayName: trimmed });
            ensureProfilesForUser({ ...user, displayName: trimmed });
          }
          setProfile(updateAccountProfile(user.id, { phone: bulkPhone.trim(), shippingAddress: bulkAddress.trim() }));
          setBulkEdit(false);
        }}
      >
        <label className="block text-xs font-medium text-[#6b5a48] uppercase tracking-wider">Display name</label>
        <input
          value={bulkName}
          onChange={(e) => setBulkName(e.target.value)}
          className="w-full bg-[#faf6ee] border border-[#c9b08a] rounded-lg px-3 py-2.5 text-sm"
        />
        <label className="block text-xs font-medium text-[#6b5a48] uppercase tracking-wider">Phone</label>
        <input
          value={bulkPhone}
          onChange={(e) => setBulkPhone(e.target.value)}
          className="w-full bg-[#faf6ee] border border-[#c9b08a] rounded-lg px-3 py-2.5 text-sm"
        />
        <label className="block text-xs font-medium text-[#6b5a48] uppercase tracking-wider">Shipping address</label>
        <textarea
          value={bulkAddress}
          onChange={(e) => setBulkAddress(e.target.value)}
          rows={3}
          className="w-full bg-[#faf6ee] border border-[#c9b08a] rounded-lg px-3 py-2.5 text-sm"
        />
      </FieldEditDialog>
    </div>
  );
}

function AccountRow({
  icon: Icon,
  label,
  value,
  onEdit,
  trailing,
  multiline,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  onEdit?: () => void;
  trailing?: ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="w-8 h-8 rounded-full bg-[#efe4d2] text-[#8b6914] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#6b5a48]">{label}</p>
        <p className={`text-sm text-[#2b2118] mt-0.5 ${multiline ? 'whitespace-pre-line' : ''}`}>{value}</p>
      </div>
      {trailing}
      {onEdit && (
        <button type="button" onClick={onEdit} className="p-1 text-[#8b6914] hover:text-[#6b4423]" aria-label={`Edit ${label}`}>
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
