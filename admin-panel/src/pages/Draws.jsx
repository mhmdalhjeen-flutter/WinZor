import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Trophy, Plus, Calendar, Users, 
  CheckCircle2, Clock, AlertCircle, PlayCircle 
} from 'lucide-react';

const Draws = () => {
    const [draws, setDraws] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDraws = async () => {
        try {
            // const response = await axios.get('/admin/draws');
            // setDraws(response.data);
            setDraws([
                { _id: '1', title: 'سحب المليون نقطة', status: 'active', participants: 450, endDate: '2023-12-30', type: 'نقاط' },
                { _id: '2', title: 'جائزة سيارة العيد', status: 'pending', participants: 0, endDate: '2024-04-10', type: 'سيارة' },
                { _id: '3', title: 'سحب آيفون 15 برو', status: 'completed', participants: 1200, endDate: '2023-11-15', type: 'جهاز' },
            ]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchDraws(); }, []);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'active': return <span className="badge badge-success flex items-center gap-1"><PlayCircle size={14}/> جارٍ الآن</span>;
            case 'pending': return <span className="badge badge-warning flex items-center gap-1"><Clock size={14}/> بانتظار البدء</span>;
            case 'completed': return <span className="badge flex items-center gap-1" style={{background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.2)'}}><CheckCircle2 size={14}/> مكتمل</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>إدارة الفعاليات والسحوبات</h1>
                    <p>قم بإنشاء السحوبات، متابعة المشاركين، وإعلان الفائزين</p>
                </div>
                <button className="btn-primary">
                    <Plus size={20} /> إنشاء سحب جديد
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draws.map((draw) => (
                    <div key={draw._id} className="admin-card hover:border-secondary/50 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-secondary/10 text-secondary rounded-2xl group-hover:bg-secondary group-hover:text-white transition-all">
                                <Trophy size={24} />
                            </div>
                            {getStatusBadge(draw.status)}
                        </div>
                        
                        <h3 className="text-xl font-bold mb-2">{draw.title}</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted flex items-center gap-2"><Users size={16}/> المشاركين</span>
                                <span className="font-bold">{draw.participants} زبون</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted flex items-center gap-2"><Calendar size={16}/> تاريخ السحب</span>
                                <span className="font-bold">{draw.endDate}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border-color flex gap-3">
                            <button className="flex-1 py-2 bg-dark hover:bg-border-color rounded-xl text-sm font-bold transition-all">التفاصيل</button>
                            {draw.status === 'active' && (
                                <button className="flex-1 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all">إنهاء يدوي</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Draws;
