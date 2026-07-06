import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import {
  Trophy, Save, Users, CircleDot, Sparkles, ExternalLink, Lock, Loader2, Shield, Wrench,
} from 'lucide-react';
import ChangePasswordPanel from '../components/ChangePasswordPanel';
import ToggleRow from '../components/settings/ToggleRow';
import { parseSettingsList, SETTING_KEYS } from '../utils/platformSettings';
import '../style/settings.css';

const TABS = [
  { id: 'general', label: 'إعدادات عامة', icon: Sparkles },
  { id: 'features', label: 'ميزات الزبون', icon: CircleDot },
  { id: 'referral', label: 'الدعوات', icon: Users },
  { id: 'wheel', label: 'عجلة الحظ', icon: CircleDot },
  { id: 'permissions', label: 'صلاحيات المحلات', icon: Shield },
  { id: 'account', label: 'الحساب', icon: Lock },
];

const PLACEMENT_LABELS = {
  header: 'شريط الهيدر',
  userCenter: 'مركز المستخدم',
  inventory: 'صفحة المخزون',
};

const Settings = () => {
  const [tab, setTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [referralPoints, setReferralPoints] = useState(3);
  const [referralEnabled, setReferralEnabled] = useState(true);
  const [storeCompetitions, setStoreCompetitions] = useState(true);
  const [marketplace, setMarketplace] = useState(true);
  const [draws, setDraws] = useState(true);
  const [wheelEnabled, setWheelEnabled] = useState(true);
  const [wheelSpinCost, setWheelSpinCost] = useState(5);
  const [wheelSpinInterval, setWheelSpinInterval] = useState(3000);
  const [wheelPlacements, setWheelPlacements] = useState({
    header: true,
    userCenter: true,
    inventory: true,
  });
  const [storeOwnerPages, setStoreOwnerPages] = useState({
    cart: true,
    competitions: true,
    memberPrizes: true,
    warehouses: true,
  });
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'الموقع تحت الصيانة حالياً. نعمل على تحسين تجربتكم ونعود قريباً.'
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/admin/settings');
      const list = Array.isArray(data) ? data : [];
      const parsed = parseSettingsList(list);
      setReferralPoints(parsed.referralPoints);
      setReferralEnabled(parsed.referralEnabled);
      setStoreCompetitions(parsed.storeCompetitions);
      setMarketplace(parsed.marketplace);
      setDraws(parsed.draws);
      setWheelEnabled(parsed.wheelEnabled);
      setWheelSpinCost(parsed.wheelSpinCost);
      setWheelSpinInterval(parsed.wheelSpinInterval);
      setWheelPlacements(parsed.wheelPlacements);
      setStoreOwnerPages(parsed.storeOwnerPages);
      setMaintenanceEnabled(parsed.maintenanceEnabled);
      setMaintenanceMessage(parsed.maintenanceMessage);
    } catch {
      setMsg('تعذّر تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveGeneral = async () => {
    setSaving(true);
    setMsg('');
    try {
      await Promise.all([
        axios.post('/admin/settings', { key: SETTING_KEYS.wheelSpinCost, value: { cost: Number(wheelSpinCost) || 0 } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.referralPoints, value: { points: Number(referralPoints) || 0 } }),
      ]);
      setMsg('تم حفظ الإعدادات العامة');
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const saveMaintenance = async () => {
    setSaving(true);
    setMsg('');
    try {
      await axios.post('/admin/settings', {
        key: SETTING_KEYS.maintenanceMode,
        value: {
          enabled: maintenanceEnabled,
          message: maintenanceMessage.trim() || 'الموقع تحت الصيانة حالياً.',
        },
      });
      setMsg(maintenanceEnabled ? 'تم تفعيل وضع الصيانة' : 'تم إيقاف وضع الصيانة');
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const saveFeatures = async () => {
    setSaving(true);
    setMsg('');
    try {
      await Promise.all([
        axios.post('/admin/settings', { key: SETTING_KEYS.storeCompetitions, value: { enabled: storeCompetitions } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.marketplace, value: { enabled: marketplace } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.draws, value: { enabled: draws } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.wheelEnabled, value: { enabled: wheelEnabled } }),
      ]);
      setMsg('تم حفظ إعدادات الميزات');
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const saveReferral = async () => {
    setSaving(true);
    setMsg('');
    try {
      await Promise.all([
        axios.post('/admin/settings', { key: SETTING_KEYS.referralEnabled, value: { enabled: referralEnabled } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.referralPoints, value: { points: Number(referralPoints) || 0 } }),
      ]);
      setMsg('تم حفظ إعدادات الدعوات');
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const saveWheel = async () => {
    setSaving(true);
    setMsg('');
    try {
      await Promise.all([
        axios.post('/admin/settings', { key: SETTING_KEYS.wheelEnabled, value: { enabled: wheelEnabled } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.wheelSpinCost, value: { cost: Number(wheelSpinCost) || 0 } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.wheelSpinInterval, value: { ms: Number(wheelSpinInterval) || 3000 } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.wheelPlacements, value: wheelPlacements }),
      ]);
      setMsg('تم حفظ إعدادات العجلة');
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const togglePlacement = (key) => {
    setWheelPlacements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleStoreOwnerPage = (key) => {
    setStoreOwnerPages((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveStoreOwnerPermissions = async () => {
    setSaving(true);
    setMsg('');
    try {
      await Promise.all([
        axios.post('/admin/settings', { key: SETTING_KEYS.storeOwnerCart, value: { enabled: storeOwnerPages.cart } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.storeOwnerCompetitions, value: { enabled: storeOwnerPages.competitions } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.storeOwnerMemberPrizes, value: { enabled: storeOwnerPages.memberPrizes } }),
        axios.post('/admin/settings', { key: SETTING_KEYS.storeOwnerWarehouses, value: { enabled: storeOwnerPages.warehouses } }),
      ]);
      setMsg('تم حفظ صلاحيات أصحاب المتاجر');
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const POINT_PRESETS = [3, 5, 10];

  return (
    <div className="admin-page-container" dir="rtl">
      <div className="admin-header">
        <div className="admin-title">
          <h1>إعدادات المنصة</h1>
          <p>تحكم مركزي في الميزات، الدعوات، صلاحيات المحلات، وعجلة الحظ</p>
        </div>
      </div>

      {msg && (
        <div className={`admin-card mb-4 font-bold text-sm ${msg.includes('فشل') || msg.includes('تعذّر') ? 'text-red-400' : 'text-primary'}`}>
          {msg}
        </div>
      )}

      <div className="settings-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`settings-tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} className="inline ml-1 -mt-0.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-6">
          <div className={`admin-card maintenance-control-card ${maintenanceEnabled ? 'is-active' : ''}`}>
            <h3 className="settings-section-title">
              <Wrench className={maintenanceEnabled ? 'text-red-400' : 'text-primary'} size={20} />
              {' '}وضع الصيانة (Maintenance Mode)
            </h3>
            <p className="settings-section-desc">
              عند التفعيل: يتوقف الموقع بالكامل للزبائن والتجار وتظهر صفحة صيانة احترافية.
              لوحة الأدمن تبقى تعمل بشكل طبيعي.
            </p>

            <ToggleRow
              label="تفعيل وضع الصيانة"
              hint={maintenanceEnabled ? '🛑 الموقع متوقف للعامة الآن' : 'الموقع يعمل بشكل طبيعي'}
              checked={maintenanceEnabled}
              onChange={() => setMaintenanceEnabled((v) => !v)}
              disabled={saving}
            />

            <div className="settings-field mt-4">
              <label>رسالة الصيانة للمستخدمين</label>
              <textarea
                className="admin-input w-full min-h-[100px]"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="الموقع تحت الصيانة حالياً..."
                disabled={saving}
              />
            </div>

            <div className="settings-save-bar">
              <button type="button" onClick={saveMaintenance} disabled={saving} className={maintenanceEnabled ? 'btn-danger' : 'btn-primary'}>
                <Save size={18} /> {saving ? 'جاري الحفظ...' : maintenanceEnabled ? 'حفظ وتفعيل الصيانة' : 'حفظ إعدادات الصيانة'}
              </button>
            </div>
          </div>

          <div className="admin-card space-y-6">
          <h3 className="settings-section-title">
            <Sparkles className="text-primary" size={20} /> إعدادات عامة للمنصة
          </h3>
          <p className="settings-section-desc">
            القيم الأساسية التي تُطبَّق مباشرة على النظام عند كل عملية
          </p>

          <div className="settings-grid-2">
            <div className="settings-field">
              <label>نقاط كل دوران للعجلة</label>
              <input
                type="number"
                min={0}
                className="admin-input w-full"
                value={wheelSpinCost}
                onChange={(e) => setWheelSpinCost(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {POINT_PRESETS.map((n) => (
                  <button
                    key={`wheel-${n}`}
                    type="button"
                    className={`settings-placement-chip ${Number(wheelSpinCost) === n ? 'active' : ''}`}
                    onClick={() => setWheelSpinCost(n)}
                  >
                    {n} نقاط
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field">
              <label>نقاط دعوة صديق</label>
              <input
                type="number"
                min={0}
                className="admin-input w-full"
                value={referralPoints}
                onChange={(e) => setReferralPoints(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {POINT_PRESETS.map((n) => (
                  <button
                    key={`ref-${n}`}
                    type="button"
                    className={`settings-placement-chip ${Number(referralPoints) === n ? 'active' : ''}`}
                    onClick={() => setReferralPoints(n)}
                  >
                    {n} نقاط
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-save-bar">
            <button type="button" onClick={saveGeneral} disabled={saving} className="btn-primary">
              <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات العامة'}
            </button>
          </div>
          </div>
        </div>
      )}

      {tab === 'features' && (
        <div className="admin-card">
          <h3 className="settings-section-title">
            <Sparkles className="text-primary" size={20} /> تفعيل / إيقاف الميزات
          </h3>
          <p className="settings-section-desc">عند التعطيل تختفي الميزة من واجهة الزبون بالكامل</p>

          <ToggleRow
            label="مسابقات المتاجر"
            hint="إخفاء قسم مسابقات المتاجر من واجهة الزبون"
            checked={storeCompetitions}
            onChange={setStoreCompetitions}
            disabled={saving}
          />
          <ToggleRow
            label="سوق «غراضي»"
            hint="إخفاء تبويب وصفحة الإعلانات بين المستخدمين"
            checked={marketplace}
            onChange={setMarketplace}
            disabled={saving}
          />
          <ToggleRow
            label="السحوبات والجوائز"
            hint="إخفاء تبويب «الجوائز» من الشريط السفلي"
            checked={draws}
            onChange={setDraws}
            disabled={saving}
          />
          <ToggleRow
            label="عجلة الحظ"
            hint="تعطيل العجلة بالكامل — لا دوران ولا ظهور في الواجهة"
            checked={wheelEnabled}
            onChange={setWheelEnabled}
            disabled={saving}
          />

          <div className="settings-save-bar">
            <button type="button" onClick={saveFeatures} disabled={saving} className="btn-primary">
              <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ الميزات'}
            </button>
          </div>
        </div>
      )}

      {tab === 'referral' && (
        <div className="admin-card space-y-4">
          <h3 className="settings-section-title">
            <Users className="text-primary" size={20} /> برنامج الدعوات
          </h3>
          <p className="settings-section-desc">
            كل تسجيل ناجح عبر رابط الإحالة يمنح الداعي نقاطاً — مع إشعار مجمّع عند تعدد التسجيلات
          </p>

          <ToggleRow
            label="تفعيل برنامج الدعوات"
            hint="عند الإيقاف لا تُمنح نقاط ولا إشعارات للداعي"
            checked={referralEnabled}
            onChange={setReferralEnabled}
            disabled={saving}
          />

          <div className="settings-field pt-2">
            <label>نقاط المكافأة لكل دعوة ناجحة</label>
            <input
              type="number"
              min={0}
              className="admin-input w-full max-w-xs mt-1"
              value={referralPoints}
              onChange={(e) => setReferralPoints(e.target.value)}
            />
            <p className="text-xs text-muted mt-2">
              مثال: 3 نقاط × 100 دعوة = +300 نقطة في إشعار واحد
            </p>
          </div>

          <div className="settings-save-bar">
            <button type="button" onClick={saveReferral} disabled={saving} className="btn-primary">
              <Save size={18} /> حفظ إعدادات الدعوات
            </button>
          </div>
        </div>
      )}

      {tab === 'wheel' && (
        <div className="space-y-6">
          <div className="admin-card">
            <h3 className="settings-section-title">
              <CircleDot className="text-primary" size={20} /> إعدادات العجلة
            </h3>
            <p className="settings-section-desc">تكلفة الدوران، سرعة الحماية، وأماكن الظهور في التطبيق</p>

            <ToggleRow
              label="تفعيل عجلة الحظ"
              checked={wheelEnabled}
              onChange={setWheelEnabled}
              disabled={saving}
            />

            <div className="settings-grid-2 mt-4">
              <div className="settings-field">
                <label>تكلفة كل دوران (نقاط)</label>
                <input
                  type="number"
                  min={0}
                  className="admin-input w-full"
                  value={wheelSpinCost}
                  onChange={(e) => setWheelSpinCost(e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label>الحد الأدنى بين الدورات (مللي ثانية)</label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  className="admin-input w-full"
                  value={wheelSpinInterval}
                  onChange={(e) => setWheelSpinInterval(e.target.value)}
                />
              </div>
            </div>

            <p className="text-sm font-bold text-white mt-6 mb-2">أماكن ظهور العجلة</p>
            <div className="settings-placements">
              {Object.entries(PLACEMENT_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`settings-placement-chip ${wheelPlacements[key] ? 'active' : ''}`}
                  onClick={() => togglePlacement(key)}
                >
                  <CircleDot size={16} />
                  {label}
                </button>
              ))}
            </div>

            <div className="settings-save-bar">
              <button type="button" onClick={saveWheel} disabled={saving} className="btn-primary">
                <Save size={18} /> حفظ إعدادات العجلة
              </button>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="settings-section-title">
              <Trophy className="text-primary" size={20} /> الجوائز والاحتمالات
            </h3>
            <p className="settings-section-desc">
              تحكم في قوة الجوائز، نسب الظهور على العجلة (displayWeight)، واحتمال الفوز (winWeight)
            </p>

            <div className="settings-link-card">
              <div>
                <strong className="text-white">إدارة جوائز العجلة</strong>
                <p>إضافة / تعديل / حذف الجوائز مع معاينة مباشرة للعجلة</p>
              </div>
              <Link to="/wheel-management" className="btn-primary shrink-0">
                <ExternalLink size={18} /> فتح الإدارة
              </Link>
            </div>

            <ul className="text-xs text-muted mt-4 space-y-2 list-disc pr-5">
              <li><strong className="text-white/80">displayWeight</strong> — حجم القطاع على العجلة</li>
              <li><strong className="text-white/80">winWeight</strong> — احتمال الفوز الفعلي (0 = تظهر ولا تُفوز)</li>
              <li><strong className="text-white/80">minPoints</strong> — الحد الأدنى لنقاط الزبون لفتح الجائزة</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="admin-card">
          <h3 className="settings-section-title">
            <Shield className="text-primary" size={20} /> صلاحيات أصحاب المتاجر
          </h3>
          <p className="settings-section-desc">
            إظهار أو إخفاء صفحات لوحة صاحب المحل — عند التعطيل تختفي من القائمة ويُرفض الوصول المباشر
          </p>

          <ToggleRow
            label="السلة (Cart)"
            hint="صفحة شراء المنتجات من المستودعات"
            checked={storeOwnerPages.cart}
            onChange={() => toggleStoreOwnerPage('cart')}
            disabled={saving}
          />
          <ToggleRow
            label="إضافة مسابقة (Competitions)"
            hint="نموذج طلب مسابقة للزبائن"
            checked={storeOwnerPages.competitions}
            onChange={() => toggleStoreOwnerPage('competitions')}
            disabled={saving}
          />
          <ToggleRow
            label="جوائز الأعضاء (Member Prizes)"
            hint="إدارة جوائز أعضاء المتجر"
            checked={storeOwnerPages.memberPrizes}
            onChange={() => toggleStoreOwnerPage('memberPrizes')}
            disabled={saving}
          />
          <ToggleRow
            label="المستودعات (Warehouses)"
            hint="استكشاف ومتابعة مستودعات التجار"
            checked={storeOwnerPages.warehouses}
            onChange={() => toggleStoreOwnerPage('warehouses')}
            disabled={saving}
          />

          <div className="settings-save-bar">
            <button type="button" onClick={saveStoreOwnerPermissions} disabled={saving} className="btn-primary">
              <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
            </button>
          </div>
        </div>
      )}

      {tab === 'account' && (
        <ChangePasswordPanel />
      )}
    </div>
  );
};

export default Settings;
