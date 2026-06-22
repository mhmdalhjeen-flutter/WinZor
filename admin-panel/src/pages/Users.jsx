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
            const { data } = await axios.get("/admin/users?role=customer");
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
        };

        const [count, setCount] = useState(0);
        const [deleteId, setDeleteId] = useState(null);


            const fetchCount = async () => {
            const { data } = await axios.get("/admin/users/count");
            setCount(data.total);
            };

            useEffect(() => {
            fetchUsers();
            fetchCount();
            }, []);
            const handleDelete = async () => {
  try {
    await axios.delete(`/admin/users/${deleteId}`);
    setUsers(users.filter(u => u._id !== deleteId));
    setDeleteId(null);
  } catch (err) {
    console.error(err);
  }
};

            const handleBan = async (id) => {
  await axios.patch(`/admin/users/${id}/ban`);
  fetchUsers();
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
                                    
                                    <div className="action-btns" >
                                        <button className="icon-action-btn" title="حظر" onClick={() => handleBan(user._id)} ><Ban size={16} /></button>
                                        <button className="icon-action-btn"
                                        title="حذف"
                                        onClick={() => setDeleteId(user._id)}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {deleteId && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white w-[280px] p-4 rounded-lg shadow-lg text-center space-y-3">

      <h2 className="text-sm font-bold text-gray-800">
        تأكيد الحذف
      </h2>

      <p className="text-xs text-gray-500">
        هل تريد حذف هذا الحساب؟
      </p>

      <div className="flex gap-2 justify-center pt-2">

        <button
          onClick={handleDelete}
          className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-md hover:bg-red-600"
        >
          حذف
        </button>

        <button
          onClick={() => setDeleteId(null)}
          className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-md hover:bg-gray-300"
        >
          إلغاء
        </button>

      </div>

    </div>
  </div>
)}
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
