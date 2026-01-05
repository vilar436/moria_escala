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

  // Tela de Identificação (Login) - Dark
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
                <UserIcon className="w-3.5 h-3.5" /> Seu Nome Completo
              </label>
              <input 
                type="text" required placeholder="João Silva"
                value={loginName} onChange={e => setLoginName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 px-1">
                <Phone className="w-3.5 h-3.5" /> WhatsApp
              </label>
              <input 
                type="tel" required placeholder="(00) 00000-0000"
                value={loginPhone} onChange={e => setLoginPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              Entrar no Sistema <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 pb-20">
      <header className="bg-zinc-900/50 backdrop-blur-lg border-b border-zinc-800 sticky top-0 z-10 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-600/20"><Users className="w-6 h-6" /></div>
          <h1 className="font-bold text-2xl tracking-tighter">Escala<span className="text-blue-500">Igreja</span></h1>
        </div>
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

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {user.role === 'ADMIN' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center shadow-2xl gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-black text-white mb-1">Painel Administrativo</h2>
              <p className="text-zinc-400 text-sm">Gerencie os cultos e visualize a prontidão da equipe.</p>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:bg-blue-700 transition-all active:scale-95 shrink-0">
              <Plus className="w-6 h-6" /> ADICIONAR CULTO
            </button>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black flex items-center gap-3 text-white tracking-tight">
              <Calendar className="text-blue-500 w-8 h-8" /> Próximas Escalas
            </h2>
            <div className="h-px flex-1 bg-zinc-800 mx-6 hidden sm:block"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedServices.map(service => {
              const currentAssignments = assignments.filter(a => a.serviceId === service.id);
              const userInThis = currentAssignments.find(a => a.userId === user.id);

              return (
                <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl hover:border-zinc-700 transition-all flex flex-col gap-5 group">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-blue-500/20">
                          {service.dayOfWeek}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{service.time}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white">{formatDate(service.date)}</h3>
                    </div>
                    {user.role === 'ADMIN' && (
                      <button onClick={() => handleDeleteService(service.id)} className="p-2 text-zinc-600 hover:text-red-500 bg-zinc-800 rounded-xl border border-zinc-700 hover:border-red-500/30 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {service.description && (
                    <div className="bg-zinc-800/50 p-3 rounded-2xl text-xs text-zinc-300 font-medium border border-zinc-700/50 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500 shrink-0" /> {service.description}
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-3 h-3" /> Servos Escalados
                    </p>
                    <div className="flex flex-col gap-2">
                      {currentAssignments.length > 0 ? (
                        currentAssignments.map(a => (
                          <div key={a.id} className="bg-zinc-800 px-4 py-3 rounded-2xl text-sm border border-zinc-700 flex items-center justify-between group/item">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-500 uppercase">{a.area}</span>
                              <span className="text-white font-bold">{a.userName}</span>
                            </div>
                            {user.role === 'ADMIN' && (
                              <button onClick={() => handleRemoveAssignment(a.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs italic text-zinc-600 text-center py-4 bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-800">Escala vazia no momento.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col gap-4">
                    {service.isOpen ? (
                      userInThis ? (
                        <div className="bg-green-500/10 text-green-500 p-4 rounded-2xl border border-green-500/20 text-sm font-bold flex items-center gap-3">
                          <CheckCircle2 className="w-6 h-6 shrink-0" /> 
                          <div>
                            <p className="leading-tight">Confirmado!</p>
                            <p className="text-[10px] font-medium opacity-70">Área: {userInThis.area}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <select 
                            id={`area-${service.id}`} 
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Selecione sua área...</option>
                            {SERVICE_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                          </select>
                          <button 
                            onClick={() => {
                              const sel = document.getElementById(`area-${service.id}`) as HTMLSelectElement;
                              if (!sel.value) return alert("Por favor, selecione uma área.");
                              handleRegister(service.id, sel.value as ServiceArea);
                            }}
                            className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all shadow-xl active:scale-[0.98]"
                          >
                            CONFIRMAR NA ESCALA
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="bg-zinc-800/50 p-5 rounded-2xl border border-zinc-800 text-zinc-500 text-sm flex items-center justify-center gap-3 italic font-medium">
                        <Lock className="w-5 h-5" /> ESCALA ENCERRADA
                      </div>
                    )}

                    {user.role === 'ADMIN' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleToggleStatus(service.id)}
                          className="flex-1 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                        >
                          {service.isOpen ? <Lock className="w-4 h-4"/> : <Unlock className="w-4 h-4"/>}
                          {service.isOpen ? 'FECHAR' : 'ABRIR'}
                        </button>
                        <a 
                          href={`https://wa.me/?text=${generateWhatsAppText(`${formatDate(service.date)}`, currentAssignments)}`}
                          target="_blank" rel="noreferrer"
                          className="flex-1 bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all"
                        >
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
      </main>

      {/* Modal Novo Culto - Dark */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddModalOpen(false)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <h3 className="font-black text-2xl flex items-center gap-3 text-white">
                <Calendar className="text-blue-500 w-7 h-7" /> NOVO CULTO
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="w-6 h-6 text-zinc-500" />
              </button>
            </div>
            <form onSubmit={handleAddService} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-tighter">DATA DO EVENTO</label>
                <input 
                  type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} 
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-tighter">HORÁRIO</label>
                <input 
                  type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} 
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-tighter">DESCRIÇÃO (EX: CEIA)</label>
                <input 
                  type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Nome opcional para o culto" 
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-zinc-600" 
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-[0.98] mt-4">
                CRIAR E PUBLICAR
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="py-12 border-t border-zinc-900 text-center">
        <p className="text-zinc-600 text-sm font-medium">© 2023 Sistema de Escalas Igreja Local</p>
      </footer>
    </div>
  );
}
