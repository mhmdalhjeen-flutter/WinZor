import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Search, UserPlus, UserMinus, Ban, Trash2, 
  ShieldCheck, ShieldAlert, ChevronRight, ChevronLeft 
} from 'lucide-react';
import '../style/users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            setUsers([
                { _id: '1', name: 'أحمد محمد', email: 'ahmed@test.com', rank: 'gold', codesUsed: 55, status: 'active' },
                { _id: '2', name: 'سارة خالد', email: 'sara@test.com', rank: 'silver', codesUsed: 15, status: 'suspended' },
                { _id: '3', name: 'ياسين علي', email: 'yassin@test.com', rank: 'platinum', codesUsed: 120, status: 'active' },
            ]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>إدارة المستخدمين</h1>
                    <p>تحكم في حسابات الزبائن، الرتب، ورصيد الأكواد</p>
                </div>
                
                <div className="users-header-actions">
                    <div className="search-wrapper">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="ابحث بالاسم أو الإيميل..." 
                            className="admin-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary">
                        <UserPlus size={18} /> إضافة مستخدم
                    </button>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>المستخدم</th>
                            <th className="text-center">الرتبة</th>
                            <th className="text-center">رصيد الأكواد</th>
                            <th className="text-center">الحالة</th>
                            <th className="text-left">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td>
                                    <div className="user-profile-cell">
                                        <div className="user-avatar">{user.name[0]}</div>
                                        <div className="user-info-text">
                                            <span className="user-name">{user.name}</span>
                                            <span className="user-email">{user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <span className={`rank-badge rank-${user.rank}`}>
                                        {user.rank}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <div className="codes-counter">
                                        <UserMinus size={14} className="counter-btn" />
                                        <span className="font-bold">{user.codesUsed}</span>
                                        <UserPlus size={14} className="counter-btn" />
                                    </div>
                                </td>
                                <td className="text-center">
                                    <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                        {user.status === 'active' ? 'نشط' : 'محظور'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        <button className="icon-action-btn" title="حظر"><Ban size={16} /></button>
                                        <button className="icon-action-btn" title="حذف"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8">
                <button className="icon-action-btn"><ChevronRight size={20} /></button>
                <span className="text-muted text-sm">صفحة 1 من 10</span>
                <button className="icon-action-btn"><ChevronLeft size={20} /></button>
            </div>
        </div>
    );
};

export default Users;
