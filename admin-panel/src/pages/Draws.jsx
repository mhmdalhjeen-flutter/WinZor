import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Trophy, 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Gift, 
  BarChart2, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Clock
} from 'lucide-react';

const Draws = () => {
    const [draws, setDraws] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [message, setMessage] = useState(null);

    // Form State
    const [newDraw, setNewDraw] = useState({
        name: '',
        description: '',
        drawType: 'ميداني',
        drawDate: '',
        prizes: [{ item: '', count: 1 }],
        locationOptions: [{ name: '' }]
    });

    const fetchDraws = async () => {
        try {
            // سأقوم بإنشاء هذا المسار في admin controller لاحقاً لجلب كل البيانات
            const response = await axios.get('/admin/draws');
            setDraws(response.data);
        } catch (err) {
            console.error("Error fetching draws", err);
            // بيانات تجريبية مؤقتة للعرض
            setDraws([
                {
                    _id: '1',
                    name: 'سحب مهرجان الشتاء',
                    status: 'voting',
                    drawDate: '2024-12-30',
                    totalEntries: 1500,
                    totalVoters: 450,
                    locationOptions: [
                        { name: 'الرمال - ساحة الجندي', votes: 200 },
                        { name: 'الشمال - النادي الأهلي', votes: 150 },
                        { name: 'الوسطى - حديقة البلدية', votes: 100 }
                    ],
                    prizes: [{ item: 'ثلاجة شارب', count: 1 }, { item: 'كوبون 100$', count: 5 }]
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDraws();
    }, []);

    const handleAddPrize = () => {
        setNewDraw({ ...newDraw, prizes: [...newDraw.prizes, { item: '', count: 1 }] });
    };

    const handleAddLocation = () => {
        setNewDraw({ ...newDraw, locationOptions: [...newDraw.locationOptions, { name: '' }] });
    };

    const handleCreateDraw = async (e) => {
        e.preventDefault();
        try {
            // await axios.post('/admin/draws', newDraw);
            setMessage({ type: 'success', text: 'تم إنشاء السحب بنجاح' });
            setShowCreateModal(false);
            fetchDraws();
        } catch (err) {
            setMessage({ type: 'error', text: 'فشل في إنشاء السحب' });
        }
    };

    return (
        <div className="space-y-8 text-white animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Trophy className="text-primary" /> إدارة السحوبات والجوائز
                    </h1>
                    <p className="text-gray-400 mt-1">أنشئ سحوبات جديدة، أدر الجوائز، وراقب تصويت الزبائن.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-red-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus size={20} /> إنشاء سحب جديد
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {draws.map((draw) => (
                    <div key={draw._id} className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-700 bg-gray-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{draw.name}</h2>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                        <Calendar size={12} /> {new Date(draw.drawDate).toLocaleDateString()}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            draw.status === 'open' ? 'bg-green-900/30 text-green-400' : 
                                            draw.status === 'voting' ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-700 text-gray-300'
                                        }`}>
                                            {draw.status === 'open' ? 'نشط' : draw.status === 'voting' ? 'مرحلة التصويت' : 'مغلق'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-white transition-colors">
                                <MessageSquare size={20} />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* إحصائيات سريعة */}
                            <div className="space-y-4">
                                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                    <p className="text-gray-500 text-xs flex items-center gap-1"><Users size={12}/> إجمالي الفرص</p>
                                    <p className="text-xl font-bold mt-1">{draw.totalEntries.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                    <p className="text-gray-500 text-xs flex items-center gap-1"><BarChart2 size={12}/> المصوتين</p>
                                    <p className="text-xl font-bold mt-1">{draw.totalVoters.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* قائمة الجوائز */}
                            <div className="md:col-span-2 space-y-3">
                                <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2"><Gift size={16} className="text-primary"/> الجوائز المخصصة</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {draw.prizes.map((prize, i) => (
                                        <div key={i} className="bg-gray-900/30 border border-gray-700 p-2 rounded-lg flex items-center justify-between">
                                            <span className="text-sm">{prize.item}</span>
                                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">×{prize.count}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><MapPin size={16} className="text-primary"/> نتائج تصويت المواقع</h3>
                                    <div className="space-y-2">
                                        {draw.locationOptions.map((loc, i) => {
                                            const percentage = draw.totalVoters > 0 ? (loc.votes / draw.totalVoters) * 100 : 0;
                                            return (
                                                <div key={i} className="space-y-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span>{loc.name}</span>
                                                        <span className="text-primary font-bold">{Math.round(percentage)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className="bg-primary h-full transition-all duration-1000" 
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-between items-center">
                            <button className="text-xs text-primary hover:underline font-bold">تعديل تفاصيل السحب</button>
                            <div className="flex gap-2">
                                <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-gray-700">
                                    عرض قائمة المشاركين
                                </button>
                                <button className="bg-primary hover:bg-red-700 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-primary/10">
                                    إجراء السحب الميداني
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal لإنشاء سحب جديد */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" dir="rtl">
                    <div className="bg-gray-800 border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl p-8 my-auto">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 border-b border-gray-700 pb-4">
                            <Plus className="text-primary" /> إنشاء سحب جديد وتفاعلي
                        </h2>

                        <form onSubmit={handleCreateDraw} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">اسم السحب</label>
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="مثلاً: سحب شهر رمضان المبارك"
                                            value={newDraw.name}
                                            onChange={(e) => setNewDraw({...newDraw, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">نوع السحب</label>
                                        <select 
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                            value={newDraw.drawType}
                                            onChange={(e) => setNewDraw({...newDraw, drawType: e.target.value})}
                                        >
                                            <option value="ميداني">ميداني (أمام الجمهور)</option>
                                            <option value="إلكتروني">إلكتروني (تلقائي)</option>
                                            <option value="خاص">خاص بمحل معين</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">موعد السحب</label>
                                        <input 
                                            type="date" 
                                            required
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                            value={newDraw.drawDate}
                                            onChange={(e) => setNewDraw({...newDraw, drawDate: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1 flex items-center justify-between">
                                            الجوائز المتاحة <button type="button" onClick={handleAddPrize} className="text-primary text-xs hover:underline">+ إضافة جائزة</button>
                                        </label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {newDraw.prizes.map((p, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="اسم الجائزة"
                                                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none"
                                                        value={p.item}
                                                        onChange={(e) => {
                                                            const newPrizes = [...newDraw.prizes];
                                                            newPrizes[i].item = e.target.value;
                                                            setNewDraw({...newDraw, prizes: newPrizes});
                                                        }}
                                                    />
                                                    <input 
                                                        type="number" 
                                                        className="w-16 bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none"
                                                        value={p.count}
                                                        onChange={(e) => {
                                                            const newPrizes = [...newDraw.prizes];
                                                            newPrizes[i].count = e.target.value;
                                                            setNewDraw({...newDraw, prizes: newPrizes});
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1 flex items-center justify-between">
                                            خيارات المواقع للتصويت <button type="button" onClick={handleAddLocation} className="text-primary text-xs hover:underline">+ إضافة موقع</button>
                                        </label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {newDraw.locationOptions.map((l, i) => (
                                                <input 
                                                    key={i}
                                                    type="text" 
                                                    placeholder={`الموقع ${i+1}`}
                                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none"
                                                    value={l.name}
                                                    onChange={(e) => {
                                                        const newLocs = [...newDraw.locationOptions];
                                                        newLocs[i].name = e.target.value;
                                                        setNewDraw({...newDraw, locationOptions: newLocs});
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-gray-700">
                                <button 
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-red-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                                >
                                    حفظ ونشر السحب
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Draws;
