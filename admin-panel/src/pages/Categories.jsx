import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Layers, 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Category Form
    const [newCatName, setNewCatName] = useState('');
    
    // Region Form
    const [newRegionName, setNewRegionName] = useState('');
    const [newSubRegion, setNewSubRegion] = useState('');
    const [selectedRegionId, setSelectedRegionId] = useState(null);

    const [message, setMessage] = useState(null);

    const fetchData = async () => {
        try {
            const [catRes, regRes] = await Promise.all([
                axios.get('/admin/categories'),
                axios.get('/admin/regions')
            ]);
            setCategories(catRes.data);
            setRegions(regRes.data);
        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Category Logic ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/admin/categories', { name: newCatName });
            setCategories([...categories, res.data]);
            setNewCatName('');
            setMessage({ type: 'success', text: 'تم إضافة التصنيف بنجاح' });
        } catch (err) {
            setMessage({ type: 'error', text: 'فشل إضافة التصنيف' });
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا التصنيف؟")) return;
        try {
            await axios.delete(`/admin/categories/${id}`);
            setCategories(categories.filter(c => c._id !== id));
        } catch (err) {
            alert("خطأ في الحذف");
        }
    };

    // --- Region Logic ---
    const handleAddRegion = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/admin/regions', { name: newRegionName });
            setRegions([...regions, res.data]);
            setNewRegionName('');
            setMessage({ type: 'success', text: 'تم إضافة المحافظة بنجاح' });
        } catch (err) {
            setMessage({ type: 'error', text: 'فشل إضافة المحافظة' });
        }
    };

    const handleAddSubRegion = async (regionId) => {
        if (!newSubRegion) return;
        const region = regions.find(r => r._id === regionId);
        try {
            const updatedSubRegions = [...region.subRegions, newSubRegion];
            const res = await axios.patch(`/admin/regions/${regionId}`, { subRegions: updatedSubRegions });
            setRegions(regions.map(r => r._id === regionId ? res.data : r));
            setNewSubRegion('');
        } catch (err) {
            alert("خطأ في إضافة المنطقة");
        }
    };

    return (
        <div className="space-y-8 text-white animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Layers className="text-primary" /> إدارة التصنيفات والمناطق
                </h1>
                <p className="text-gray-400 mt-1">تحكم في أنواع المتاجر المسموحة والتقسيمات الجغرافية للمنصة.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-900/30 border border-green-500 text-green-200' : 'bg-red-900/30 border border-red-500 text-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* قسم التصنيفات */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-700 bg-gray-900/30 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Layers size={20} className="text-primary" /> أنواع المتاجر (Categories)
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="مثلاً: مطاعم، ملابس..."
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                required
                            />
                            <button className="bg-primary hover:bg-red-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
                                <Plus size={18} /> إضافة
                            </button>
                        </form>

                        <div className="space-y-2">
                            {categories.map(cat => (
                                <div key={cat._id} className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-xl hover:border-gray-500 transition-all">
                                    <span className="font-medium">{cat.name}</span>
                                    <button 
                                        onClick={() => handleDeleteCategory(cat._id)}
                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* قسم المناطق */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-700 bg-gray-900/30 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <MapPin size={20} className="text-primary" /> إدارة المناطق (Regions)
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <form onSubmit={handleAddRegion} className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="إضافة محافظة (مثل: غزة)"
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={newRegionName}
                                onChange={(e) => setNewRegionName(e.target.value)}
                                required
                            />
                            <button className="bg-primary hover:bg-red-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
                                <Plus size={18} /> إضافة
                            </button>
                        </form>

                        <div className="space-y-4">
                            {regions.map(region => (
                                <div key={region._id} className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-all"
                                        onClick={() => setSelectedRegionId(selectedRegionId === region._id ? null : region._id)}
                                    >
                                        <span className="font-bold flex items-center gap-2">
                                            {region.name} 
                                            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400 font-normal">
                                                {region.subRegions.length} مناطق
                                            </span>
                                        </span>
                                        {selectedRegionId === region._id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                                    </div>
                                    
                                    {selectedRegionId === region._id && (
                                        <div className="p-4 bg-gray-900 border-t border-gray-700 space-y-4">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="إضافة حي/منطقة (مثل: الرمال)"
                                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                    value={newSubRegion}
                                                    onChange={(e) => setNewSubRegion(e.target.value)}
                                                />
                                                <button 
                                                    onClick={() => handleAddSubRegion(region._id)}
                                                    className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    إضافة
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {region.subRegions.map((sub, i) => (
                                                    <span key={i} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs border border-gray-700">
                                                        {sub}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Categories;
