import React, { useState, useEffect } from 'react';
import { ChurchService, Assignment, User, ServiceArea, ServiceDay } from './types';
import { SERVICE_AREAS } from './constants';
import { formatDate, generateWhatsAppText, downloadCSV } from './lib/utils';
import { 
  Calendar, 
  Users, 
  Lock, 
  Unlock, 
  Trash2, 
  Download, 
  MessageCircle, 
  CheckCircle2,
  Plus,
  X,
  Pencil,
  Save,
  Info,
  Clock,
  ChevronRight,
  AlertTriangle,
  Phone,
  User as UserIcon,
  LogOut
} from 'lucide-react';

const DAY_NAMES: ServiceDay[] = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const STANDARD_SLOTS: Record<string, string[]> = {
  'Quinta-feira': ['20:00'],
  'Sábado': ['20:00'],
  'Domingo': ['09:30', '18:30']
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ChurchService | null>(null);
  
  // Login State
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');

  // New Service Form State
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('escala_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const initialServices: ChurchService[] = [
      { id: 's1', date: '2023-11-23', time: '20:00', dayOfWeek: 'Quinta-feira', isOpen: true, description: 'Culto de Oração' },
      { id: 's2', date: '2023-11-25', time: '20:00', dayOfWeek: 'Sábado', isOpen: true, description: 'Reunião de Jovens' },
      { id: 's3', date: '2023-11-26', time: '09:30', dayOfWeek: 'Domingo', isOpen: false, description: 'EBD' },
    ];
    setServices(initialServices);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName || !loginPhone) return;

    const role = (loginName.toLowerCase().includes('admin') || loginPhone === '000') ? 'ADMIN' : 'SERVO';
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: loginName,
      whatsapp: loginPhone,
      role: role
    };

    setUser(newUser);
    localStorage.setItem('escala_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    if (confirm("Deseja sair?")) {
      setUser(null);
      localStorage.removeItem('escala_user');
    }
  };

  const handleDeleteService = (id: string) => {
    const serviceToDelete = services.find(s => s.id === id);
    if (!serviceToDelete) return;

    if (window.confirm(`Tem certeza que deseja excluir o culto de ${formatDate(serviceToDelete.date)}?`)) {
      // Usando a função de atualização para garantir o estado mais recente e imutabilidade
      setServices(prev => prev.filter(s => s.id !== id));
      setAssignments(prev => prev.filter(a => a.serviceId !== id));
      if (editingService?.id === id) setEditingService(null);
    }
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(newDate + 'T12:00:00');
    const service: ChurchService = {
      id: Math.random().toString(36).substr(2, 9),
      date: newDate,
      time: newTime || '20:00',
      dayOfWeek: DAY_NAMES[dateObj.getDay()],
      isOpen: true,
      description: newDesc
    };

    setServices(prev => [...prev, service]);
    setIsAddModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isOpen: !s.isOpen } : s));
  };

  const handleRegister = (serviceId: string, area: ServiceArea) => {
    if (!user) return;
    const alreadyRegistered = assignments.some(a => a.serviceId === serviceId && a.userId === user.id);
    if (alreadyRegistered) {
      alert("Você já está inscrito neste culto!");
      return;
    }

    const newAssignment: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId,
      userId: user.id,
      userName: user.name,
      area
    };
    setAssignments(prev => [...prev, newAssignment]);
  };

  const handleRemoveAssignment = (id: string) => {
    if (window.confirm("Remover inscrição?")) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  const sortedServices = [...services].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-blue-600 p-8 text-center text-white">
            <Users className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Escala Igreja</h1>
            <p className="text-blue-100 text-sm mt-1">Entre com seus dados para continuar</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                <UserIcon className="w-3 h-3" /> Nome Completo
              </label>
              <input 
                type="text" required value={loginName} onChange={e => setLoginName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3" /> WhatsApp
              </label>
              <input 
                type="tel" required value={loginPhone} onChange={e => setLoginPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              Acessar Escala <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white"><Users className="w-5 h-5" /></div>
          <h1 className="font-bold text-xl">Escala<span className="text-blue-600">Igreja</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg border border-transparent hover:border-red-100">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {user.role === 'ADMIN' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex justify-between items-center shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-blue-900">Painel do Administrador</h2>
              <p className="text-blue-700 text-sm">Crie novos cultos e gerencie as escalas.</p>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
              <Plus className="w-4 h-4" /> Novo Culto
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedServices.map(service => {
            const currentAssignments = assignments.filter(a => a.serviceId === service.id);
            const userInThis = currentAssignments.find(a => a.userId === user.id);

            return (
              <div key={service.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">{service.dayOfWeek} • {service.time}</p>
                    <h3 className="text-xl font-bold text-slate-800">{formatDate(service.date)}</h3>
                  </div>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => handleDeleteService(service.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg border border-transparent hover:border-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Equipe confirmada:</p>
                  <div className="flex flex-wrap gap-2">
                    {currentAssignments.length > 0 ? (
                      currentAssignments.map(a => (
                        <div key={a.id} className="bg-slate-100 px-3 py-1 rounded-lg text-xs border border-slate-200 flex items-center gap-1">
                          <span className="font-bold">{a.area}:</span> {a.userName}
                          {user.role === 'ADMIN' && <button onClick={() => handleRemoveAssignment(a.id)} className="text-red-400 ml-1"><X className="w-3 h-3"/></button>}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-slate-400">Ninguém escalado ainda.</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t">
                  {service.isOpen ? (
                    userInThis ? (
                      <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 text-sm font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Você está escalado na {userInThis.area}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select id={`area-${service.id}`} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none">
                          <option value="">Escolha uma área...</option>
                          {SERVICE_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                        </select>
                        <button 
                          onClick={() => {
                            const sel = document.getElementById(`area-${service.id}`) as HTMLSelectElement;
                            if (sel.value) handleRegister(service.id, sel.value as ServiceArea);
                          }}
                          className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800"
                        >
                          Confirmar Disponibilidade
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-400 text-sm flex items-center justify-center gap-2 italic">
                      <Lock className="w-4 h-4" /> Escala Encerrada
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg flex items-center gap-2"><Calendar className="text-blue-600 w-5 h-5" /> Novo Culto</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Hora</label>
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ex: Santa Ceia" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Criar Culto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}