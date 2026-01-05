import React, { useState, useEffect } from 'react';
import { ChurchService, Assignment, User, ServiceArea, ServiceDay } from './types';
import { SERVICE_AREAS } from './constants';
import { formatDate, generateWhatsAppText, maskPhoneBR, downloadCSV } from './lib/utils';
import { 
  Calendar, 
  Users, 
  Lock, 
  Unlock, 
  Trash2, 
  MessageCircle, 
  CheckCircle2,
  Plus,
  X,
  ChevronRight,
  Phone,
  User as UserIcon,
  LogOut,
  Info,
  Pencil,
  Bell,
  AlertTriangle,
  LayoutDashboard,
  ClipboardList,
  Download,
  ExternalLink,
  TrendingUp,
  UserCheck,
  History,
  MapPin,
  Clock,
  Settings2,
  Search,
  UserMinus,
  MessageSquare,
  Save,
  UserCog,
  Layers,
  ListPlus,
  ArrowRight
} from 'lucide-react';

const DAY_NAMES: ServiceDay[] = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

type View = 'HOME' | 'ADMIN' | 'MANAGE_SERVOS' | 'MANAGE_GLOBAL_AREAS';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('HOME');
  const [services, setServices] = useState<ChurchService[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [globalAreas, setGlobalAreas] = useState<string[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ChurchService | null>(null);
  const [editingAreasService, setEditingAreasService] = useState<ChurchService | null>(null);
  const [editingGlobalAreaIndex, setEditingGlobalAreaIndex] = useState<number | null>(null);
  const [editingGlobalAreaValue, setEditingGlobalAreaValue] = useState('');
  
  const [newAreaInput, setNewAreaInput] = useState('');
  const [newGlobalAreaInput, setNewGlobalAreaInput] = useState('');
  
  const [editingVolunteer, setEditingVolunteer] = useState<User | null>(null);
  const [serviceToConfirmDelete, setServiceToConfirmDelete] = useState<ChurchService | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [viewingVolunteerHistory, setViewingVolunteerHistory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');

  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('20:00');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const savedUser = localStorage.getItem('escala_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedServices = localStorage.getItem('escala_services');
    if (savedServices) {
      setServices(JSON.parse(savedServices));
    } else {
      const initialServices: ChurchService[] = [
        { id: 's1', date: '2023-11-23', time: '20:00', dayOfWeek: 'Quinta-feira', isOpen: true, description: 'Culto de Oração', areas: [...SERVICE_AREAS] },
        { id: 's2', date: '2023-11-25', time: '20:00', dayOfWeek: 'Sábado', isOpen: true, description: 'Reunião de Jovens', areas: [...SERVICE_AREAS] }
      ];
      setServices(initialServices);
    }

    const savedAssignments = localStorage.getItem('escala_assignments');
    if (savedAssignments) setAssignments(JSON.parse(savedAssignments));

    const savedVolunteers = localStorage.getItem('escala_volunteers');
    if (savedVolunteers) setVolunteers(JSON.parse(savedVolunteers));

    const savedGlobalAreas = localStorage.getItem('escala_global_areas');
    if (savedGlobalAreas) {
      setGlobalAreas(JSON.parse(savedGlobalAreas));
    } else {
      setGlobalAreas([...SERVICE_AREAS]);
    }
  }, []);

  useEffect(() => {
    if (services.length > 0) localStorage.setItem('escala_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('escala_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('escala_volunteers', JSON.stringify(volunteers));
  }, [volunteers]);

  useEffect(() => {
    if (globalAreas.length > 0) localStorage.setItem('escala_global_areas', JSON.stringify(globalAreas));
  }, [globalAreas]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = loginPhone.replace(/\D/g, "");
    if (!loginName.trim()) { alert("Por favor, preencha seu nome."); return; }
    if (cleanPhone.length < 10) { alert("Por favor, preencha um número de WhatsApp válido com DDD."); return; }

    const role = (loginName.toLowerCase().includes('admin') || cleanPhone === '000') ? 'ADMIN' : 'SERVO';
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: loginName,
      whatsapp: loginPhone, 
      role: role
    };

    setUser(newUser);
    localStorage.setItem('escala_user', JSON.stringify(newUser));

    setVolunteers(prev => {
      const exists = prev.find(v => v.whatsapp === newUser.whatsapp);
      if (exists) return prev.map(v => v.whatsapp === newUser.whatsapp ? { ...v, name: newUser.name } : v);
      return [...prev, newUser];
    });

    showToast(`Bem-vindo, ${loginName.split(' ')[0]}!`);
  };

  const handleLogout = () => {
    if (confirm("Deseja sair da sua conta?")) {
      setUser(null);
      localStorage.removeItem('escala_user');
      setCurrentView('HOME');
    }
  };

  const handleDeleteService = (id: string) => {
    const service = services.find(s => s.id === id);
    if (service) {
      setServiceToConfirmDelete(service);
      setDeleteConfirmationInput('');
    }
  };

  const confirmDelete = () => {
    if (!serviceToConfirmDelete) return;
    setServices(prev => prev.filter(s => s.id !== serviceToConfirmDelete.id));
    setAssignments(prev => prev.filter(a => a.serviceId !== serviceToConfirmDelete.id));
    setServiceToConfirmDelete(null);
    showToast("Culto removido com sucesso.", "info");
  };

  const handleDeleteVolunteer = (id: string) => {
    const volunteer = volunteers.find(v => v.id === id);
    if (!volunteer) return;
    if (window.confirm(`Tem certeza que deseja remover ${volunteer.name}? Todas as escalas dele serão apagadas.`)) {
      setAssignments(prev => prev.filter(a => a.userName !== volunteer.name));
      setVolunteers(prev => prev.filter(v => v.id !== id));
      showToast("Voluntário removido da base.");
    }
  };

  const handleUpdateVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVolunteer) return;

    const oldName = volunteers.find(v => v.id === editingVolunteer.id)?.name;

    setVolunteers(prev => prev.map(v => v.id === editingVolunteer.id ? editingVolunteer : v));

    if (oldName && oldName !== editingVolunteer.name) {
      setAssignments(prev => prev.map(a => a.userName === oldName ? { ...a, userName: editingVolunteer.name } : a));
    }

    if (user && user.id === editingVolunteer.id) {
      setUser(editingVolunteer);
      localStorage.setItem('escala_user', JSON.stringify(editingVolunteer));
    }

    setEditingVolunteer(null);
    showToast("Dados do voluntário atualizados!");
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(newDate + 'T12:00:00');
    const service: ChurchService = {
      id: Math.random().toString(36).substr(2, 9),
      date: newDate,
      time: newTime,
      dayOfWeek: DAY_NAMES[dateObj.getDay()],
      isOpen: true,
      description: newDesc,
      areas: [...globalAreas] 
    };
    setServices(prev => [...prev, service]);
    setIsAddModalOpen(false);
    setNewDesc('');
    showToast("Novo culto publicado!");
  };

  const handleUpdateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    const dateParts = editingService.date.split('-').map(Number);
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);
    const dayOfWeek = DAY_NAMES[dateObj.getDay()];

    const updatedService: ChurchService = {
      ...editingService,
      dayOfWeek
    };

    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
    setEditingService(null);
    showToast("Dados do culto atualizados!");
  };

  // GLOBAL AREAS LOGIC
  const handleAddGlobalArea = () => {
    const val = newGlobalAreaInput.trim();
    if (!val) return;
    if (globalAreas.includes(val)) {
      alert("Área já existe.");
      return;
    }

    // Update global list
    setGlobalAreas(prev => [...prev, val]);

    // Propagate to all open services
    setServices(prev => prev.map(s => {
      if (s.isOpen) {
        const currentAreas = s.areas || [...globalAreas];
        if (!currentAreas.includes(val)) {
          return { ...s, areas: [...currentAreas, val] };
        }
      }
      return s;
    }));

    setNewGlobalAreaInput('');
    showToast(`Área "${val}" adicionada globalmente.`);
  };

  const handleUpdateGlobalArea = (index: number) => {
    const oldName = globalAreas[index];
    const newName = editingGlobalAreaValue.trim();
    if (!newName || newName === oldName) {
      setEditingGlobalAreaIndex(null);
      return;
    }

    // Update global list
    const updatedGlobal = [...globalAreas];
    updatedGlobal[index] = newName;
    setGlobalAreas(updatedGlobal);

    // Propagate to open services and their assignments
    setServices(prev => prev.map(s => {
      if (s.isOpen && s.areas) {
        return { ...s, areas: s.areas.map(a => a === oldName ? newName : a) };
      }
      return s;
    }));

    setAssignments(prev => prev.map(a => {
      const s = services.find(srv => srv.id === a.serviceId);
      if (s?.isOpen && a.area === oldName) {
        return { ...a, area: newName };
      }
      return a;
    }));

    setEditingGlobalAreaIndex(null);
    showToast("Área renomeada em todos os cultos abertos.");
  };

  const handleRemoveGlobalArea = (name: string) => {
    if (!confirm(`Tem certeza que deseja remover "${name}" de todas as escalas abertas? Isso cancelará inscrições existentes nesta vaga.`)) return;

    // Remove from global
    setGlobalAreas(prev => prev.filter(a => a !== name));

    // Propagate removal
    setServices(prev => prev.map(s => {
      if (s.isOpen && s.areas) {
        return { ...s, areas: s.areas.filter(a => a !== name) };
      }
      return s;
    }));

    // Remove assignments in open services for this area
    setAssignments(prev => prev.filter(a => {
      const s = services.find(srv => srv.id === a.serviceId);
      return !(s?.isOpen && a.area === name);
    }));

    showToast("Vaga removida globalmente.");
  };

  // PER-SERVICE AREAS LOGIC
  const handleAddArea = (serviceId: string) => {
    if (!newAreaInput.trim()) return;
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        const areas = s.areas || [...globalAreas];
        if (areas.includes(newAreaInput.trim())) {
          alert("Esta área já existe.");
          return s;
        }
        return { ...s, areas: [...areas, newAreaInput.trim()] };
      }
      return s;
    }));
    setNewAreaInput('');
    showToast("Nova vaga adicionada.");
  };

  const handleRemoveArea = (serviceId: string, areaName: string) => {
    const hasAssignments = assignments.some(a => a.serviceId === serviceId && a.area === areaName);
    if (hasAssignments) {
      if (!confirm(`Atenção: Já existem servos escalados para "${areaName}". Deseja realmente remover esta área e cancelar as inscrições vinculadas?`)) return;
      setAssignments(prev => prev.filter(a => !(a.serviceId === serviceId && a.area === areaName)));
    }

    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        const areas = s.areas || [...globalAreas];
        return { ...s, areas: areas.filter(a => a !== areaName) };
      }
      return s;
    }));
    showToast("Vaga removida da escala.");
  };

  const handleToggleStatus = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isOpen: !s.isOpen } : s));
    const service = services.find(s => s.id === id);
    showToast(service?.isOpen ? "Escala fechada." : "Escala aberta para inscrições.", "info");
  };

  const handleRegister = (serviceId: string, area: ServiceArea) => {
    if (!user) return;
    const alreadyInService = assignments.some(a => a.serviceId === serviceId && a.userId === user.id);
    if (alreadyInService) { alert("Você já está inscrito neste culto!"); return; }
    const areaTaken = assignments.find(a => a.serviceId === serviceId && a.area === area);
    if (areaTaken) { alert(`A área "${area}" já foi ocupada por ${areaTaken.userName}.`); return; }

    const newAssignment: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId,
      userId: user.id,
      userName: user.name,
      area
    };
    setAssignments(prev => [...prev, newAssignment]);
    showToast("Sua inscrição foi confirmada!");
  };

  const handleRemoveAssignment = (id: string) => {
    if (window.confirm("Remover esta inscrição da escala?")) {
      setAssignments(prev => prev.filter(a => a.id !== id));
      showToast("Inscrição removida.", "info");
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Data", "Horário", "Área", "Nome do Servo"],
      ...assignments.map(a => {
        const s = services.find(srv => srv.id === a.serviceId);
        return [s ? formatDate(s.date) : "N/A", s?.time || "", a.area, a.userName];
      })
    ];
    downloadCSV("escala_completa.csv", rows);
    showToast("Relatório CSV baixado.");
  };

  const sortedServices = [...services].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalSlots = services.reduce((acc, s) => acc + (s.areas?.length || globalAreas.length), 0);
  const filledSlots = assignments.length;
  const uniqueVolunteersCount = Array.from(new Set(assignments.map(a => a.userName))).length;
  
  const volunteerRanking = Array.from(
    new Map<string, { name: string; count: number }>(
      assignments.map(a => [
        a.userName, 
        { name: a.userName, count: assignments.filter(x => x.userName === a.userName).length }
      ])
    ).values()
  ).sort((a, b) => b.count - a.count);

  const filteredVolunteers = volunteers.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.whatsapp.includes(searchTerm)
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-blue-600 p-10 text-center text-white">
            <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
              <Users className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Escala Igreja</h1>
            <p className="text-blue-100 text-sm mt-2 font-medium">Acesse o sistema de escalas</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 px-1">
                <UserIcon className="w-3.5 h-3.5" /> Seu Nome Completo *
              </label>
              <input 
                type="text" required placeholder="Ex: João Silva"
                value={loginName} onChange={e => setLoginName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 px-1">
                <Phone className="w-3.5 h-3.5" /> WhatsApp (DDD + Número) *
              </label>
              <input 
                type="tel" required placeholder="(00) 00000-0000"
                value={loginPhone} 
                onChange={e => setLoginPhone(maskPhoneBR(e.target.value))}
                maxLength={15}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              Entrar no Sistema <ChevronRight className="w-5 h-5" />
            </button>
            <p className="text-[10px] text-center text-zinc-600 uppercase tracking-widest font-bold">Campos com * são obrigatórios</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 pb-28 md:pb-20">
      <header className="bg-zinc-900/50 backdrop-blur-lg border-b border-zinc-800 sticky top-0 z-40 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><Users className="w-6 h-6" /></div>
          <h1 className="font-bold text-xl tracking-tighter">Escala<span className="text-blue-500">Igreja</span></h1>
        </div>
        
        {user.role === 'ADMIN' && (
          <nav className="hidden md:flex bg-zinc-800/50 border border-zinc-700 p-1 rounded-2xl gap-1">
            <button 
              onClick={() => setCurrentView('HOME')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${currentView === 'HOME' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            >
              <ClipboardList className="w-4 h-4" /> Escalas
            </button>
            <button 
              onClick={() => setCurrentView('ADMIN')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${currentView === 'ADMIN' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Painel
            </button>
            <button 
              onClick={() => setCurrentView('MANAGE_SERVOS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${currentView === 'MANAGE_SERVOS' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            >
              <Users className="w-4 h-4" /> Servos
            </button>
            <button 
              onClick={() => setCurrentView('MANAGE_GLOBAL_AREAS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${currentView === 'MANAGE_GLOBAL_AREAS' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            >
              <Layers className="w-4 h-4" /> Áreas
            </button>
          </nav>
        )}

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none">{user.name}</p>
            <p className="text-[10px] text-blue-500 uppercase tracking-widest font-black mt-1">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2.5 text-zinc-500 hover:text-red-500 bg-zinc-800 border border-zinc-700 rounded-xl transition-all hover:bg-zinc-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {user.role === 'ADMIN' && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-800 p-1.5 rounded-3xl shadow-2xl flex w-[94%] max-w-md backdrop-blur-xl overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setCurrentView('HOME')}
            className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${currentView === 'HOME' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
          >
            <ClipboardList className="w-5 h-5 mb-1" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Escalas</span>
          </button>
          <button 
            onClick={() => setCurrentView('ADMIN')}
            className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${currentView === 'ADMIN' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
          >
            <LayoutDashboard className="w-5 h-5 mb-1" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Painel</span>
          </button>
          <button 
            onClick={() => setCurrentView('MANAGE_SERVOS')}
            className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${currentView === 'MANAGE_SERVOS' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Servos</span>
          </button>
          <button 
            onClick={() => setCurrentView('MANAGE_GLOBAL_AREAS')}
            className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${currentView === 'MANAGE_GLOBAL_AREAS' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
          >
            <Layers className="w-5 h-5 mb-1" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Áreas</span>
          </button>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-6 md:py-10">
        {currentView === 'HOME' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <section>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black flex items-center gap-3 text-white tracking-tight">
                  <Calendar className="text-blue-500 w-8 h-8" /> Próximas Escalas
                </h2>
                {user.role === 'ADMIN' && (
                   <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98]">
                    <Plus className="w-5 h-5" /> NOVO CULTO
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {sortedServices.map(service => {
                  const currentAssignments = assignments.filter(a => a.serviceId === service.id);
                  const userInThis = currentAssignments.find(a => a.userId === user.id);
                  const currentAreas = service.areas || globalAreas;

                  return (
                    <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl hover:border-zinc-700 transition-all flex flex-col gap-5 relative overflow-hidden group/card">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-blue-500/20">{service.dayOfWeek}</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{service.time}</span>
                          </div>
                          <h3 className="text-2xl font-black text-white">{formatDate(service.date)}</h3>
                        </div>
                        {user.role === 'ADMIN' && (
                          <div className="flex gap-2">
                            <button onClick={() => setEditingService(service)} className="p-2 text-zinc-400 hover:text-blue-500 bg-zinc-800 rounded-xl border border-zinc-700 transition-all"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteService(service.id)} className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-800 rounded-xl border border-zinc-700 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>

                      {service.description && (
                        <div className="bg-zinc-800/50 p-3 rounded-2xl text-xs text-zinc-300 font-medium border border-zinc-700/50 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-500 shrink-0" /> {service.description}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3 h-3" /> Servos Escalados ({currentAssignments.length}/{currentAreas.length})
                          </p>
                          {user.role === 'ADMIN' && (
                            <button onClick={() => setEditingAreasService(service)} className="text-[10px] font-black text-blue-500 hover:underline uppercase flex items-center gap-1">
                              <Layers className="w-3 h-3" /> Gerenciar Vagas
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {currentAssignments.length > 0 ? (
                            currentAssignments.map(a => (
                              <div key={a.id} className="bg-zinc-800 px-4 py-3 rounded-2xl text-sm border border-zinc-700 flex items-center justify-between group/item">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-blue-500 uppercase">{a.area}</span>
                                  <span className="text-white font-bold">{a.userName}</span>
                                </div>
                                {(user.role === 'ADMIN' || a.userId === user.id) && (
                                  <button onClick={() => handleRemoveAssignment(a.id)} className="text-zinc-600 hover:text-red-500 transition-all"><X className="w-4 h-4" /></button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs italic text-zinc-600 text-center py-4 bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-800">Ninguém escalado.</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col gap-4">
                        {service.isOpen ? (
                          userInThis ? (
                            <div className="bg-green-500/10 text-green-500 p-4 rounded-2xl border border-green-500/20 text-sm font-bold flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6" /> 
                              <div><p className="leading-tight">Você está na escala!</p><p className="text-[10px] font-medium opacity-70">Área: {userInThis.area}</p></div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <select id={`area-${service.id}`} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
                                <option value="">Selecione sua área...</option>
                                {currentAreas.map(area => {
                                  const occupant = currentAssignments.find(a => a.area === area);
                                  return (
                                    <option key={area} value={area} disabled={!!occupant}>
                                      {area} {occupant ? `— Ocupado por ${occupant.userName}` : '(Disponível)'}
                                    </option>
                                  );
                                })}
                              </select>
                              <button onClick={() => {
                                const sel = document.getElementById(`area-${service.id}`) as HTMLSelectElement;
                                if (!sel.value) return alert("Por favor, selecione uma área.");
                                handleRegister(service.id, sel.value);
                              }} className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all shadow-xl">CONFIRMAR PRESENÇA</button>
                            </div>
                          )
                        ) : (
                          <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-800 text-zinc-500 text-sm flex items-center justify-center gap-3 italic font-medium">
                            <Lock className="w-5 h-5" /> ESCALA FECHADA
                          </div>
                        )}

                        {user.role === 'ADMIN' && (
                          <div className="flex gap-2">
                            <button onClick={() => setEditingService(service)} className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all text-blue-400">
                              <Settings2 className="w-4 h-4"/> EDITAR
                            </button>
                            <a href={`https://wa.me/?text=${generateWhatsAppText(`${formatDate(service.date)}`, currentAssignments)}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all">
                              <MessageCircle className="w-4 h-4" /> WHATSAPP
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : currentView === 'ADMIN' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Total de Cultos', value: services.length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Vagas Preenchidas', value: filledSlots, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Vagas Totais', value: totalSlots, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Voluntários Ativos', value: uniqueVolunteersCount, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 p-5 md:p-6 rounded-3xl shadow-xl flex items-center gap-4">
                  <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}><stat.icon className="w-6 h-6" /></div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-tight">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
              <div className="lg:col-span-1 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white flex items-center gap-2"><UserCheck className="text-blue-500 w-5 h-5" /> Ranking</h3>
                  <button onClick={() => setCurrentView('MANAGE_SERVOS')} className="text-[10px] font-black text-blue-500 hover:underline uppercase tracking-widest">Ver Todos</button>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
                  <div className="divide-y divide-zinc-800">
                    {volunteerRanking.length > 0 ? volunteerRanking.slice(0, 5).map((vol, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">#{i+1}</div>
                          <div>
                            <p className="text-sm font-bold text-white">{vol.name}</p>
                            <p className="text-[10px] text-zinc-500 font-medium">{vol.count} cultos</p>
                          </div>
                        </div>
                        <button onClick={() => setViewingVolunteerHistory(vol.name)} className="p-2 text-zinc-500 hover:text-blue-500 transition-colors"><History className="w-4 h-4" /></button>
                      </div>
                    )) : <p className="p-10 text-center text-xs text-zinc-600 italic">Nenhum voluntário ainda.</p>}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-white flex items-center gap-2"><ClipboardList className="text-blue-500 w-5 h-5" /> Relatório Geral</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg">
                      <Plus className="w-4 h-4" /> NOVO CULTO
                    </button>
                    <button onClick={handleExportCSV} className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 hover:bg-zinc-700">
                      <Download className="w-4 h-4" /> CSV
                    </button>
                  </div>
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="bg-zinc-800/50 text-[10px] font-black text-zinc-500 uppercase tracking-tighter border-b border-zinc-800">
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Vagas</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {sortedServices.map(s => {
                        const count = assignments.filter(a => a.serviceId === s.id).length;
                        const maxAreas = s.areas?.length || globalAreas.length;
                        const percent = (count / maxAreas) * 100;
                        return (
                          <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-white leading-none mb-1">{formatDate(s.date)}</p>
                              <p className="text-[10px] text-zinc-500">{s.dayOfWeek}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${s.isOpen ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                {s.isOpen ? 'Aberto' : 'Fechado'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden max-w-[80px]">
                                <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1">{count}/{maxAreas}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => setEditingAreasService(s)} className="p-2 text-zinc-500 hover:text-blue-400" title="Gerenciar Áreas"><Layers className="w-4 h-4" /></button>
                                <button onClick={() => setEditingService(s)} className="p-2 text-zinc-500 hover:text-amber-400" title="Editar"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleToggleStatus(s.id)} className="p-2 text-zinc-500 hover:text-white">{s.isOpen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}</button>
                                <button onClick={() => handleDeleteService(s.id)} className="p-2 text-zinc-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : currentView === 'MANAGE_SERVOS' ? (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentView('ADMIN')} className="bg-zinc-800 p-2.5 rounded-xl text-zinc-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                  <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Users className="text-blue-500 w-7 h-7" /> Gestão de Servos</h2>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome ou WhatsApp..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVolunteers.map(vol => {
                  const count = assignments.filter(a => a.userName === vol.name).length;
                  return (
                    <div key={vol.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl hover:border-zinc-700 transition-all flex flex-col gap-4 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-black text-lg border border-blue-500/20">{vol.name.charAt(0)}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white leading-tight">{vol.name}</p>
                              <button onClick={() => setEditingVolunteer(vol)} className="p-1.5 text-zinc-500 hover:text-amber-500 bg-zinc-800/50 rounded-lg border border-zinc-700/50 transition-all">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-0.5">{vol.role}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-800/50 p-3 rounded-2xl border border-zinc-800">
                          <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">WhatsApp</p>
                          <a href={`https://wa.me/${vol.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-white flex items-center gap-1.5 hover:text-green-500 transition-colors">
                            <Phone className="w-3 h-3" /> {vol.whatsapp}
                          </a>
                        </div>
                        <div className="bg-zinc-800/50 p-3 rounded-2xl border border-zinc-800">
                          <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Participação</p>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <CheckCircle2 className={`w-3 h-3 ${count > 0 ? 'text-emerald-500' : 'text-zinc-600'}`} /> {count} cultos
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <button 
                          onClick={() => setViewingVolunteerHistory(vol.name)} 
                          className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 border border-zinc-700 hover:border-blue-500 rounded-2xl transition-all"
                        >
                          <History className="w-5 h-5 text-blue-500 mb-1" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase">Histórico</span>
                        </button>
                        <a 
                          href={`https://wa.me/${vol.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 border border-zinc-700 hover:border-green-500 rounded-2xl transition-all"
                        >
                          <MessageSquare className="w-5 h-5 text-green-500 mb-1" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase">Conversar</span>
                        </a>
                        <button 
                          onClick={() => handleDeleteVolunteer(vol.id)} 
                          className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 border border-zinc-700 hover:border-red-500 rounded-2xl transition-all"
                        >
                          <UserMinus className="w-5 h-5 text-red-500 mb-1" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase">Remover</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        ) : (
          /* MANAGE_GLOBAL_AREAS VIEW */
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentView('ADMIN')} className="bg-zinc-800 p-2.5 rounded-xl text-zinc-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                  <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Layers className="text-blue-500 w-7 h-7" /> Áreas Globais</h2>
                </div>
             </div>

             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">
                <div className="space-y-3">
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    As áreas definidas aqui aparecerão por padrão em todos os <b>novos cultos</b> criados. 
                    Qualquer adição ou renomeação feita aqui será aplicada automaticamente em todos os cultos com status <b>Aberto</b>.
                  </p>
                </div>

                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Nova área global (Ex: Som, Mídia)"
                    value={newGlobalAreaInput}
                    onChange={e => setNewGlobalAreaInput(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleAddGlobalArea()}
                  />
                  <button 
                    onClick={handleAddGlobalArea}
                    className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 shrink-0"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Vagas Padrão da Igreja</p>
                  <div className="grid gap-3">
                    {globalAreas.map((area, idx) => (
                      <div key={idx} className="bg-zinc-800 border border-zinc-700 px-6 py-5 rounded-3xl flex items-center justify-between group transition-all hover:border-zinc-600">
                        {editingGlobalAreaIndex === idx ? (
                          <div className="flex-1 flex gap-2">
                             <input 
                              autoFocus
                              type="text" 
                              value={editingGlobalAreaValue}
                              onChange={e => setEditingGlobalAreaValue(e.target.value)}
                              className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <button onClick={() => handleUpdateGlobalArea(idx)} className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700"><Save className="w-4 h-4" /></button>
                            <button onClick={() => setEditingGlobalAreaIndex(null)} className="bg-zinc-700 text-zinc-300 p-2 rounded-xl hover:bg-zinc-600"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4">
                              <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                              <span className="font-bold text-white">{area}</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingGlobalAreaIndex(idx);
                                  setEditingGlobalAreaValue(area);
                                }}
                                className="p-2.5 text-zinc-500 hover:text-amber-500 hover:bg-zinc-700/50 rounded-xl transition-all"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveGlobalArea(area)}
                                className="p-2.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-700/50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* MODAL: Gerenciar Áreas do Culto (Individual) */}
      {editingAreasService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setEditingAreasService(null)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/10 p-2.5 rounded-xl text-blue-500"><Layers className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight uppercase">GERENCIAR VAGAS</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{formatDate(editingAreasService.date)}</p>
                </div>
              </div>
              <button onClick={() => setEditingAreasService(null)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome da vaga (Ex: Som, Mídia)"
                  value={newAreaInput}
                  onChange={e => setNewAreaInput(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleAddArea(editingAreasService.id)}
                />
                <button 
                  onClick={() => handleAddArea(editingAreasService.id)}
                  className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 shrink-0"
                >
                  <ListPlus className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Vagas Configuradas</p>
                {(editingAreasService.areas || globalAreas).map(area => {
                  const isAssigned = assignments.some(a => a.serviceId === editingAreasService.id && a.area === area);
                  return (
                    <div key={area} className="bg-zinc-800 border border-zinc-700 px-5 py-4 rounded-2xl flex items-center justify-between group/area">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">{area}</span>
                        {isAssigned && <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20">Preenchida</span>}
                      </div>
                      <button 
                        onClick={() => handleRemoveArea(editingAreasService.id, area)}
                        className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-zinc-800 bg-zinc-900/50">
              <button 
                onClick={() => setEditingAreasService(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-black text-sm uppercase transition-all"
              >
                Concluir Edição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Histórico do Voluntário */}
      {viewingVolunteerHistory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setViewingVolunteerHistory(null)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600/10 p-3 rounded-2xl text-blue-500"><UserCheck className="w-8 h-8" /></div>
                <div>
                  <h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-tight">{viewingVolunteerHistory}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Prontuário de Serviço</p>
                </div>
              </div>
              <button onClick={() => setViewingVolunteerHistory(null)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            
            <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {assignments
                  .filter(a => a.userName === viewingVolunteerHistory)
                  .sort((a, b) => {
                    const sA = services.find(s => s.id === a.serviceId);
                    const sB = services.find(s => s.id === b.serviceId);
                    if (!sA || !sB) return 0;
                    return new Date(sB.date).getTime() - new Date(sA.date).getTime();
                  })
                  .map(a => {
                    const service = services.find(s => s.id === a.serviceId);
                    if (!service) return null;
                    return (
                      <div key={a.id} className="bg-zinc-800/50 border border-zinc-800 rounded-2xl p-4 md:p-5 flex items-center justify-between group hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-700 group-hover:border-blue-500/30 transition-all">
                            <Calendar className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{formatDate(service.date)}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3 h-3" /> {service.time} — {service.dayOfWeek}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-blue-600/10 text-blue-500 text-[9px] md:text-[10px] font-black uppercase px-2 md:px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> {a.area}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between">
                <div className="text-center md:text-left">
                  <p className="text-xs font-black text-zinc-500 uppercase">Total de Serviços</p>
                  <p className="text-xl font-black text-white">{assignments.filter(a => a.userName === viewingVolunteerHistory).length}</p>
                </div>
                <button onClick={() => setViewingVolunteerHistory(null)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg">FECHAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-32 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-300 w-[90%] max-w-sm">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400/30' : 'bg-zinc-800/90 text-zinc-100 border-zinc-700'}`}>
            <div className="bg-white/20 p-1.5 rounded-lg shrink-0">{toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}</div>
            <p className="font-bold text-sm tracking-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Novo Culto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddModalOpen(false)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/10 p-2 rounded-xl text-blue-500"><Calendar className="w-6 h-6" /></div>
                <h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-tight">NOVO CULTO</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <form onSubmit={handleAddService} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">DATA</label>
                  <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">HORÁRIO</label>
                  <input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">DESCRIÇÃO (OPCIONAL)</label>
                <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ex: Culto de Ceia" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600 text-sm" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-[0.98] mt-4 uppercase">PUBLICAR ESCALA</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR VOLUNTÁRIO */}
      {editingVolunteer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setEditingVolunteer(null)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/10 p-2 rounded-xl text-blue-500"><UserCog className="w-6 h-6" /></div>
                <h3 className="font-black text-xl md:text-2xl text-white tracking-tight uppercase">EDITAR PERFIL</h3>
              </div>
              <button onClick={() => setEditingVolunteer(null)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <form onSubmit={handleUpdateVolunteer} className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">NOME COMPLETO</label>
                <input 
                  type="text" 
                  required 
                  value={editingVolunteer.name} 
                  onChange={e => setEditingVolunteer({...editingVolunteer, name: e.target.value})} 
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">WHATSAPP</label>
                <input 
                  type="tel" 
                  required 
                  value={editingVolunteer.whatsapp} 
                  onChange={e => setEditingVolunteer({...editingVolunteer, whatsapp: maskPhoneBR(e.target.value)})} 
                  maxLength={15}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">NÍVEL DE ACESSO</label>
                <select 
                  value={editingVolunteer.role} 
                  onChange={e => setEditingVolunteer({...editingVolunteer, role: e.target.value as any})}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer text-sm"
                >
                  <option value="SERVO">Servo (Padrão)</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingVolunteer(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-bold hover:bg-zinc-700 transition-all uppercase text-xs">Descartar</button>
                <button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-[0.98] uppercase text-xs flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CULTO */}
      {editingService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setEditingService(null)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-amber-600/10 p-2 rounded-xl text-amber-500"><Pencil className="w-6 h-6" /></div>
                <h3 className="font-black text-xl md:text-2xl text-white tracking-tight uppercase">EDITAR CULTO</h3>
              </div>
              <button onClick={() => setEditingService(null)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <form onSubmit={handleUpdateService} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">DATA</label>
                  <input type="date" required value={editingService.date} onChange={e => setEditingService({...editingService, date: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">HORÁRIO</label>
                  <input type="time" required value={editingService.time} onChange={e => setEditingService({...editingService, time: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">TÍTULO/DESCRIÇÃO</label>
                <input type="text" value={editingService.description || ''} onChange={e => setEditingService({...editingService, description: e.target.value})} placeholder="Ex: Culto de Ceia" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-zinc-600 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">STATUS</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingService({...editingService, isOpen: true})} className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${editingService.isOpen ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}><Unlock className="w-4 h-4" /> Aberta</button>
                  <button type="button" onClick={() => setEditingService({...editingService, isOpen: false})} className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${!editingService.isOpen ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}><Lock className="w-4 h-4" /> Fechada</button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingService(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-bold hover:bg-zinc-700 transition-all uppercase text-xs">Descartar</button>
                <button type="submit" className="flex-[2] bg-amber-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-amber-900/20 hover:bg-amber-700 transition-all active:scale-[0.98] uppercase text-xs flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de Exclusão */}
      {serviceToConfirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setServiceToConfirmDelete(null)} />
          <div className="bg-zinc-900 border border-red-500/30 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 border-b border-zinc-800 bg-red-500/5 flex flex-col items-center text-center gap-4">
              <div className="bg-red-500/20 p-5 rounded-full text-red-500"><AlertTriangle className="w-10 h-10" /></div>
              <div><h3 className="font-black text-2xl text-white uppercase tracking-tight">CONFIRMAR EXCLUSÃO</h3><p className="text-zinc-400 text-sm mt-1">Essa ação é irreversível.</p></div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <p className="text-zinc-300 text-sm font-medium text-center">Digite a data <span className="text-white font-bold">{formatDate(serviceToConfirmDelete.date)}</span> para confirmar:</p>
                <input type="text" placeholder="DD/MM/YYYY" value={deleteConfirmationInput} onChange={e => setDeleteConfirmationInput(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-5 outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-zinc-600 text-center font-black tracking-widest text-lg" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setServiceToConfirmDelete(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-bold hover:bg-zinc-700 transition-all uppercase text-xs order-2 sm:order-1">CANCELAR</button>
                <button disabled={deleteConfirmationInput !== formatDate(serviceToConfirmDelete.date)} onClick={confirmDelete} className="flex-[2] bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-4 rounded-2xl font-black shadow-xl uppercase text-xs order-1 sm:order-2">EXCLUIR AGORA</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}