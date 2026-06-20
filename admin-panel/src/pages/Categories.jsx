import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Layers, Plus, Edit, Trash2, LayoutGrid, List } from 'lucide-react';
import '../style/categories.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        try {
            // const response = await axios.get('/admin/categories');
            // setCategories(response.data);
            setCategories([
                { _id: '1', name: 'مطاعم وكافيهات', icon: '🍔', storeCount: 15 },
                { _id: '2', name: 'ملابس وأزياء', icon: '👕', storeCount: 8 },
                { _id: '3', name: 'إلكترونيات', icon: '📱', storeCount: 12 },
                { _id: '4', name: 'خدمات طبية', icon: '🏥', storeCount: 5 },
                { _id: '5', name: 'سوبر ماركت', icon: '🛒', storeCount: 20 },
            ]);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchCategories(); }, []);

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>تصنيفات المتاجر</h1>
                    <p>إدارة المجالات والأنشطة التجارية في المنصة</p>
                </div>
                <button className="btn-primary">
                    <Plus size={20} /> إضافة تصنيف جديد
                </button>
            </div>

            <div className="categories-grid">
                {categories.map((cat) => (
                    <div key={cat._id} className="category-card">
                        <div className="category-icon-box">
                            {cat.icon}
                        </div>
                        <h3 className="category-name">{cat.name}</h3>
                        <span className="category-count">{cat.storeCount} متجر مشترك</span>
                        
                        <div className="category-actions">
                            <button className="btn-edit flex items-center justify-center gap-2">
                                <Edit size={14} /> تعديل
                            </button>
                            <button className="icon-action-btn">
                                <Trash2 size={16} className="text-danger" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* كرت الإضافة السريع */}
                <div className="category-card border-dashed border-2 border-border-color opacity-60 hover:opacity-100 flex items-center justify-center cursor-pointer">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-border-color flex items-center justify-center mb-2">
                            <Plus size={24} />
                        </div>
                        <span className="text-sm font-bold">إضافة تصنيف</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
