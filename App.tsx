
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import { ChurchService, Assignment, User, ServiceArea, ServiceDay } from './types';
import { SERVICE_AREAS } from './constants';
import { formatDate, generateWhatsAppText, maskPhoneBR, downloadCSV, getCroppedImg } from './lib/utils';
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
  Church,
  Camera,
  Upload,
  UserPlus,
  UserCircle,
  Scissors,
  Loader2,
  Palette
} from 'lucide-react';

const DAY_NAMES: ServiceDay[] = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
];

type View = 'HOME' | 'ADMIN' | 'MANAGE_SERVOS' | 'MANAGE_GLOBAL_AREAS' | 'MANAGE_CHURCH';

interface ChurchSettings {
  name: string;
  logo: string | null;
  primaryColor: string;
}

// Helper to convert hex to RGB for CSS variables (to support opacities)
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '37, 99, 235'; // Default blue-600
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('HOME');
  const [services, setServices] = useState<ChurchService[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [volunteers, setVolunteers] = useState<User[]>([]);
  const [globalAreas, setGlobalAreas] = useState<string[]>([]);
  const [churchSettings, setChurchSettings] = useState<ChurchSettings>({
    name: 'Escala Igreja',
    logo: null,
    primaryColor: '#2563eb' // Default Blue
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userAvatarRef = useRef<HTMLInputElement>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddVolunteerModalOpen, setIsAddVolunteerModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Login and Processing state
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [croppingTarget, setCroppingTarget] = useState<'AVATAR' | 'LOGO' | null>(null);

  const [editingService, setEditingService] = useState<ChurchService | null>(null);
  const [editingAreasService, setEditingAreasService] = useState<ChurchService | null>(null);
  const [editingGlobalAreaIndex, setEditingGlobalAreaIndex] = useState<number | null>(null);
  const [editingGlobalAreaValue, setEditingGlobalAreaValue] = useState('');
  
  const [newAreaInput, setNewAreaInput] = useState('');
  const [newGlobalAreaInput, setNewGlobalAreaInput] = useState('');
  
  const [newVolName, setNewVolName] = useState('');
  const [newVolPhone, setNewVolPhone] = useState('');
  const [newVolRole, setNewVolRole] = useState<'SERVO' | 'ADMIN'>('SERVO');

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

  // Dynamic Theme Generation
  const themeStyles = useMemo(() => {
    const rgb = hexToRgb(churchSettings.primaryColor);
    return `
      :root {
        --brand-color: ${churchSettings.primaryColor};
        --brand-color-rgb: ${rgb};
      }
      .bg-brand { background-color: var(--brand-color); }
      .bg-brand-50 { background-color: rgba(var(--brand-color-rgb), 0.05); }
      .bg-brand-10 { background-color: rgba(var(--brand-color-rgb), 0.1); }
      .bg-brand-20 { background-color: rgba(var(--brand-color-rgb), 0.2); }
      .text-brand { color: var(--brand-color); }
      .text-brand-muted { color: rgba(var(--brand-color-rgb), 0.7); }
      .border-brand { border-color: var(--brand-color); }
      .border-brand-20 { border-color: rgba(var(--brand-color-rgb), 0.2); }
      .ring-brand { --tw-ring-color: var(--brand-color); }
      .accent-brand { accent-color: var(--brand-color); }
      
      /* Active/Hover states simulation for dynamic colors */
      .hover-brand:hover { filter: brightness(1.1); }
      .active-brand:active { filter: brightness(0.9); transform: scale(0.98); }
    `;
  }, [churchSettings.primaryColor]);

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
    if (savedVolunteers) {
      setVolunteers(JSON.parse(savedVolunteers));
    } else {
      setVolunteers([{ id: 'v1', name: 'Lucas Silva', whatsapp: '(11) 99999-9999', role: 'ADMIN' }]);
    }

    const savedGlobalAreas = localStorage.getItem('escala_global_areas');
    if (savedGlobalAreas) {
      setGlobalAreas(JSON.parse(savedGlobalAreas));
    } else {
      setGlobalAreas([...SERVICE_AREAS]);
    }

    const savedChurch = localStorage.getItem('escala_church_settings');
    if (savedChurch) setChurchSettings(JSON.parse(savedChurch));
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

  useEffect(() => {
    localStorage.setItem('escala_church_settings', JSON.stringify(churchSettings));
  }, [churchSettings]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = loginPhone.replace(/\D/g, "");
    if (!loginName.trim()) { alert("Por favor, preencha seu nome."); return; }
    if (cleanPhone.length < 10) { alert("Por favor, preencha um número de WhatsApp válido com DDD."); return; }

    setIsLoggingIn(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const existingVol = volunteers.find(v => v.whatsapp === loginPhone);
    const role = existingVol ? existingVol.role : (loginName.toLowerCase().includes('admin') || cleanPhone === '000') ? 'ADMIN' : 'SERVO';
    
    const newUser: User = {
      id: existingVol?.id || Math.random().toString(36).substr(2, 9),
      name: loginName,
      whatsapp: loginPhone, 
      role: role,
      avatar_url: existingVol?.avatar_url
    };

    setUser(newUser);
    localStorage.setItem('escala_user', JSON.stringify(newUser));

    setVolunteers(prev => {
      const exists = prev.find(v => v.whatsapp === newUser.whatsapp);
      if (exists) return prev.map(v => v.whatsapp === newUser.whatsapp ? { ...v, name: newUser.name } : v);
      return [...prev, newUser];
    });

    setIsLoggingIn(false);
    showToast(`Bem-vindo, ${loginName.split(' ')[0]}!`);
  };

  const handleLogout = () => {
    if (confirm("Deseja sair da sua conta?")) {
      setUser(null);
      localStorage.removeItem('escala_user');
      setCurrentView('HOME');
    }
  };

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter menos de 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingTarget('AVATAR');
        setImageToCrop(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("O logo deve ter menos de 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingTarget('LOGO');
        setImageToCrop(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedImage) {
        if (croppingTarget === 'AVATAR' && user) {
          const updatedUser = { ...user, avatar_url: croppedImage };
          setUser(updatedUser);
          localStorage.setItem('escala_user', JSON.stringify(updatedUser));
          setVolunteers(prev => prev.map(v => v.id === user.id ? updatedUser : v));
          showToast("Avatar ajustado com sucesso!");
        } else if (croppingTarget === 'LOGO') {
          setChurchSettings(prev => ({ ...prev, logo: croppedImage }));
          showToast("Logo ajustado com sucesso!");
        }
        
        setIsCropping(false);
        setImageToCrop(null);
        setCroppingTarget(null);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao processar imagem.");
    }
  };

  const handleUpdateOwnProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    localStorage.setItem('escala_user', JSON.stringify(user));
    setVolunteers(prev => prev.map(v => v.id === user.id ? user : v));
    setAssignments(prev => prev.map(a => a.userId === user.id ? { ...a, userName: user.name } : a));
    setIsProfileModalOpen(false);
    showToast("Perfil atualizado!");
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

  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName.trim()) return;
    if (newVolPhone.replace(/\D/g, '').length < 10) {
      alert("WhatsApp inválido.");
      return;
    }
    const exists = volunteers.find(v => v.whatsapp === newVolPhone);
    if (exists) {
      alert("Este número de WhatsApp já está cadastrado.");
      return;
    }
    const newVol: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newVolName,
      whatsapp: newVolPhone,
      role: newVolRole
    };
    setVolunteers(prev => [...prev, newVol]);
    setIsAddVolunteerModalOpen(false);
    setNewVolName('');
    setNewVolPhone('');
    setNewVolRole('SERVO');
    showToast("Novo servo cadastrado!");
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

  const handleAddGlobalArea = () => {
    const val = newGlobalAreaInput.trim();
    if (!val) return;
    if (globalAreas.includes(val)) {
      alert("Área já existe.");
      return;
    }
    setGlobalAreas(prev => [...prev, val]);
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
    const updatedGlobal = [...globalAreas];
    updatedGlobal[index] = newName;
    setGlobalAreas(updatedGlobal);
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
    setGlobalAreas(prev => prev.filter(a => a !== name));
    setServices(prev => prev.map(s => {
      if (s.isOpen && s.areas) {
        return { ...s, areas: s.areas.filter(a => a !== name) };
      }
      return s;
    }));
    setAssignments(prev => prev.filter(a => {
      const s = services.find(srv => srv.id === a.serviceId);
      return !(s?.isOpen && a.area === name);
    }));
    showToast("Vaga removida globalmente.");
  };

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

  const handleRegister = (serviceId: string, area: string) => {
    if (!user) return;
    const newAssignment: Assignment = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId,
      userId: user.id,
      userName: user.name,
      area
    };
    setAssignments(prev => [...prev, newAssignment]);
    showToast("Você foi escalado com sucesso!");
  };

  const handleRemoveAssignment = (id: string) => {
    if (window.confirm("Deseja remover esta inscrição?")) {
      setAssignments(prev => prev.filter(a => a.id !== id));
      showToast("Inscrição removida.", "info");
    }
  };

  const handleToggleStatus = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isOpen: !s.isOpen } : s));
    showToast("Status do culto alterado.");
  };

  const handleExportCSV = (serviceId?: string) => {
    const headers = serviceId 
      ? ["Data do Culto", "Área", "Nome do Servo", "WhatsApp"]
      : ["Data", "Dia", "Horário", "Descrição", "Área", "Servo", "WhatsApp"];
    const rows = [headers];
    const filteredServices = serviceId ? services.filter(s => s.id === serviceId) : services;
    filteredServices.forEach(s => {
      const serviceAssignments = assignments.filter(a => a.serviceId === s.id);
      if (serviceAssignments.length > 0) {
        serviceAssignments.forEach(a => {
          const v = volunteers.find(vol => vol.id === a.userId);
          const whatsapp = v ? v.whatsapp : "Não informado";
          if (serviceId) {
            rows.push([formatDate(s.date), a.area, a.userName, whatsapp]);
          } else {
            rows.push([formatDate(s.date), s.dayOfWeek, s.time, s.description || "", a.area, a.userName, whatsapp]);
          }
        });
      } else if (!serviceId) {
        rows.push([formatDate(s.date), s.dayOfWeek, s.time, s.description || "", "-", "-", "-"]);
      }
    });
    const filename = serviceId ? `escala-${filteredServices[0]?.date || 'culto'}.csv` : `relatorio-escalas-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filename, rows);
    showToast("CSV baixado com sucesso!");
  };

  const sortedServices = [...services].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalSlots = services.reduce((acc, s) => acc + (s.areas?.length || globalAreas.length), 0);
  const filledSlots = assignments.length;
  const uniqueVolunteersCount = Array.from(new Set(assignments.map(a => a.userName))).length;
  const volunteerRanking = Array.from(new Map<string, { name: string; count: number; userId: string }>(assignments.map(a => [a.userName, { name: a.userName, count: assignments.filter(x => x.userName === a.userName).length, userId: a.userId }])).values()).sort((a, b) => b.count - a.count);
  const filteredVolunteers = volunteers.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.whatsapp.includes(searchTerm));

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <style>{themeStyles}</style>
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-brand p-10 text-center text-white">
            <div className="bg-white/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20 overflow-hidden">
              {churchSettings.logo ? (
                <img src={churchSettings.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-12 h-12" />
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase leading-tight">{churchSettings.name}</h1>
            <p className="text-white/80 text-xs mt-3 font-bold uppercase tracking-widest opacity-80">Gestão de Escalas</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2 px-1">
                <UserIcon className="w-3.5 h-3.5" /> Seu Nome Completo *
              </label>
              <input 
                type="text" required placeholder="Ex: João Silva" 
                value={loginName} 
                onChange={e => setLoginName(e.target.value)} 
                disabled={isLoggingIn}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-zinc-600 disabled:opacity-50" 
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
                disabled={isLoggingIn}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-zinc-600 disabled:opacity-50" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-brand text-white py-4 rounded-xl font-black text-lg shadow-lg hover-brand active-brand transition-all flex items-center justify-center gap-2 uppercase min-h-[60px]"
            >
              {isLoggingIn ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <>Acessar Painel <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
            <p className="text-[10px] text-center text-zinc-600 uppercase tracking-widest font-black">Identificação obrigatória</p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 pb-28 md:pb-20">
      <style>{themeStyles}</style>
      <header className="bg-zinc-900/50 backdrop-blur-lg border-b border-zinc-800 sticky top-0 z-40 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand w-10 h-10 rounded-xl text-white shadow-lg overflow-hidden flex items-center justify-center">
            {churchSettings.logo ? (
              <img src={churchSettings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Users className="w-6 h-6" />
            )}
          </div>
          <h1 className="font-black text-lg md:text-xl tracking-tighter uppercase truncate max-w-[150px] md:max-w-xs">{churchSettings.name}</h1>
        </div>
        {user.role === 'ADMIN' && (
          <nav className="hidden xl:flex bg-zinc-800/50 border border-zinc-700 p-1 rounded-2xl gap-1">
            {[{ id: 'HOME', icon: ClipboardList, label: 'Escalas' }, { id: 'ADMIN', icon: LayoutDashboard, label: 'Painel' }, { id: 'MANAGE_SERVOS', icon: Users, label: 'Servos' }, { id: 'MANAGE_GLOBAL_AREAS', icon: Layers, label: 'Vagas' }, { id: 'MANAGE_CHURCH', icon: Church, label: 'Igreja' }].map(item => (
              <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${currentView === item.id ? 'bg-brand text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-4">
          <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-all py-1.5 pl-1.5 pr-4 rounded-2xl group">
            <div className="w-8 h-8 rounded-xl bg-zinc-700 border border-zinc-600 overflow-hidden flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-zinc-500 group-hover:text-brand transition-colors" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[11px] font-bold leading-none text-white">{user.name.split(' ')[0]}</p>
              <p className="text-[9px] text-brand uppercase tracking-widest font-black mt-0.5">{user.role}</p>
            </div>
          </button>
          <button onClick={handleLogout} className="p-2.5 text-zinc-500 hover:text-red-500 bg-zinc-800 border border-zinc-700 rounded-xl transition-all hover:bg-zinc-700">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {user.role === 'ADMIN' && (
        <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-800 p-1.5 rounded-3xl shadow-2xl flex w-[94%] max-w-md backdrop-blur-xl overflow-x-auto no-scrollbar">
          {[{ id: 'HOME', icon: ClipboardList, label: 'Escalas' }, { id: 'ADMIN', icon: LayoutDashboard, label: 'Painel' }, { id: 'MANAGE_SERVOS', icon: Users, label: 'Servos' }, { id: 'MANAGE_GLOBAL_AREAS', icon: Layers, label: 'Vagas' }, { id: 'MANAGE_CHURCH', icon: Church, label: 'Igreja' }].map(item => (
            <button key={item.id} onClick={() => setCurrentView(item.id as View)} className={`flex-1 min-w-[65px] flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all ${currentView === item.id ? 'bg-brand text-white' : 'text-zinc-500'}`}>
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-6 md:py-10">
        {currentView === 'HOME' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
            <section>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black flex items-center gap-3 text-white tracking-tight">
                  <Calendar className="text-brand w-8 h-8" /> Próximas Escalas
                </h2>
                {user.role === 'ADMIN' && (
                   <button onClick={() => setIsAddModalOpen(true)} className="bg-brand text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover-brand active-brand transition-all">
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
                            <span className="bg-brand-10 text-brand text-[10px] font-black uppercase px-2 py-1 rounded-md border border-brand-20">{service.dayOfWeek}</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{service.time}</span>
                          </div>
                          <h3 className="text-2xl font-black text-white">{formatDate(service.date)}</h3>
                        </div>
                        {user.role === 'ADMIN' && (
                          <div className="flex gap-2">
                            <button onClick={() => setEditingService(service)} className="p-2 text-zinc-400 hover:text-brand bg-zinc-800 rounded-xl border border-zinc-700 transition-all"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteService(service.id)} className="p-2 text-zinc-400 hover:text-red-500 bg-zinc-800 rounded-xl border border-zinc-700 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                      {service.description && (
                        <div className="bg-zinc-800/50 p-3 rounded-2xl text-xs text-zinc-300 font-medium border border-zinc-700/50 flex items-center gap-2">
                          <Info className="w-4 h-4 text-brand shrink-0" /> {service.description}
                        </div>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3 h-3" /> Servos Escalados ({currentAssignments.length}/{currentAreas.length})
                          </p>
                          {user.role === 'ADMIN' && (
                            <button onClick={() => setEditingAreasService(service)} className="text-[10px] font-black text-brand hover:underline uppercase flex items-center gap-1">
                              <Layers className="w-3 h-3" /> Gerenciar Vagas
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {currentAssignments.length > 0 ? (
                            currentAssignments.map(a => {
                              const assignedVol = volunteers.find(v => v.id === a.userId);
                              return (
                                <div key={a.id} className="bg-zinc-800 px-4 py-3 rounded-2xl text-sm border border-zinc-700 flex items-center justify-between group/item">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-700 overflow-hidden flex items-center justify-center">
                                      {assignedVol?.avatar_url ? (
                                        <img src={assignedVol.avatar_url} alt={a.userName} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{a.userName.charAt(0)}</span>
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-brand uppercase">{a.area}</span>
                                      <span className="text-white font-bold">{a.userName}</span>
                                    </div>
                                  </div>
                                  {(user.role === 'ADMIN' || a.userId === user.id) && (
                                    <button onClick={() => handleRemoveAssignment(a.id)} className="text-zinc-600 hover:text-red-500 transition-all"><X className="w-4 h-4" /></button>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs italic text-zinc-600 text-center py-4 bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-800">Ninguém escalado.</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col gap-4">
                        {service.isOpen ? (
                          userInThis ? (
                            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl border border-emerald-500/20 text-sm font-bold flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6" /> 
                              <div><p className="leading-tight">Você está na escala!</p><p className="text-[10px] font-medium opacity-70">Área: {userInThis.area}</p></div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <select id={`area-${service.id}`} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-brand transition-all appearance-none cursor-pointer">
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
                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setEditingService(service)} className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all text-brand" title="Editar Culto"><Settings2 className="w-4 h-4"/></button>
                            <button onClick={() => handleExportCSV(service.id)} className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all text-zinc-100" title="Exportar CSV do Culto"><Download className="w-4 h-4" /></button>
                            <a href={`https://wa.me/?text=${generateWhatsAppText(`${formatDate(service.date)}`, currentAssignments)}`} target="_blank" rel="noreferrer" className="bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all" title="Compartilhar no WhatsApp"><MessageCircle className="w-4 h-4" /></a>
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
              {[{ label: 'Total de Cultos', value: services.length, icon: Calendar, color: 'text-brand', bg: 'bg-brand-10' }, { label: 'Vagas Preenchidas', value: filledSlots, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }, { label: 'Vagas Totais', value: totalSlots, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' }, { label: 'Voluntários Ativos', value: uniqueVolunteersCount, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' }].map((stat, i) => (
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
                  <h3 className="text-xl font-black text-white flex items-center gap-2"><UserCheck className="text-brand w-5 h-5" /> Ranking</h3>
                  <button onClick={() => setCurrentView('MANAGE_SERVOS')} className="text-[10px] font-black text-brand hover:underline uppercase tracking-widest">Ver Todos</button>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg">
                  <div className="divide-y divide-zinc-800">
                    {volunteerRanking.length > 0 ? volunteerRanking.slice(0, 5).map((vol, i) => {
                      const rankVol = volunteers.find(v => v.id === vol.userId);
                      return (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
                              {rankVol?.avatar_url ? (
                                <img src={rankVol.avatar_url} alt={vol.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-zinc-500">#{i+1}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{vol.name}</p>
                              <p className="text-[10px] text-zinc-500 font-medium">{vol.count} cultos</p>
                            </div>
                          </div>
                          <button onClick={() => setViewingVolunteerHistory(vol.name)} className="p-2 text-zinc-500 hover:text-brand transition-colors"><History className="w-4 h-4" /></button>
                        </div>
                      );
                    }) : <p className="p-10 text-center text-xs text-zinc-600 italic">Nenhum voluntário ainda.</p>}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-white flex items-center gap-2"><ClipboardList className="text-brand w-5 h-5" /> Relatório Geral</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 bg-brand text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 hover-brand shadow-lg"><Plus className="w-4 h-4" /> NOVO CULTO</button>
                    <button onClick={() => handleExportCSV()} className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 hover-brand shadow-lg"><Download className="w-4 h-4" /> CSV</button>
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
                              <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${s.isOpen ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{s.isOpen ? 'Aberto' : 'Fechado'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden max-w-[80px]">
                                <div className="bg-brand h-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1">{count}/{maxAreas}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => handleExportCSV(s.id)} className="p-2 text-zinc-500 hover:text-white" title="Exportar CSV do Culto"><Download className="w-4 h-4" /></button>
                                <button onClick={() => setEditingAreasService(s)} className="p-2 text-zinc-500 hover:text-brand" title="Gerenciar Áreas"><Layers className="w-4 h-4" /></button>
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
                  <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Users className="text-brand w-7 h-7" /> Gestão de Servos</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="text" placeholder="Buscar por nome ou WhatsApp..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-brand transition-all placeholder:text-zinc-600" />
                  </div>
                  {user.role === 'ADMIN' && (
                    <button onClick={() => setIsAddVolunteerModalOpen(true)} className="bg-brand text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover-brand active-brand transition-all uppercase shrink-0"><UserPlus className="w-5 h-5" /> Novo Servo</button>
                  )}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVolunteers.map(vol => {
                  const count = assignments.filter(a => a.userId === vol.id).length;
                  return (
                    <div key={vol.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl hover:border-zinc-700 transition-all flex flex-col gap-4 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-brand-10 text-brand flex items-center justify-center border border-brand-20 overflow-hidden">
                            {vol.avatar_url ? (
                              <img src={vol.avatar_url} alt={vol.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-xl uppercase">{vol.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white leading-tight">{vol.name}</p>
                              {user.role === 'ADMIN' && (
                                <button onClick={() => setEditingVolunteer(vol)} className="p-1.5 text-zinc-500 hover:text-amber-500 bg-zinc-800/50 rounded-lg border border-zinc-700/50 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-0.5">{vol.role}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-800/50 p-3 rounded-2xl border border-zinc-800">
                          <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">WhatsApp</p>
                          <a href={`https://wa.me/${vol.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-white flex items-center gap-1.5 hover:text-green-500 transition-colors"><Phone className="w-3 h-3" /> {vol.whatsapp}</a>
                        </div>
                        <div className="bg-zinc-800/50 p-3 rounded-2xl border border-zinc-800">
                          <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Participação</p>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5"><CheckCircle2 className={`w-3 h-3 ${count > 0 ? 'text-emerald-500' : 'text-zinc-600'}`} /> {count} cultos</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <button onClick={() => setViewingVolunteerHistory(vol.name)} className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 border border-zinc-700 hover:border-brand rounded-2xl transition-all"><History className="w-5 h-5 text-brand mb-1" /><span className="text-[9px] font-black text-zinc-400 uppercase">Histórico</span></button>
                        <a href={`https://wa.me/${vol.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 border border-zinc-700 hover:border-green-500 rounded-2xl transition-all"><MessageSquare className="w-5 h-5 text-green-500 mb-1" /><span className="text-[9px] font-black text-zinc-400 uppercase">Conversar</span></a>
                        {user.role === 'ADMIN' && (
                          <button onClick={() => handleDeleteVolunteer(vol.id)} className="flex flex-col items-center justify-center p-3 bg-zinc-800/50 border border-zinc-700 hover:border-red-500 rounded-2xl transition-all"><UserMinus className="w-5 h-5 text-red-500 mb-1" /><span className="text-[9px] font-black text-zinc-400 uppercase">Remover</span></button>
                        )}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        ) : currentView === 'MANAGE_GLOBAL_AREAS' ? (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentView('ADMIN')} className="bg-zinc-800 p-2.5 rounded-xl text-zinc-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                  <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Layers className="text-brand w-7 h-7" /> Áreas Globais</h2>
                </div>
             </div>
             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">
                <div className="space-y-3"><p className="text-zinc-400 text-sm leading-relaxed">As áreas definidas aqui aparecerão por padrão em todos os <b>novos cultos</b> criados. Qualquer adição ou renomeação feita aqui será aplicada automaticamente em todos os cultos com status <b>Aberto</b>.</p></div>
                <div className="flex gap-3">
                  <input type="text" placeholder="Nova área global (Ex: Som, Mídia)" value={newGlobalAreaInput} onChange={e => setNewGlobalAreaInput(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm" onKeyDown={e => e.key === 'Enter' && handleAddGlobalArea()} />
                  <button onClick={handleAddGlobalArea} className="bg-brand text-white p-4 rounded-2xl hover-brand active-brand transition-all shadow-lg shrink-0"><Plus className="w-6 h-6" /></button>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Vagas Padrão da Igreja</p>
                  <div className="grid gap-3">
                    {globalAreas.map((area, idx) => (
                      <div key={idx} className="bg-zinc-800 border border-zinc-700 px-6 py-5 rounded-3xl flex items-center justify-between group transition-all hover:border-zinc-600">
                        {editingGlobalAreaIndex === idx ? (
                          <div className="flex-1 flex gap-2">
                             <input autoFocus type="text" value={editingGlobalAreaValue} onChange={e => setEditingGlobalAreaValue(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand text-sm" />
                            <button onClick={() => handleUpdateGlobalArea(idx)} className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700"><Save className="w-4 h-4" /></button>
                            <button onClick={() => setEditingGlobalAreaIndex(null)} className="bg-zinc-700 text-zinc-300 p-2 rounded-xl hover:bg-zinc-600"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4"><div className="w-1.5 h-8 bg-brand rounded-full" /><span className="font-bold text-white">{area}</span></div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingGlobalAreaIndex(idx); setEditingGlobalAreaValue(area); }} className="p-2.5 text-zinc-500 hover:text-amber-500 hover:bg-zinc-700/50 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => handleRemoveGlobalArea(area)} className="p-2.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-700/50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
             <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setCurrentView('ADMIN')} className="bg-zinc-800 p-2.5 rounded-xl text-zinc-400 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"><Church className="text-brand w-7 h-7" /> Dados da Igreja</h2>
             </div>
             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Church className="w-40 h-40" /></div>
                <div className="space-y-8 relative z-10">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-32 h-32 rounded-3xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-brand transition-all relative" onClick={() => fileInputRef.current?.click()}>
                      {churchSettings.logo ? ( <img src={churchSettings.logo} alt="Church Logo" className="w-full h-full object-cover" /> ) : ( <Camera className="w-10 h-10 text-zinc-600 group-hover:text-brand" /> )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload className="w-6 h-6 text-white" /></div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    <div className="text-center"><p className="text-sm font-black text-white uppercase tracking-widest">Logo da Igreja</p><p className="text-[10px] text-zinc-500 uppercase mt-1">PNG ou JPG (Máx 2MB)</p></div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Nome da Igreja</label>
                      <input type="text" value={churchSettings.name} onChange={e => setChurchSettings(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Igreja Metodista Central" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-brand transition-all font-bold" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1 mb-2">
                        <Palette className="w-3.5 h-3.5 text-zinc-500" />
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cor Principal do Aplicativo</label>
                      </div>
                      <div className="flex flex-wrap gap-3 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
                        {['#2563eb', '#7c3aed', '#059669', '#e11d48', '#d97706', '#0891b2', '#4b5563'].map(color => (
                          <button
                            key={color}
                            onClick={() => setChurchSettings(prev => ({ ...prev, primaryColor: color }))}
                            className={`w-10 h-10 rounded-xl border-2 transition-all ${churchSettings.primaryColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Personalizada</span>
                          <input 
                            type="color" 
                            value={churchSettings.primaryColor} 
                            onChange={e => setChurchSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-10 h-10 bg-transparent rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4"><button onClick={() => { showToast("Dados da igreja atualizados!"); setCurrentView('ADMIN'); }} className="w-full bg-brand text-white py-5 rounded-2xl font-black text-lg shadow-xl hover-brand active-brand transition-all uppercase">Salvar Configurações</button></div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* MODAL: MEU PERFIL (SERVO) */}
      {isProfileModalOpen && user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsProfileModalOpen(false)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-brand-10 p-2.5 rounded-xl text-brand"><UserCircle className="w-6 h-6" /></div>
                <h3 className="font-black text-xl text-white tracking-tight uppercase">MEU PERFIL</h3>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <form onSubmit={handleUpdateOwnProfile} className="p-6 md:p-8 space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-3xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer group hover:border-brand transition-all relative" onClick={() => userAvatarRef.current?.click()}>
                  {user.avatar_url ? ( <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> ) : ( <Camera className="w-8 h-8 text-zinc-600 group-hover:text-brand" /> )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload className="w-5 h-5 text-white" /></div>
                </div>
                <input type="file" ref={userAvatarRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Clique para alterar avatar</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">NOME COMPLETO</label><input type="text" required value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm font-bold" /></div>
                <div className="space-y-2 opacity-60"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">WHATSAPP (INALTERÁVEL)</label><input type="text" disabled value={user.whatsapp} className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-400 rounded-2xl px-5 py-4 text-sm cursor-not-allowed" /></div>
              </div>
              <button type="submit" className="w-full bg-brand text-white py-5 rounded-2xl font-black text-lg shadow-xl hover-brand active-brand transition-all uppercase">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CROP (AJUSTE DE AVATAR OU LOGO) */}
      {isCropping && imageToCrop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col h-[80vh] md:h-auto">
             <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Scissors className="text-brand w-6 h-6" />
                  <h3 className="font-black text-xl text-white uppercase tracking-tight">AJUSTAR {croppingTarget === 'LOGO' ? 'LOGO' : 'FOTO'}</h3>
                </div>
                <button onClick={() => { setIsCropping(false); setImageToCrop(null); setCroppingTarget(null); }} className="p-2 hover:bg-zinc-800 rounded-xl"><X className="w-6 h-6 text-zinc-500" /></button>
             </div>
             
             <div className="relative flex-1 min-h-[300px] bg-black md:aspect-square">
               <Cropper
                 image={imageToCrop}
                 crop={crop}
                 zoom={zoom}
                 aspect={1}
                 onCropChange={setCrop}
                 onCropComplete={onCropComplete}
                 onZoomChange={setZoom}
                 cropShape="rect"
                 showGrid={true}
               />
             </div>

             <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">ZOOM / TAMANHO</label><span className="text-[10px] font-bold text-zinc-400">{Math.round(zoom * 100)}%</span></div>
                  <input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand" />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { setIsCropping(false); setImageToCrop(null); setCroppingTarget(null); }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-4 rounded-2xl font-bold transition-all uppercase text-xs">CANCELAR</button>
                  <button onClick={confirmCrop} className="flex-1 bg-brand hover-brand active-brand text-white py-4 rounded-2xl font-black shadow-xl uppercase text-xs flex items-center justify-center gap-2"><Scissors className="w-4 h-4" /> CORTAR E SALVAR</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* OS OUTROS MODAIS PERMANECEM IGUAIS... */}
      {/* CADASTRO SERVO */}
      {isAddVolunteerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddVolunteerModalOpen(false)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3"><div className="bg-brand-10 p-2.5 rounded-xl text-brand"><UserPlus className="w-6 h-6" /></div><h3 className="font-black text-xl text-white tracking-tight uppercase">CADASTRAR SERVO</h3></div>
              <button onClick={() => setIsAddVolunteerModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <form onSubmit={handleAddVolunteer} className="p-6 md:p-8 space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">NOME COMPLETO</label><input type="text" required placeholder="Ex: Maria Oliveira" value={newVolName} onChange={e => setNewVolName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">WHATSAPP</label><input type="tel" required placeholder="(00) 00000-0000" value={newVolPhone} onChange={e => setNewVolPhone(maskPhoneBR(e.target.value))} maxLength={15} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">NÍVEL DE ACESSO</label><select value={newVolRole} onChange={e => setNewVolRole(e.target.value as any)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all appearance-none cursor-pointer text-sm"><option value="SERVO">Servo (Inscrições)</option><option value="ADMIN">Administrador (Gestão)</option></select></div>
              <button type="submit" className="w-full bg-brand text-white py-5 rounded-2xl font-black text-lg shadow-xl hover-brand active-brand transition-all uppercase">Finalizar Cadastro</button>
            </form>
          </div>
        </div>
      )}

      {/* GERENCIAR AREAS */}
      {editingAreasService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setEditingAreasService(null)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3"><div className="bg-brand-10 p-2.5 rounded-xl text-brand"><Layers className="w-6 h-6" /></div><div><h3 className="font-black text-xl text-white tracking-tight uppercase">GERENCIAR VAGAS</h3><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{formatDate(editingAreasService.date)}</p></div></div>
              <button onClick={() => setEditingAreasService(null)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex gap-2">
                <input type="text" placeholder="Nome da vaga (Ex: Som, Mídia)" value={newAreaInput} onChange={e => setNewAreaInput(e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm" onKeyDown={e => e.key === 'Enter' && handleAddArea(editingAreasService.id)} />
                <button onClick={() => handleAddArea(editingAreasService.id)} className="bg-brand text-white p-4 rounded-2xl hover-brand active-brand transition-all shadow-lg shrink-0"><ListPlus className="w-6 h-6" /></button>
              </div>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Vagas Configuradas</p>
                {(editingAreasService.areas || globalAreas).map(area => {
                  const isAssigned = assignments.some(a => a.serviceId === editingAreasService.id && a.area === area);
                  return (
                    <div key={area} className="bg-zinc-800 border border-zinc-700 px-5 py-4 rounded-2xl flex items-center justify-between group/area"><div className="flex items-center gap-3"><span className="text-sm font-bold text-white">{area}</span>{isAssigned && <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20">Preenchida</span>}</div><button onClick={() => handleRemoveArea(editingAreasService.id, area)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                  );
                })}
              </div>
            </div>
            <div className="p-6 md:p-8 border-t border-zinc-800 bg-zinc-900/50"><button onClick={() => setEditingAreasService(null)} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-black text-sm uppercase transition-all">Concluir Edição</button></div>
          </div>
        </div>
      )}

      {/* HISTÓRICO */}
      {viewingVolunteerHistory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setViewingVolunteerHistory(null)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-4"><div className="bg-brand-10 p-3 rounded-2xl text-brand"><UserCheck className="w-8 h-8" /></div><div><h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-tight">{viewingVolunteerHistory}</h3><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Prontuário de Serviço</p></div></div>
              <button onClick={() => setViewingVolunteerHistory(null)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {assignments.filter(a => a.userName === viewingVolunteerHistory).sort((a, b) => { const sA = services.find(s => s.id === a.serviceId); const sB = services.find(s => s.id === b.serviceId); if (!sA || !sB) return 0; return new Date(sB.date).getTime() - new Date(sA.date).getTime(); }).map(a => {
                    const service = services.find(s => s.id === a.serviceId);
                    if (!service) return null;
                    return (
                      <div key={a.id} className="bg-zinc-800/50 border border-zinc-800 rounded-2xl p-4 md:p-5 flex items-center justify-between group hover:border-zinc-700 transition-all"><div className="flex items-center gap-4"><div className="bg-zinc-800 p-2.5 rounded-xl border border-zinc-700 group-hover:border-brand-20 transition-all"><Calendar className="w-4 h-4 text-brand" /></div><div><p className="text-sm font-black text-white">{formatDate(service.date)}</p><p className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3" /> {service.time} — {service.dayOfWeek}</p></div></div><div className="text-right"><span className="bg-brand-10 text-brand text-[9px] md:text-[10px] font-black uppercase px-2 md:px-3 py-1.5 rounded-lg border border-brand-20 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {a.area}</span></div></div>
                    );
                })}
              </div>
            </div>
            <div className="p-6 md:p-8 border-t border-zinc-800 bg-zinc-900/50"><div className="flex items-center justify-between"><div className="text-center md:text-left"><p className="text-xs font-black text-zinc-500 uppercase">Total de Serviços</p><p className="text-xl font-black text-white">{assignments.filter(a => a.userName === viewingVolunteerHistory).length}</p></div><button onClick={() => setViewingVolunteerHistory(null)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg">FECHAR</button></div></div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-32 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-300 w-[90%] max-w-sm">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 ${toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400/30' : 'bg-zinc-800/90 text-zinc-100 border-zinc-700'}`}><div className="bg-white/20 p-1.5 rounded-lg shrink-0">{toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}</div><p className="font-bold text-sm tracking-tight">{toast.message}</p></div>
        </div>
      )}

      {/* NOVO CULTO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddModalOpen(false)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3"><div className="bg-brand-10 p-2 rounded-xl text-brand"><Calendar className="w-6 h-6" /></div><h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-tight">NOVO CULTO</h3></div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <form onSubmit={handleAddService} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">DATA</label><input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">HORÁRIO</label><input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm" /></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">DESCRIÇÃO (OPCIONAL)</label><input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ex: Culto de Ceia" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all placeholder:text-zinc-600 text-sm" /></div>
              <button type="submit" className="w-full bg-brand text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover-brand active-brand transition-all mt-4 uppercase">PUBLICAR ESCALA</button>
            </form>
          </div>
        </div>
      )}

      {/* EDITAR VOLUNTÁRIO */}
      {editingVolunteer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setEditingVolunteer(null)} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 md:p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3"><div className="bg-brand-10 p-2 rounded-xl text-brand"><UserCog className="w-6 h-6" /></div><h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-tight uppercase">EDITAR PERFIL</h3></div>
              <button onClick={() => setEditingVolunteer(null)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <form onSubmit={handleUpdateVolunteer} className="p-6 md:p-8 space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">NOME COMPLETO</label><input type="text" required value={editingVolunteer.name} onChange={e => setEditingVolunteer({...editingVolunteer, name: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">WHATSAPP</label><input type="tel" required value={editingVolunteer.whatsapp} onChange={e => setEditingVolunteer({...editingVolunteer, whatsapp: maskPhoneBR(e.target.value)})} maxLength={15} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all text-sm" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">NÍVEL DE ACESSO</label><select value={editingVolunteer.role} onChange={e => setEditingVolunteer({...editingVolunteer, role: e.target.value as any})} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-brand transition-all appearance-none cursor-pointer text-sm"><option value="SERVO">Servo (Padrão)</option><option value="ADMIN">Administrador</option></select></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingVolunteer(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-bold hover:bg-zinc-700 transition-all uppercase text-xs">Descartar</button><button type="submit" className="flex-[2] bg-brand text-white py-4 rounded-2xl font-black shadow-xl hover-brand active-brand transition-all uppercase text-xs flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Salvar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMAR EXCLUSAO */}
      {serviceToConfirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setServiceToConfirmDelete(null)} />
          <div className="bg-zinc-900 border border-red-500/30 rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 border-b border-zinc-800 bg-red-500/5 flex flex-col items-center text-center gap-4"><div className="bg-red-500/20 p-5 rounded-full text-red-500"><AlertTriangle className="w-10 h-10" /></div><div><h3 className="font-black text-2xl text-white uppercase tracking-tight">CONFIRMAR EXCLUSÃO</h3><p className="text-zinc-400 text-sm mt-1">Essa ação é irreversível.</p></div></div>
            <div className="p-8 space-y-6">
              <div className="space-y-4"><p className="text-zinc-300 text-sm font-medium text-center">Digite a data <span className="text-white font-bold">{formatDate(serviceToConfirmDelete.date)}</span> para confirmar:</p><input type="text" placeholder="DD/MM/YYYY" value={deleteConfirmationInput} onChange={e => setDeleteConfirmationInput(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-2xl px-5 py-5 outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-zinc-600 text-center font-black tracking-widest text-lg" /></div>
              <div className="flex flex-col sm:flex-row gap-3"><button onClick={() => setServiceToConfirmDelete(null)} className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-bold hover:bg-zinc-700 transition-all uppercase text-xs order-2 sm:order-1">CANCELAR</button><button disabled={deleteConfirmationInput !== formatDate(serviceToConfirmDelete.date)} onClick={confirmDelete} className="flex-[2] bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-4 rounded-2xl font-black shadow-xl uppercase text-xs order-1 sm:order-2">EXCLUIR AGORA</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
