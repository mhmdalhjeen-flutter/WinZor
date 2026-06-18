import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Ticket, 
  Plus, 
  Download, 
  Store, 
  CheckCircle, 
  History,
  AlertCircle
} from 'lucide-react';

const PromoCodes = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    // Form State
    const [selectedStore, setSelectedStore] = useState('');
    const [count, setCount] = useState(50);
    const [points, setPoints] = useState(10);
    const [entries, setEntries] = useState(1);
    const [batchName, setBatchName] = useState('');
    
    const [generatedCodes, setGeneratedCodes] = useState([]);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await axios.get('/admin/stores');
                setStores(response.data.filter(s => s.isActive));
            } catch (err) {
                console.error("Error fetching stores", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setMessage(null);

        try {
            const response = await axios.post('/admin/generate-bulk-codes', {
                storeId: selectedStore,
                count: parseInt(count),
                rewardPoints: parseInt(points),
                rewardEntries: parseInt(entries),
                batchName
            });

            setGeneratedCodes(response.data.codes);
            setMessage({ type: 'success', text: response.data.message });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'فشل توليد الأكواد' });
        } finally {
            setGenerating(false);
        }
    };

    // وظيفة تصدير الأكواد إلى ملف CSV (يفتح في Excel)
    const exportToCSV = () => {
        if (generatedCodes.length === 0) return;

        const storeName = stores.find(s => s._id === selectedStore)?.name || 'Store';
        const headers = ['Code', 'Points', 'Entries', 'Batch Name', 'Store'];
        const rows = generatedCodes.map(c => [
            c.code,
            c.rewardPoints,
            c.rewardEntries,
            c.batchName,
            storeName
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM for Excel Arabic support
        csvContent += headers.join(",") + "\n";
        rows.forEach(row => {
            csvContent += row.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Codes_${storeName}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 text-white animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Ticket className="text-primary" /> إدارة وتوليد الأكواد
                </h1>
                <p className="text-gray-400 mt-1">توليد دفعات أكواد مطبوعة وربطها بالمتاجر والجوائز.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* نموذج التوليد */}
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl h-fit">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Plus size={20} className="text-primary" /> توليد دفعة جديدة
                    </h2>
                    
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">اختر المتجر</label>
                            <select 
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary text-white"
                                value={selectedStore}
                                onChange={(e) => setSelectedStore(e.target.value)}
                            >
                                <option value="">-- اختر متجر نشط --</option>
                                {stores.map(store => (
                                    <option key={store._id} value={store._id}>{store.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">عدد الأكواد (للطباعة)</label>
                            <input 
                                type="number" 
                                required
                                min="1"
                                max="500"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={count}
                                onChange={(e) => setCount(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">النقاط (XP)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">فرص السحب</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={entries}
                                    onChange={(e) => setEntries(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">اسم الدفعة (اختياري)</label>
                            <input 
                                type="text" 
                                placeholder="مثلاً: دفعة رأس السنة"
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                value={batchName}
                                onChange={(e) => setBatchName(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={generating || !selectedStore}
                            className={`w-full py-3 bg-primary hover:bg-red-700 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 ${generating ? 'opacity-50' : ''}`}
                        >
                            {generating ? 'جاري التوليد...' : 'توليد الأكواد الآن'}
                        </button>
                    </form>
                </div>

                {/* عرض الأكواد الناتجة */}
                <div className="lg:col-span-2 bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <History size={20} className="text-primary" /> الأكواد المولدة حديثاً
                        </h2>
                        {generatedCodes.length > 0 && (
                            <button 
                                onClick={exportToCSV}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-green-900/20"
                            >
                                <Download size={18} /> تصدير إلى Excel
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] p-6">
                        {message && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-900/30 border border-green-500 text-green-200' : 'bg-red-900/30 border border-red-500 text-red-200'}`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        {generatedCodes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-20">
                                <Ticket size={48} className="mb-4 opacity-20" />
                                <p>لم يتم توليد أي أكواد في هذه الجلسة بعد.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {generatedCodes.map((c, index) => (
                                    <div key={index} className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-center font-mono text-primary font-bold shadow-inner">
                                        {c.code}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoCodes;
