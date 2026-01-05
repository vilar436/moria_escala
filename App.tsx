
import React, { useState, useEffect } from 'react';
import { ChurchService, Assignment, User, ServiceArea, ServiceDay } from './types';
import { MOCK_USER, SERVICE_AREAS } from './constants';
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
  AlertTriangle
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
  const [user] = useState<User>(MOCK_USER);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ChurchService | null>(null);
  
  // New Service Form State
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Derived info for the New Service Modal
  const dateObj = new Date(newDate + 'T12:00:00');
  const selectedDayName = DAY_NAMES[dateObj.getDay()];
  const availableSlots = STANDARD_SLOTS[selectedDayName] || [];

  // Initial mock data
  useEffect(() => {
    const initialServices: ChurchService[] = [
      { id: 's1', date: '2023-11-23', time: '20:00', dayOfWeek: 'Quinta-feira', isOpen: true, description: 'Culto de Oração' },
      { id: 's2', date: '2023-11-25', time: '20:00', dayOfWeek: 'Sábado', isOpen: true, description: 'Reunião de Jovens' },
      { id: 's3', date: '2023-11-26', time: '09:30', dayOfWeek: 'Domingo', isOpen: false, description: 'EBD' },
    ];
    setServices(initialServices);
  }, []);

  // Sync time selection when date changes in the Add Modal
  useEffect(() => {
    if (availableSlots.length > 0 && !newTime) {
      setNewTime(availableSlots[0]);
    }
  }, [newDate, availableSlots]);

  const handleOpenAddModal = () => {
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewDesc('');
    setIsAddModalOpen(true);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime) {
      alert("Por favor, selecione ou informe um horário.");
      return;
    }

    const service: ChurchService = {
      id: Math.random().toString(36).substr(2, 9),
      date: newDate,
      time: newTime,
      dayOfWeek: selectedDayName,
      isOpen: true,
      description: newDesc
    };

    setServices(prev => [...prev, service]);
    setIsAddModalOpen(false);
    setNewTime('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const d = new Date(editingService.date + 'T12:00:00');
    const updatedService = {
      ...editingService,
      dayOfWeek: DAY_NAMES[d.getDay()]
    };

    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
    setEditingService(null);
  };

  const handleDeleteService = (id: string) => {
    const serviceToDelete = services.find(s => s.id === id);
    if (!serviceToDelete) return;

    const msg = `ATENÇÃO: Você está excluindo o culto de ${formatDate(serviceToDelete.date)} às ${serviceToDelete.time}.\n\nEsta ação removerá permanentemente o culto e todas as inscrições.\n\nDeseja continuar?`;
    
    if (window.confirm(msg)) {
      // 1. Fechar modal se estiver aberto
      if (editingService?.id === id) {
        setEditingService(null);
      }
      
      // 2. Remover o culto do estado
      setServices(prev => prev.filter(s => s.id !== id));
      
      // 3. Remover as inscrições vinculadas
      setAssignments(prev => prev.filter(a => a.serviceId !== id));
    }
  };

  const handleUpdateAssignment = (assignmentId: string, updates: Partial<Assignment>) => {
    setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, ...updates } : a));
  };

  const handleToggleStatus = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isOpen: !s.isOpen } : s));
  };

  const handleRegister = (serviceId: string, area: ServiceArea) => {
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
    if (window.confirm("Deseja remover esta inscrição?")) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    }
  };

  const exportCSV = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    const relevant = assignments.filter(a => a.serviceId === serviceId);
    const rows = [
      ["Area", "Servo", "Data", "Hora"],
      ...relevant.map(a => [a.area, a.userName, service?.date || "", service?.time || ""])
    ];
    downloadCSV(`escala_${service?.date}.csv`, rows);
  };

  // Ordenação segura sem mutação direta do estado
  const sortedServices = [...services].sort((a, b) => {
    const dateComp = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateComp !== 0) return dateComp;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Users className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Escala<span className="text-blue-600">Igreja</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">{user.role}</p>
            </div>
            <img src={user.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full border shadow-sm" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Admin Section */}
        {user.role === 'ADMIN' && (
          <section className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  Painel Administrativo
                </h2>
                <p className="text-blue-700 text-sm">Gerencie os cultos e exporte as escalas.</p>
              </div>
              <button 
                onClick={handleOpenAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Novo Culto
              </button>
            </div>
          </section>
        )}

        {/* Services List */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Calendar className="text-slate-400" /> Próximos Cultos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedServices.map(service => {
              const serviceAssignments = assignments.filter(a => a.serviceId === service.id);
              const userInThisService = serviceAssignments.find(a => a.userId === user.id);

              return (
                <div key={service.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                        <span>{service.dayOfWeek}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {service.time}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">{formatDate(service.date)}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {user.role === 'ADMIN' && (
                        <>
                          <button 
                            onClick={() => setEditingService(service)}
                            title="Editar Culto"
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-lg border border-transparent hover:border-blue-100"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteService(service.id);
                            }}
                            title="Excluir Culto"
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-lg border border-transparent hover:border-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <span className={`ml-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${service.isOpen ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {service.isOpen ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                      {service.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Equipe confirmada:</p>
                    <div className="flex flex-wrap gap-2">
                      {serviceAssignments.length > 0 ? (
                        serviceAssignments.map(a => (
                          <div key={a.id} className="group relative bg-slate-100 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border border-slate-200">
                            <span className="font-medium">{a.userName}</span>
                            <span className="text-slate-500 italic">({a.area})</span>
                            {user.role === 'ADMIN' && (
                              <button 
                                onClick={() => handleRemoveAssignment(a.id)}
                                className="text-red-400 hover:text-red-600 ml-1 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400 italic">Ninguém inscrito ainda</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t space-y-3">
                    {service.isOpen ? (
                      userInThisService ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl border border-green-100 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Você está na escala: {userInThisService.area}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <select 
                            id={`area-select-${service.id}`}
                            className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>Escolha sua área...</option>
                            {SERVICE_AREAS.map(area => (
                              <option key={area} value={area}>{area}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              const select = document.getElementById(`area-select-${service.id}`) as HTMLSelectElement;
                              if (select.value) handleRegister(service.id, select.value as ServiceArea);
                            }}
                            className="col-span-2 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                          >
                            Inscrever-se na Escala
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-sm italic">
                        <Lock className="w-4 h-4" /> Escala Encerrada
                      </div>
                    )}

                    {user.role === 'ADMIN' && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button 
                          onClick={() => handleToggleStatus(service.id)}
                          className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1"
                        >
                          {service.isOpen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {service.isOpen ? 'Fechar' : 'Abrir'}
                        </button>
                        <button 
                          onClick={() => exportCSV(service.id)}
                          className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" /> CSV
                        </button>
                        <a 
                          href={`https://wa.me/?text=${generateWhatsAppText(`${formatDate(service.date)} (${service.time})`, serviceAssignments)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" /> Zap
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

      {/* New Service Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-blue-600 w-5 h-5" /> Novo Culto
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddService} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">1. Data do Culto</label>
                <input 
                  type="date" 
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
                <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
                  Dia: {selectedDayName}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">2. Horário</label>
                
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setNewTime(time)}
                        className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                          newTime === time 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <Clock className="w-4 h-4" /> {time}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const t = prompt("Informe o horário (ex: 19:00):");
                        if (t) setNewTime(t);
                      }}
                      className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                        newTime && !availableSlots.includes(newTime)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-400 border-slate-200 border-dashed'
                      }`}
                    >
                      {newTime && !availableSlots.includes(newTime) ? newTime : '+ Outro'}
                    </button>
                  </div>
                ) : (
                  <input 
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">3. Descrição (opcional)</label>
                <input 
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Culto de Jovens, Santa Ceia..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  Criar Culto <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingService(null)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50/30">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Pencil className="text-blue-600 w-5 h-5" /> Editar Culto
              </h3>
              <button onClick={() => setEditingService(null)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                    <input 
                      type="date" 
                      required
                      value={editingService.date}
                      onChange={(e) => setEditingService({...editingService, date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Hora</label>
                    <input 
                      type="time" 
                      required
                      value={editingService.time}
                      onChange={(e) => setEditingService({...editingService, time: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                  <input 
                    type="text"
                    value={editingService.description || ''}
                    onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Ajustar Equipe</h4>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                      {assignments.filter(a => a.serviceId === editingService.id).length} Inscritos
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {assignments.filter(a => a.serviceId === editingService.id).map(a => (
                      <div key={a.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 group shadow-sm">
                        <div className="flex-1 min-w-0">
                          <input 
                            type="text"
                            value={a.userName}
                            onChange={(e) => handleUpdateAssignment(a.id, { userName: e.target.value })}
                            className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full"
                          />
                          <select 
                            value={a.area}
                            onChange={(e) => handleUpdateAssignment(a.id, { area: e.target.value as ServiceArea })}
                            className="text-[10px] text-slate-500 bg-transparent outline-none mt-1 w-full font-medium"
                          >
                            {SERVICE_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                          </select>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveAssignment(a.id)}
                          className="p-2 text-red-300 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {assignments.filter(a => a.serviceId === editingService.id).length === 0 && (
                      <p className="text-center py-4 text-slate-400 text-xs italic">Sem inscrições ainda.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingService(null)} className="flex-1 py-3 font-bold text-slate-500">Cancelar</button>
                  <button type="submit" className="flex-2 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Save className="w-4 h-4" /> Salvar Alterações
                  </button>
                </div>
              </form>

              {/* Danger Zone in Edit Modal */}
              <div className="pt-6 border-t border-red-100 mt-6">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Zona Crítica
                </p>
                <button 
                  type="button"
                  onClick={() => handleDeleteService(editingService.id)}
                  className="w-full py-3 border border-red-200 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Excluir este Culto Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2023 Igreja Local - Gestão de Escalas</p>
        </div>
      </footer>
    </div>
  );
}
