import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
    Trophy, Clock, User, Trash2, Star, Search, 
    Plus, ShieldCheck, Award, MessageSquare 
} from 'lucide-react';

const HonorManagement = () => {
    const [honorItems, setHonorItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        userId: '',
        title: '',
        message: '',
        awardImage: '',
        durationInHours: 24,
        priority: 0
    });

    useEffect(() => {
        fetchHonorItems();
    }, []);

    const fetchHonorItems = async () => {
        try {
            // const res = await axios.get('/honor/active');
            // setHonorItems(res.data);
            
            // بيانات تجريبية للمعاينة
            setHonorItems([
                { _id: '1', user: { name: 'محمد الفاتح', rank: 'platinum' }, title: 'أسطورة الأسبوع', message: 'حقق أعلى عدد من النقاط في سحب الشتاء', displayUntil: new Date(Date.now() + 86400000) },
                { _id: '2', user: { name: 'سارة القدس', rank: 'gold' }, title: 'صيادة الجوائز', message: 'فتحت 50 صندوق كنز في يوم واحد', displayUntil: new Date(Date.now() + 43200000) }
            ]);
        } catch (error) {
            console.error("خطأ في جلب لوحة الشرف", error);
        }
    };

    const handleSearchUser = async () => {
        if (!searchQuery) return;
        setLoading(true);
        try {
            const res = await axios.get(`/admin/users/search?query=${searchQuery}`);
            setUsers(res.data);
        } catch (error) {
            console.error("خطأ في البحث", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/honor/add', formData);
            setFormData({ userId: '', title: '', message: '', awardImage: '', durationInHours: 24, priority: 0 });
            fetchHonorItems();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>إدارة لوحة الشرف (الأساطير)</h1>
                    <p>قم بتكريم المستخدمين المتميزين وعرضهم في واجهة التطبيق الرئيسية</p>
                </div>
                <div className="flex gap-3">
                    <div className="admin-card py-2 px-4 bg-primary/5 border-primary/20 flex items-center gap-2">
                        <Award size={18} className="text-primary" />
                        <span className="text-sm font-bold text-primary">تكريم الأبطال</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* قسم إضافة أسطورة جديد */}
                <div className="admin-card">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                        <Plus className="text-primary" size={20} /> تنصيب أسطورة جديد
                    </h2>
                    
                    <div className="mb-6 space-y-2">
                        <label className="text-sm text-muted">البحث عن المستخدم المتميز</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                <input 
                                    type="text" 
                                    className="admin-input w-full pr-10"
                                    placeholder="ابحث بالاسم أو البريد..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleSearchUser}
                                className="bg-secondary text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition"
                            >
                                بحث
                            </button>
                        </div>
                    </div>

                    {users.length > 0 && (
                        <div className="mb-6 max-h-48 overflow-y-auto border border-border-color rounded-xl p-2 bg-dark/50 custom-scrollbar">
                            {users.map(u => (
                                <div 
                                    key={u._id} 
                                    onClick={() => setFormData({...formData, userId: u._id})}
                                    className={`p-3 cursor-pointer rounded-lg mb-1 flex items-center justify-between transition-all ${formData.userId === u._id ? 'bg-primary/20 border border-primary/40' : 'hover:bg-dark'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{u.name[0]}</div>
                                        <span className="font-bold text-sm text-white">{u.name}</span>
                                    </div>
                                    <span className={`rank-badge rank-${u.rank}`}>{u.rank}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-muted">اللقب الشرفي</label>
                            <input 
                                type="text" 
                                placeholder="مثلاً: ملك النقاط الأسبوعي" 
                                className="admin-input w-full"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-muted">وصف الإنجاز</label>
                            <textarea 
                                placeholder="اكتب هنا لماذا تم اختياره أسطورة..." 
                                className="admin-input w-full h-24"
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-muted">مدة الظهور (ساعة)</label>
                                <input 
                                    type="number" 
                                    className="admin-input w-full"
                                    value={formData.durationInHours}
                                    onChange={(e) => setFormData({...formData, durationInHours: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-muted">أيقونة الجائزة (اختياري)</label>
                                <input 
                                    type="text" 
                                    className="admin-input w-full"
                                    placeholder="رابط الصورة..."
                                    value={formData.awardImage}
                                    onChange={(e) => setFormData({...formData, awardImage: e.target.value})}
                                />
                            </div>
                        </div>
                        <button className="btn-primary w-full justify-center py-4 text-lg shadow-primary/30 mt-4">
                            تثبيت الأسطورة في لوحة الشرف 🚀
                        </button>
                    </form>
                </div>

                {/* قسم العناصر النشطة حالياً */}
                <div className="admin-card">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                        <Clock className="text-success" size={20} /> الأساطير المعروضون حالياً
                    </h2>
                    
                    <div className="space-y-4">
                        {honorItems.length === 0 ? (
                            <div className="py-20 text-center text-muted">
                                <Trophy size={48} className="mx-auto mb-4 opacity-10" />
                                <p>لا يوجد أساطير معروضون حالياً</p>
                            </div>
                        ) : (
                            honorItems.map(item => (
                                <div key={item._id} className="p-4 rounded-2xl bg-dark/40 border border-border-color/50 hover:border-primary/30 transition-all flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-2 border-primary/30 shrink-0">
                                        <User className="text-primary" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white">{item.user?.name}</h3>
                                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold uppercase">{item.title}</span>
                                        </div>
                                        <p className="text-xs text-muted mt-1 line-clamp-1 flex items-center gap-1">
                                            <MessageSquare size={12} /> {item.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
                                            <span className="flex items-center gap-1"><Clock size={10}/> تنتهي: {new Date(item.displayUntil).toLocaleString('ar-EG')}</span>
                                        </div>
                                    </div>
                                    <button className="icon-action-btn hover:text-danger hover:border-danger/50">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 p-4 bg-secondary/5 border border-secondary/20 rounded-2xl">
                        <div className="flex items-center gap-2 text-secondary mb-2">
                            <ShieldCheck size={16} />
                            <span className="text-sm font-bold">معلومات الظهور</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">
                            يتم عرض الأساطير في تطبيق الزبائن ضمن شريط متحرك في الصفحة الرئيسية لزيادة التفاعل وبث روح المنافسة.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HonorManagement;
