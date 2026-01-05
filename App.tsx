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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Login State
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');

  // New Service Form State
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('20:00');
  const [newDesc, setNewDesc] = useState('');

  // Carregar dados iniciais e usuário salvo
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

    // Lógica simples de Admin para o MVP
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
    if (confirm("Deseja sair da sua conta?")) {
      setUser(null);
      localStorage.removeItem('escala_user');
    }
  };

  const handleDeleteService = (id: string) => {
    const serviceToDelete = services.find(s => s.id === id);
    if (!serviceToDelete) return;

    if (window.confirm(`Excluir permanentemente o culto de ${formatDate(serviceToDelete.date)}?`)) {
      setServices(prev => prev.filter(s => s.id !== id));
      setAssignments(prev => prev.filter(a => a.serviceId !== id));
    }
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
      description: newDesc
    };

    setServices(prev => [...prev, service]);
    setIsAddModalOpen(false);
    setNewDesc('');
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
    if (window.confirm("Remover esta inscrição da escala?")) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  const sortedServices = [...services].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Tela de Identificação (Login)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-blue-600 p-8 text-center text-white">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Escala Igreja</h1>
            <p className="text-blue-100 text-sm mt-1">Identifique-se para acessar</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <UserIcon className="w-3 h-3" /> Seu Nome
              </label>
              <input 
                type="text" required placeholder="Ex: João Silva"
                value={loginName} onChange={e => setLoginName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Phone className="w-3 h-3" /> Seu WhatsApp
              </label>
              <input 
                type="tel" required placeholder="(00) 00000-0000"
                value={loginPhone} onChange={e => setLoginPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95">
              Acessar Sistema <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm"><Users className="w-5 h-5" /></div>
          <h1 className="font-bold text-xl tracking-tight">Escala<span className="text-blue-600">Igreja</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none">{user.name}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg border border-transparent hover:border-red-100 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {user.role === 'ADMIN' && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-400 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center shadow-lg text-white gap-4">
            <div>
              <h2 className="text-lg font-bold">Painel de Gestão</h2>
              <p className="text-blue-100 text-sm">Crie novos cultos para que os voluntários possam se inscrever.</p>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:bg-blue-50 transition-all active:scale-95 shrink-0">
              <Plus className="w-5 h-5" /> Novo Culto
            </button>
          </div>
        )}

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800">
            <Calendar className="text-blue-600" /> Próximas Escalas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedServices.map(service => {
              const currentAssignments = assignments.filter(a => a.serviceId === service.id);
              const userInThis = currentAssignments.find(a => a.userId === user.id);

              return (
                <div key={service.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 border-slate-200 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{service.dayOfWeek} • {service.time}</p>
                      <h3 className="text-xl font-bold text-slate-800">{formatDate(service.date)}</h3>
                    </div>
                    {user.role === 'ADMIN' && (
                      <button onClick={() => handleDeleteService(service.id)} className="p-2 text-slate-300 hover:text-red-600 bg-slate-50 rounded-lg border border-transparent hover:border-red-100 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {service.description && (
                    <div className="bg-blue-50 p-2 rounded-lg text-xs text-blue-700 font-medium flex items-center gap-2">
                      <Info className="w-3 h-3" /> {service.description}
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servos Confirmados:</p>
                    <div className="flex flex-wrap gap-2">
                      {currentAssignments.length > 0 ? (
                        currentAssignments.map(a => (
                          <div key={a.id} className="bg-slate-50 px-3 py-1.5 rounded-xl text-xs border border-slate-200 flex items-center gap-2 shadow-sm">
                            <span className="font-bold text-blue-600">{a.area}:</span>
                            <span className="text-slate-700 font-medium">{a.userName}</span>
                            {user.role === 'ADMIN' && (
                              <button onClick={() => handleRemoveAssignment(a.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs italic text-slate-400 py-1">Ninguém escalado ainda.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-3">
                    {service.isOpen ? (
                      userInThis ? (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 text-sm font-bold flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 shrink-0" /> 
                          <div>
                            <p className="leading-tight">Inscrito com sucesso!</p>
                            <p className="text-[10px] font-medium opacity-80">Área: {userInThis.area}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <select 
                            id={`area-${service.id}`} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Escolha sua área...</option>
                            {SERVICE_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                          </select>
                          <button 
                            onClick={() => {
                              const sel = document.getElementById(`area-${service.id}`) as HTMLSelectElement;
                              if (!sel.value) return alert("Por favor, selecione uma área.");
                              handleRegister(service.id, sel.value as ServiceArea);
                            }}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                          >
                            Confirmar na Escala
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-400 text-sm flex items-center justify-center gap-2 italic">
                        <Lock className="w-4 h-4" /> Escala Fechada pela Administração
                      </div>
                    )}

                    {user.role === 'ADMIN' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleToggleStatus(service.id)}
                          className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 p-2 rounded-lg text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition-colors"
                        >
                          {service.isOpen ? <Lock className="w-3 h-3"/> : <Unlock className="w-3 h-3"/>}
                          {service.isOpen ? 'Fechar' : 'Abrir'}
                        </button>
                        <a 
                          href={`https://wa.me/?text=${generateWhatsAppText(`${formatDate(service.date)}`, currentAssignments)}`}
                          target="_blank" rel="noreferrer"
                          className="flex-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 p-2 rounded-lg text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modal Novo Culto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAddModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800">
                <Calendar className="text-blue-600 w-5 h-5" /> Adicionar Culto
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-white rounded-lg transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddService} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Data do Evento</label>
                <input 
                  type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Horário</label>
                  <input 
                    type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição Opcional</label>
                <input 
                  type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Ex: Culto da Vitória, Ceia..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                Criar Culto e Abrir Escala
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
