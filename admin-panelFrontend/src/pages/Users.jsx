import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from '../api/axios';
import {
  Search,
  Ban,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Filter,
  X,
  Eye,
  MapPin,
  Trophy,
  Store,
  ShoppingBag,
  Activity,
  Calendar,
  Phone,
  Mail,
  Star,
  MessageCircle,
} from 'lucide-react';
import '../style/users.css';
import { queryKeys } from '../lib/queryClient';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import LightLoadingHint from '../shared/LightLoadingHint';

const RANK_LABELS = {
  bronze: 'برونزي',
  silver: 'فضي',
  gold: 'ذهبي',
  platinum: 'بلاتيني',
};

const ACTIVITY_LABELS = {
  none: 'بدون',
  low: 'منخفض',
  medium: 'متوسط',
  high: 'مرتفع',
};

const STATUS_LABELS = {
  active: 'نشط',
  suspended: 'معلّق',
  banned: 'محظور',
};

const defaultFilters = {
  regionId: '',
  storeId: '',
  joinedStore: '',
  wonPrize: '',
  usesMarketplace: '',
  activityLevel: '',
  pointsMin: '',
  pointsMax: '',
  participationsMin: '',
  participationsMax: '',
  registeredFrom: '',
  registeredTo: '',
};

const buildQuery = (search, sort, page, filters) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '20');
  params.set('sort', sort);
  if (search.trim()) params.set('q', search.trim());
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value != null) params.set(key, value);
  });
  return params.toString();
};

const UserDetailModal = ({ userId, onClose, onBan, onDelete, onChat }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios
      .get(`/admin/users/${userId}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const user = detail?.user;

  return (
    <div className="users-modal-overlay" onClick={onClose}>
      <div className="users-modal" onClick={(e) => e.stopPropagation()}>
        <div className="users-modal-header">
          <h2>ملف المستخدم</h2>
          <button type="button" className="icon-action-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!loading && !user ? (
          <p className="py-8 text-center text-muted">تعذّر تحميل البيانات</p>
        ) : user ? (
          <>
            <div className="users-modal-profile">
              <div className="user-avatar user-avatar-lg">{user.name?.[0] || '?'}</div>
              <div>
                <h3>{user.name}</h3>
                <p className="text-muted text-sm">{user.email || user.phone}</p>
                <div className="users-modal-badges">
                  <span className={`rank-badge rank-${user.rank}`}>{RANK_LABELS[user.rank] || user.rank}</span>
                  <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {STATUS_LABELS[user.status] || user.status}
                  </span>
                  {user.isVerified && <span className="badge badge-success">موثّق</span>}
                  {user.hasWonPrize && <span className="badge badge-warning">فائز بجائزة</span>}
                  {user.hasPhysicalWheelPrize && <span className="badge badge-warning">جائزة مادية (عجلة)</span>}
                  {user.hasCompetitionHistory && <span className="badge badge-success">مسابقات</span>}
                </div>
              </div>
            </div>

            <div className="users-modal-stats">
              <div><Star size={16} /> {(user.points ?? 0).toLocaleString('ar')} نقطة</div>
              <div><Activity size={16} /> {user.activityCount ?? 0} نشاط</div>
              <div><Trophy size={16} /> {user.competitionsJoined ?? user.participationsCount ?? 0} مسابقة</div>
              <div><Trophy size={16} /> {user.totalPrizesCount ?? 0} جائزة</div>
              <div><ShoppingBag size={16} /> {user.bazaarListingsCount ?? 0} إعلان</div>
            </div>

            <div className="users-modal-section">
              <h4>معلومات التواصل</h4>
              <p><Mail size={14} /> {user.email || '—'}</p>
              <p><Phone size={14} /> {user.phone || '—'}</p>
              <p><MapPin size={14} /> {user.regionName || '—'}</p>
              <p><Calendar size={14} /> تسجيل: {new Date(user.createdAt).toLocaleDateString('ar')}</p>
            </div>

            {detail.storeMemberships?.length > 0 && (
              <div className="users-modal-section">
                <h4><Store size={16} /> متاجر منضم إليها</h4>
                <div className="users-tag-list">
                  {detail.storeMemberships.map((m) => (
                    <span key={m._id} className="users-tag">{m.store?.name || 'متجر'}</span>
                  ))}
                </div>
              </div>
            )}

            {(detail.prizes?.wheel?.length > 0 ||
              detail.prizes?.honor?.length > 0 ||
              detail.prizes?.draws?.length > 0) && (
              <div className="users-modal-section">
                <h4><Trophy size={16} /> الجوائز</h4>
                <ul className="users-prize-list">
                  {detail.prizes.draws?.map((p, i) => (
                    <li key={`d-${i}`}>سحب: {p.drawName} — {p.prize}</li>
                  ))}
                  {detail.prizes.wheel?.map((p) => (
                    <li key={p._id}>عجلة: {p.prizeName}</li>
                  ))}
                  {detail.prizes.honor?.map((p) => (
                    <li key={p._id}>شرف: {p.title || p.prizeName}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="users-modal-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onChat(user)}
              >
                <MessageCircle size={16} /> تواصل
              </button>
              <button type="button" className="btn-secondary" onClick={() => onBan(user._id)}>
                <Ban size={16} /> حظر
              </button>
              <button type="button" className="btn-danger" onClick={() => onDelete(user._id)}>
                <Trash2 size={16} /> حذف
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

const Users = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [options, setOptions] = useState({ regions: [], stores: [], sortOptions: [], activityLevels: [] });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [page, setPage] = useState(1);

  const listParams = useMemo(
    () => ({ debouncedSearch, sort, page, filters }),
    [debouncedSearch, sort, page, filters]
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.adminUsers(listParams),
    queryFn: async () => {
      const qs = buildQuery(debouncedSearch, sort, page, filters);
      const { data: res } = await axios.get(`/admin/users?${qs}`);
      return {
        users: res.users || [],
        pagination: res.pagination || { page: 1, pages: 1, total: 0, limit: 20 },
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination ?? { page: 1, pages: 1, total: 0, limit: 20 };
  const loading = isLoading && !data;
  const refreshing = isFetching && !isLoading;

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => v !== '' && v != null).length,
    [filters]
  );

  const fetchOptions = useCallback(async () => {
    try {
      const { data } = await axios.get('/admin/users/options');
      setOptions(data);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const refreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers(listParams) });
  };

  const fetchUsers = async (silent = false) => {
    if (silent) await refetch();
    else refreshUsers();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/admin/users/${deleteId}`);
      setDeleteId(null);
      setDetailId(null);
      fetchUsers(true);
    } catch {
    }
  };

  const handleBan = async (id) => {
    try {
      await axios.patch(`/admin/users/${id}/ban`);
      fetchUsers(true);
      if (detailId === id) setDetailId(null);
    } catch {
    }
  };

  const openUserChat = (user) => {
    if (!user?._id) return;
    navigate(`/chats/user/${user._id}`, {
      state: {
        userName: user.name,
        context: {
          itemType: 'Support',
          itemName: `دعم: ${user.name || 'مستخدم'}`,
          itemId: user._id,
        },
      },
    });
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header flex-col gap-4 lg:flex-row">
        <div className="admin-title">
          <h1>إدارة المستخدمين</h1>
          <p>
            {pagination.total.toLocaleString('ar')} مستخدم — فلاتر متقدمة للوصول السريع لأي حساب
          </p>
        </div>

        <div className="users-header-actions">
          <div className="search-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="ابحث بالاسم، الإيميل، أو الهاتف..."
              className="admin-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="admin-input users-sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            {(options.sortOptions?.length
              ? options.sortOptions
              : [
                  { value: 'newest', label: 'أحدث المستخدمين' },
                  { value: 'most_active', label: 'الأكثر نشاطاً' },
                  { value: 'least_active', label: 'الأقل نشاطاً' },
                  { value: 'highest_points', label: 'الأعلى نقاطاً' },
                ]
            ).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`users-filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter size={16} />
            فلاتر
            {activeFilterCount > 0 && <span className="users-filter-count">{activeFilterCount}</span>}
          </button>
          <button type="button" className="admin-card px-3 py-2" onClick={() => fetchUsers(true)}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-primary' : 'text-muted'} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="users-filters-panel admin-card">
          <div className="users-filters-grid">
            <label>
              المنطقة
              <select
                className="admin-input"
                value={filters.regionId}
                onChange={(e) => handleFilterChange('regionId', e.target.value)}
              >
                <option value="">الكل</option>
                {options.regions?.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </label>

            <label>
              متجر (عضوية)
              <select
                className="admin-input"
                value={filters.storeId}
                onChange={(e) => handleFilterChange('storeId', e.target.value)}
              >
                <option value="">أي متجر</option>
                {options.stores?.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </label>

            <label>
              منضم لمتجر
              <select
                className="admin-input"
                value={filters.joinedStore}
                onChange={(e) => handleFilterChange('joinedStore', e.target.value)}
              >
                <option value="">الكل</option>
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            </label>

            <label>
              فاز بجائزة
              <select
                className="admin-input"
                value={filters.wonPrize}
                onChange={(e) => handleFilterChange('wonPrize', e.target.value)}
              >
                <option value="">الكل</option>
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            </label>

            <label>
              سوق المستخدمين
              <select
                className="admin-input"
                value={filters.usesMarketplace}
                onChange={(e) => handleFilterChange('usesMarketplace', e.target.value)}
              >
                <option value="">الكل</option>
                <option value="yes">يستخدم</option>
                <option value="no">لا يستخدم</option>
              </select>
            </label>

            <label>
              مستوى النشاط
              <select
                className="admin-input"
                value={filters.activityLevel}
                onChange={(e) => handleFilterChange('activityLevel', e.target.value)}
              >
                <option value="">الكل</option>
                {(options.activityLevels || []).map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </label>

            <label>
              نقاط (من)
              <input
                type="number"
                className="admin-input"
                min="0"
                value={filters.pointsMin}
                onChange={(e) => handleFilterChange('pointsMin', e.target.value)}
              />
            </label>

            <label>
              نقاط (إلى)
              <input
                type="number"
                className="admin-input"
                min="0"
                value={filters.pointsMax}
                onChange={(e) => handleFilterChange('pointsMax', e.target.value)}
              />
            </label>

            <label>
              مشاركات (من)
              <input
                type="number"
                className="admin-input"
                min="0"
                value={filters.participationsMin}
                onChange={(e) => handleFilterChange('participationsMin', e.target.value)}
              />
            </label>

            <label>
              مشاركات (إلى)
              <input
                type="number"
                className="admin-input"
                min="0"
                value={filters.participationsMax}
                onChange={(e) => handleFilterChange('participationsMax', e.target.value)}
              />
            </label>

            <label>
              تسجيل من
              <input
                type="date"
                className="admin-input"
                value={filters.registeredFrom}
                onChange={(e) => handleFilterChange('registeredFrom', e.target.value)}
              />
            </label>

            <label>
              تسجيل إلى
              <input
                type="date"
                className="admin-input"
                value={filters.registeredTo}
                onChange={(e) => handleFilterChange('registeredTo', e.target.value)}
              />
            </label>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" className="users-clear-filters" onClick={clearFilters}>
              <X size={14} /> مسح الفلاتر
            </button>
          )}
        </div>
      )}

      <div className="admin-table-wrapper">
        {loading && users.length === 0 && (
          <LightLoadingHint label="جاري تحميل المستخدمين..." />
        )}

        {!loading && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th className="text-center">المنطقة</th>
                <th className="text-center">النقاط</th>
                <th className="text-center">النشاط</th>
                <th className="text-center">المشاركات</th>
                <th className="text-center">الجوائز</th>
                <th className="text-center">عجلة</th>
                <th className="text-center">الرتبة</th>
                <th className="text-center">الحالة</th>
                <th className="text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted">
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="users-row-clickable" onClick={() => setDetailId(user._id)}>
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-avatar">{user.name?.[0] || '?'}</div>
                        <div className="user-info-text">
                          <span className="user-name">{user.name}</span>
                          <span className="user-email">{user.email || user.phone}</span>
                          <div className="users-row-tags">
                            {user.hasStoreMembership && <span title="منضم لمتجر"><Store size={12} /></span>}
                            {user.hasPhysicalWheelPrize && <span title="جائزة مادية من العجلة"><Trophy size={12} className="text-amber-500" /></span>}
                            {user.hasWonPrize && !user.hasPhysicalWheelPrize && <span title="فائز"><Trophy size={12} /></span>}
                            {user.hasCompetitionHistory && <span title="شارك بمسابقات"><Star size={12} /></span>}
                            {user.usesMarketplace && <span title="سوق"><ShoppingBag size={12} /></span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center text-sm">{user.regionName || '—'}</td>
                    <td className="text-center font-bold">{(user.points ?? 0).toLocaleString('ar')}</td>
                    <td className="text-center">
                      <span className="users-activity-pill">{user.activityCount ?? 0}</span>
                      <span className="text-[10px] text-muted block">
                        {ACTIVITY_LABELS[user.activityLevel] || '—'}
                      </span>
                    </td>
                    <td className="text-center">{user.participationsCount ?? 0}</td>
                    <td className="text-center font-bold">{user.totalPrizesCount ?? 0}</td>
                    <td className="text-center">
                      {user.hasPhysicalWheelPrize ? (
                        <span className="badge badge-warning text-[10px]">مادية ({user.physicalWheelPrizes})</span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className={`rank-badge rank-${user.rank}`}>
                        {RANK_LABELS[user.rank] || user.rank}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {STATUS_LABELS[user.status] || user.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-btns">
                        <button
                          type="button"
                          className="icon-action-btn chat-action"
                          title="تواصل"
                          onClick={() => openUserChat(user)}
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn"
                          title="عرض"
                          onClick={() => setDetailId(user._id)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn"
                          title="حظر"
                          onClick={() => handleBan(user._id)}
                        >
                          <Ban size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn"
                          title="حذف"
                          onClick={() => setDeleteId(user._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="users-pagination">
          <button
            type="button"
            className="icon-action-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight size={20} />
          </button>
          <span className="text-muted text-sm">
            صفحة {pagination.page} من {pagination.pages} ({pagination.total.toLocaleString('ar')} مستخدم)
          </span>
          <button
            type="button"
            className="icon-action-btn"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      )}

      {deleteId && (
        <div className="users-modal-overlay">
          <div className="users-confirm-dialog admin-card">
            <h2>تأكيد الحذف</h2>
            <p className="text-muted text-sm">هل تريد حذف هذا الحساب نهائياً؟</p>
            <div className="users-confirm-actions">
              <button type="button" className="btn-danger" onClick={handleDelete}>حذف</button>
              <button type="button" className="btn-secondary" onClick={() => setDeleteId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <UserDetailModal
        userId={detailId}
        onClose={() => setDetailId(null)}
        onBan={handleBan}
        onDelete={(id) => {
          setDetailId(null);
          setDeleteId(id);
        }}
        onChat={(user) => {
          setDetailId(null);
          openUserChat(user);
        }}
      />
    </div>
  );
};

export default Users;
