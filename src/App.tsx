/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy,
  where,
  limit,
  setDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { 
  Car, 
  Bike,
  CheckCircle2, 
  LogOut, 
  LogIn, 
  History, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeftRight,
  ExternalLink,
  Shield,
  Clock,
  User as UserIcon,
  Gauge,
  ClipboardList,
  Users,
  MapPin,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Save,
  Search,
  Share2,
  Settings,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { auth, db, loginWithGoogle, logout } from './firebase';

// Types
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  prefix: string;
  status: 'available' | 'in_use' | 'maintenance';
  lastMileage: number;
  currentDriver?: string;
  currentDriverEmail?: string;
}

interface RecordEntry {
  id: string;
  vehicleId: string;
  type: 'check-out' | 'check-in';
  timestamp: any;
  userEmail: string;
  userName?: string;
  identification: {
    prefix: string;
    operationalPrefix: string;
    plate: string;
    model: string;
    date: string;
    time: string;
  };
  drivers: {
    driverName: string;
    serviceType: string;
  };
  mileage: {
    currentMileage: number;
    notes: string;
  };
}

const DRIVERS_LIST = [
  "TC BOSCO 970036-6", "CAP LOURIVAL 118951-4", "CAP EDJANE 104666-7", "2° TEN FLORO 126757-4", "2° TEN FERNANDO 106343-0",
  "2º TEN OLAVO 104152-5", "SUB TEN JUAREZ 990050-0", "SUB TEN BEZERRA 980788-0", "SUB TEN MARQUES 980770-5", "SUB TEN ORLANDO LIMA 990102-7",
  "SUB TEN DANILO 106436-3", "SUB TEN JOSEANE MELO 103376-0", "SUB TEN ALEXSANDRO 106684-6", "SUB TEN LUCIANO SANTOS 103663-7", "SUB TEN ROOSEVELT 105400-7",
  "1°SGT ERASMO 950353-6", "1°SGT CAMILA 103012-4", "1°SGT ANA CLECIA 103424-3", "1°SGT MIRIAN 107550-0", "1°SGT JANILSON 106760-5",
  "1°SGT EVANDRO 950484-2", "1°SGT JOSEILDO 990085-3", "1° SGT RIOSNEY 106869-5", "1°SGT ROGERIO 990088-8", "2°SGT GILDOVAN 930577-7",
  "2°SGT GENILSON 950486-9", "2°SGT FREITAS 950773-6", "2°SGT LOPES 950779-5", "2°SGT EVERALDO 950817-1", "2°SGT BENTO 980766-7",
  "2°SGT RUBENS CLAY 980788-8", "2°SGT JOSINEWTON 990046-2", "2°SGT SANDOVAL 950382-0", "2°SGT CORREIA 950531-8", "2°SGT CLAUDIO 950545-8",
  "2°SGT YRAPUAN 950781-7", "2°SGT CASSIMIRO 950818-0", "2°SGT CLECIA MARQUES 103512-6", "2°SGT YONEYGLEISON 104581-4", "2°SGT HILARIO 104782-5",
  "2°SGT CHARLEY 980715-2", "2º SGT RIOMAR 32053-6", "2°SGT ANDERSON 950765-9", "2°SGT SINDOMAR 980790-0", "2°SGT VALDECI 980791-8",
  "2º SGT LUCIVANIO 980784-5", "2°SGT JAELSON 980850-7", "2°SGT DUARTE JUNIOR 990041-1", "2°SGT BRITO 990061-6", "2°SGT CLAUDIO 990069-1",
  "2°SGT MURILO 990089-6", "2°SGT CARVALHO 102893-6", "2°SGT NEIDVALDO 103257-7", "2°SGT ANDREIA SILVESTRE 110649-0", "2°SGT JOSE PAULO 103312-3",
  "2°SGT JOÃO LUIZ 103551-7", "2°SGT MAGALHÃES 103619-0", "2°SGT JOÃO PAULO 107909-3", "3°SGT NOVAES 980783-7", "3°SGT PEREIRA 104264-5",
  "3°SGT JUNIOR 104301-3", "3°SGT RICARDO LOPES 104607-1", "3°SGT DANILO 104781-7", "3°SGT BARROS 104120-7", "3°SGT PEDRO 105469-4",
  "3°SGT JOSELIO 105648-4", "3°SGT DAVID 105706-5", "3°SGT MAURICIO 106572-6", "3°SGT FERNANDO SOUZA 106810-5", "3°SGT BRITO 106863-6",
  "3°SGT JAIRO 107042-8", "3°SGT BARBOSA 107939-5", "3°SGT RAMON 107955-7", "3°SGT WAGNER 107855-0", "3°SGT ELI MARTINS 108058-0",
  "3°SGT BEZERRA 107479-2", "3°SGT EDEMILSON 108043-1", "3°SGT RUDISMALIA 109150-6", "3°SGT ADRIANA MANDU 110532-9", "3°SGT MARILYN 109338-0",
  "3°SGT M BRITO 110330-0", "3°SGT SABINO 108673-1", "3°SGT ELIANE LIMA 110991-0", "3°SGT SERGIO 108651-0", "3°SGT TAMIRES 109169-7",
  "3°SGT ROBSON 108401-1", "3°SGT FAGNER SANTOS 109402-5", "3°SGT YUKIO 111073-0", "3°SGT RODRIGO 108840-8", "3°SGT MOREIRA 108912-9",
  "3°SGT ALEXANDRE 108671-5", "3°SGT MIRTS 110433-0", "3°SGT JOSEAN 110820-4", "3°SGT HALLAN 110483-7", "3°SGT ENOQUE 110984-7",
  "3°SGT JADSON 109578-1", "3°SGT POLIANA LEMOS 110918-9", "3°SGT JAKAUNAS 110146-3", "3°SGT CARLOS GOMES 110025-4", "3°SGT MICHELE SILVA 109671-0",
  "3°SGT SOBREIRA 110317-2", "3°SGT JEAN 113954-1", "3°SGT ALMEIDA 111314-3", "3°SGT VALCILENE 109069-0", "3°SGT CRISTIANO SANTOS 108949-8",
  "3°SGT GINALDO 109645-1", "3°SGT M FREIRE 110033-5", "3°SGT GABRIELA MARINHO 110476-4", "3°SGT JOÃO GOMES 110032-7", "3°SGT AQUINO 109299-5",
  "3°SGT VALDENI 110684-4", "3°SGT FRANCINADIA 111454-9", "3°SGT ELOI 109933-7", "3°SGT B LIMA 110485-3", "3°SGT GENILSON LIMA 111273-2",
  "1º SGTRRPM HENRIQUE 130051-2", "1º SGTRRPM MATIAS 127225-0", "3º SGTRRPM FRANCISCO 1190221", "CB SILVANO 109987-6", "CB ALCIDES 910477-1",
  "CB GOIS 111601-0", "CB SAHRA 111761-0", "CB ADRICIO 108836-0", "CB ELISANIA 112560-5", "CB MARCIA 112698-9",
  "CB LEÃO 113034-0", "CB JULIANA PEREIRA 113077-3", "CB G SILVA 113132-0", "CB JULIANA LUNARIA 113217-2", "CB CARLOS SANTOS 113231-8",
  "CB FREIRE 113299-7", "CB MACIEL 113318-7", "CB SIQUEIRA 113332-2", "CB ALCIMAR 113362-4", "CB MARCELO 113370-5",
  "CB ROBSON 113386-1", "CB CARLOS 113406-0", "CB SANTOS 113533-3", "CB ALCIDES 113535-0", "CB JANAINA 113635-6",
  "CB JANAYNA ALVES 113677-1", "CB JOCILER 113682-8", "CB ROBERIO 113745-0", "CB J EMANUEL 112082-4", "CB NADIEL 112121-9",
  "CB C RODRIGUES 112745-4", "CB ITALO SILVA 113669-0", "CB ERILSON 113838-3", "CB P LACERDA 113896-0", "CB CARDOZO 113999-1",
  "CB L FREIRE 114014-0", "CB DANILO 114062-0", "CB DEMONTIER 114076-0", "CB C ALVES 114148-1", "CB EDSON 115041-3",
  "CB FABRICIO 115153-3", "CB FRANCISCO ALVES 115201-7", "CB TAMARA SANTOS 115271-8", "CB ROSANGELA 115336-6", "CB MACHADO NETO 115398-6",
  "CB WANDSON 115446-0", "CB LEANDRO 115455-9", "CB ANA CAROLINA 115463-0", "CB RENATO BRITO 115522-9", "CB LEIDIMAR 115599-7",
  "CB DANIEL DINIZ 115655-1", "CB GILVAN 115764-7", "CB ILMO 115766-3", "CB SILVA MENDES 115802-3", "CB THIAGO 115985-2",
  "CB FRANCISCO SANTOS 116127-0", "CB NEILDO 116165-2", "CB C MELO 116166-0", "CB ALDONELIO 116185-7", "CB GONARY 116297-7",
  "CB JOSE DINIZ 116330-2", "CB EDERSON 116331-0", "CB TIBURTINO 113717-4", "CB MAMEDES 116430-9", "CB C NASCIMENTO 116494-5",
  "CB MEIRILANE 117329-4", "CB SOBREIRA 117559-9", "CB J. RAMALHO", "CB JUNIOR 117586-6", "CB ROBERTO SILVA 117588-2",
  "CB THAISLANY 117652-8", "CB EDIVANIA 117678-1", "CB FRANCO 117708-7", "CB BIONATAN 117752-4", "CB ROSANGELA 117875-0",
  "CB SAVIO 117933-0", "CB REBEKA 117934", "CB CLAUDENILDO 117949-7", "CB KLEBIO 118098-3", "CB SELSON 118141-6",
  "CB FERRAZ 118143-2", "CB INACIO JUNIOR 118181-5", "CB GUSTAVO BRITO 118184-0", "CB LINO 118193-9", "CB ELTON HENRIQUE 118394-0",
  "CB RAMMON PATRICK 115517-2", "CB DANIEL SANTOS 115465-6", "CB LUANA SOUZA 119735-5", "CB RUTY SILVA 119766-5", "CB WILSON LIMA 119827-0",
  "CB R SIQUEIRA 119865-3", "CB RODOLFO LEITE 119980-3", "CB AMANDA SANTOS 120073-9", "CB DAYANE LIMA 120074-7", "CB RENAN CORREIA 111428-0",
  "CB GEANE 118389-3", "CB THACYO 120161-1", "CB VIDAL 120169-7", "CB RONISETE 120177-8", "CB NUNES SILVA 120283-9",
  "CB DANILA 120335-5", "CB MARCILIO 120396-7", "SD NASCIMENTO 120490-4", "CB MARDONIO 113694-1", "SD WESLEY LEITE 120677-0",
  "SD ARAUJO 120703-2", "SD WAGNER 120733-4", "SD ALVES JUNIOR 120754-7", "SD PEDRO RAMOS 120854-3", "SD GUSTAVO SILVA 120882-9",
  "SD GOMES 120888-8", "SD AUDERI 120980-9", "SD RAQUEL 121024-6", "SD GEORGE 121531-0", "SD TELES 121543-4",
  "SD EDESIO 121625-2", "SD DANIEL LIMA 121662-7", "SD BRANDDON 121770-4", "SD J CORDEIRO 122053-5", "SD LEONARDO LIMA 122179-5",
  "SD FABRICIO VIANA 122277-5", "SD LARISSA 122333-0", "SD TACILIO 122523-5", "SD MAGALHÃES 122543-0", "SD RICARTE 122563-4",
  "SD MAYARA MOURA 122571-5", "SD PEREIRA LIMA 122903-6", "SD HELDER FEITOSA 123878-0", "SD F CARVALHO 123820-5", "SD BARBOSA 123857-4",
  "SD KAROLINY CAMPOS 123866-3", "SD NUNES 123990-2", "SD LEONARDO MARCEL 124054-4", "SD S MARTINS 124140-0", "SD DIEGO 124188-5",
  "SD SAMARA 125333-6", "SD AYRLLA SIQUEIRA 125548-7", "SD GEOVA 125649-1", "SD AMAURILIO 125732-3", "SD IVANEURRY 125749-8",
  "SD NONATO 125792-7", "SD TAMIRES 126479-6", "SD MEDEIROS 126531-8", "SD BARREIRO 126838-4", "SD MARINHO 123925-2",
  "SD G MORAES 123750-0", "SD AMARILDO 120559-5", "SD CLAUDEMIRO 125666-1", "SD BRITO 121828-0", "3º SGT PM CARLOS 109053-4",
  "3°sgt Rogério 108554-9", "CB ANA LIMA 1139738", "3º SGT CLECIO 110880-8", "SD HERMINIO 126227-0", "CB PAULO 113537-6",
  "CB EDEIWES 116024-9", "SD J.Magagalhães 125632-7", "CB GEORGE 120456-4"
];

const SERVICE_TYPES = [
  'Ordinário', 'PJES', 'PE Seguro', 'FECHA BATALHÃO', 'OUTROS'
];

const OPERATIONAL_PREFIXES = [
  "GT 14000- OPERAÇÕES",
  "GT 14111- CENTRO",
  "GT 14112- CALUMBI",
  "GT 14113 - QSH",
  "GT 14114- ESCOLTA",
  "GT 14115 - FECHA BATALHÃO",
  "GT 14116- VANETE ALMEIDA",
  "GT 14117- EVENTO",
  "GT 14118- EVENTO",
  "GT 14121- BETANIA",
  "GT 14211-BELMONTE",
  "GT 14311- TRIUNFO",
  "GT 14321-SANTA CRUZ",
  "GT 14331- FLORES",
  "GE 14102 - RURAL",
  "GE 14101- GATI ORDINÁRIO",
  "GE 14150 - GATI EXTRA",
  "GE 14250 - RURAL EXTRA",
  "GV 14050- MALHAS DA LEI",
  "MP 14050- MARIA DA PENHA",
  "VE 14111-ESCOLAR",
  "VE 14112-ESCOLAR",
  "VE 14113-ESCOLAR",
  "GT 14100 - COMANDO",
  "GT 14200 - SUBCOMANDO",
  "GT DISPERSÃO",
  "OPERAÇÃO BICENTENÁRIO - 06H AS 14H",
  "OPERAÇÃO ENEM",
  "GEM 14101- ROCAM",
  "GEM 14102- ROCAM",
  "GEM 14113- ROCAM",
  "GEM 14114- ROCAM EXTRA",
  "GEM 14115- ROCAM EXTRA",
  "GEM 14116- ROCAM EXTRA",
  "GEM 14211- ROCAM BELMONTE",
  "GEM 14212- ROCAM BELMONTE"
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isAdmin = user?.email === 'demetriomarques@gmail.com' || userRole === 'admin';
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [history, setHistory] = useState<RecordEntry[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [operationType, setOperationType] = useState<'check-out' | 'check-in' | null>(null);
  
  // Form State
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [formData, setFormData] = useState({
    identification: {
      prefix: '',
      operationalPrefix: '',
      plate: '',
      model: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm')
    },
    drivers: {
      driverName: '',
      commanderName: ''
    },
    mileage: {
      currentMileage: 0,
      notes: ''
    }
  });

  const [submitting, setSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'history' | 'admin'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'check-out' | 'check-in' | 'maintenance'>('all');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    prefix: '',
    plate: '',
    model: '',
    status: 'available' as 'available' | 'in_use' | 'maintenance',
    lastMileage: 0
  });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'vehicle' | 'admin', label?: string } | null>(null);
  const isBootstrapping = useRef(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserRole(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Role listener
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserRole(docSnap.data().role);
      } else {
        // Bootstrap default admin if it's the specific email
        if (user.email === 'demetriomarques@gmail.com') {
          setDoc(userDocRef, {
            email: user.email,
            role: 'admin',
            displayName: user.displayName || 'Admin'
          });
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching user role:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Vehicles listener
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
      const vehicleList: Vehicle[] = [];
      snapshot.forEach((doc) => {
        vehicleList.push({ id: doc.id, ...doc.data() } as Vehicle);
      });
      
      setVehicles(vehicleList);
      
      // Bootstrap if empty - only if admin to have permissions
      if (snapshot.empty && isAdmin) {
        bootstrapVehicles();
      }
    }, (err) => {
      console.error("Error fetching vehicles:", err);
      setError("Erro ao carregar viaturas. Verifique as permissões.");
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // History listener
  useEffect(() => {
    if (!user || view !== 'history') return;

    const q = query(collection(db, 'checklists'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordList: RecordEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as RecordEntry;
        // Individualize history: only show own records unless admin
        if (isAdmin || data.userEmail === user.email) {
          recordList.push({ id: doc.id, ...data } as RecordEntry);
        }
      });
      setHistory(recordList);
    });

    return () => unsubscribe();
  }, [user, view]);

  // Admin users listener
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList: any[] = [];
      snapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setAdminUsers(userList);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleSaveVehicle = async () => {
    if (!isAdmin) return;
    try {
      if (editingVehicle) {
        await updateDoc(doc(db, 'vehicles', editingVehicle.id), vehicleForm);
      } else {
        await addDoc(collection(db, 'vehicles'), vehicleForm);
      }
      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
      setVehicleForm({ prefix: '', plate: '', model: '', status: 'available', lastMileage: 0 });
    } catch (err) {
      console.error("Error saving vehicle:", err);
      setError("Erro ao salvar viatura.");
    }
  };

  const handleDeleteVehicle = (id: string, plate: string) => {
    if (!isAdmin) return;
    setDeleteConfirm({ id, type: 'vehicle', label: plate });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'vehicle') {
        await deleteDoc(doc(db, 'vehicles', deleteConfirm.id));
      } else {
        await updateDoc(doc(db, 'users', deleteConfirm.id), { role: 'user' });
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error during deletion:", err);
      setError("Erro ao realizar a exclusão.");
    }
  };

  const handleAddAdmin = async () => {
    if (!isAdmin || !newUserEmail) return;
    try {
      const q = query(collection(db, 'users'), where('email', '==', newUserEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
      } else {
        setError("Usuário não encontrado. Ele precisa ter feito login pelo menos uma vez.");
      }
      setNewUserEmail('');
    } catch (err) {
      console.error("Error adding admin:", err);
    }
  };

  const handleRemoveAdmin = (userId: string, email: string) => {
    if (!isAdmin) return;
    if (email === 'demetriomarques@gmail.com') {
      setError("Não é possível remover o administrador principal.");
      return;
    }
    setDeleteConfirm({ id: userId, type: 'admin', label: email });
  };

  const bootstrapVehicles = async (force = false) => {
    if (!force && (isBootstrapping.current || vehicles.length > 0)) return;
    isBootstrapping.current = true;
    if (force) setIsSyncing(true);
    
    const initialVehicles = [
      { plate: 'SNZ8F51', model: 'CHEVROLET/S-10', prefix: '640150', status: 'available', lastMileage: 0 },
      { plate: 'SNZ4C21', model: 'CHEVROLET/S-10', prefix: '640151', status: 'available', lastMileage: 0 },
      { plate: 'SNZ4C61', model: 'CHEVROLET/S-10', prefix: '640152', status: 'available', lastMileage: 0 },
      { plate: 'SOG4H29', model: 'CHEVROLET/S-10', prefix: '640153', status: 'available', lastMileage: 0 },
      { plate: 'SOG4I59', model: 'CHEVROLET/S-10', prefix: '640154', status: 'available', lastMileage: 0 },
      { plate: 'SOG4G99', model: 'CHEVROLET/S-10', prefix: '640155', status: 'available', lastMileage: 0 },
      { plate: 'SOH6A98', model: 'CHEVROLET/S-10', prefix: '640156', status: 'available', lastMileage: 0 },
      { plate: 'UHL2H45', model: 'HILLUX', prefix: '640161', status: 'available', lastMileage: 0 },
      { plate: 'RZZ8G50', model: 'RENALT/DUSTER', prefix: '640135', status: 'available', lastMileage: 0 },
      { plate: 'RZZ6G90', model: 'RENALT/DUSTER', prefix: '640136', status: 'available', lastMileage: 0 },
      { plate: 'RZZ0F43', model: 'RENALT/DUSTER', prefix: '640137', status: 'available', lastMileage: 0 },
      { plate: 'RZZ0F83', model: 'RENALT/DUSTER', prefix: '640138', status: 'available', lastMileage: 0 },
      { plate: 'RZZ0G33', model: 'RENALT/DUSTER', prefix: '640139', status: 'available', lastMileage: 0 },
      { plate: 'RZZ6E00', model: 'RENALT/DUSTER', prefix: '640140', status: 'available', lastMileage: 0 },
      { plate: 'RZZ8H00', model: 'RENALT/DUSTER', prefix: '640141', status: 'available', lastMileage: 0 },
      { plate: 'RZY4G58', model: 'RENALT/DUSTER', prefix: '640142', status: 'available', lastMileage: 0 },
      { plate: 'RZZ2E03', model: 'RENALT/DUSTER', prefix: '640143', status: 'available', lastMileage: 0 },
      { plate: 'RZY1G98', model: 'RENALT/DUSTER', prefix: '640157', status: 'available', lastMileage: 0 },
      { plate: 'SNN5E90', model: 'RENALT/DUSTER', prefix: '1210097', status: 'available', lastMileage: 0 },
      { plate: 'PBG5G37', model: 'FORD/RANGER', prefix: '64110', status: 'available', lastMileage: 0 },
      { plate: 'QYV7F75', model: 'MMC/L200', prefix: '64107', status: 'available', lastMileage: 0 },
      { plate: 'SNO0C99', model: 'VOLKSWAGENPOLO', prefix: '640144', status: 'available', lastMileage: 0 },
      { plate: 'SOB5F10', model: 'FIAT/ARGO', prefix: '1210105', status: 'available', lastMileage: 0 },
      { plate: 'SOA9C08', model: 'FIAT/ARGO', prefix: '1210153', status: 'available', lastMileage: 0 },
      { plate: 'PFA5246', model: 'VOLKSWAGEN/VOLARE', prefix: '6489', status: 'available', lastMileage: 0 },
      { plate: 'PCK8556', model: 'FIAT/DOBLO', prefix: '6491', status: 'available', lastMileage: 0 },
      { plate: 'PDS6365', model: 'HONDA/XRE300', prefix: '6492', status: 'available', lastMileage: 0 },
      { plate: 'PDS6435', model: 'HONDA/XRE300', prefix: '6493', status: 'available', lastMileage: 0 },
      { plate: 'PDS6455', model: 'HONDA/XRE300', prefix: '6494', status: 'available', lastMileage: 0 },
      { plate: 'PDS6475', model: 'HONDA/XRE300', prefix: '6495', status: 'available', lastMileage: 0 },
      { plate: 'PDS6485', model: 'HONDA/XRE300', prefix: '6496', status: 'available', lastMileage: 0 },
      { plate: 'PDS6845', model: 'HONDA/XRE300', prefix: '6497', status: 'available', lastMileage: 0 },
      { plate: 'PEC8506', model: 'HONDA/XRE300', prefix: '6498', status: 'available', lastMileage: 0 },
      { plate: 'PEC8526', model: 'HONDA/XRE300', prefix: '6499', status: 'available', lastMileage: 0 },
      { plate: 'PEC8576', model: 'HONDA/XRE300', prefix: '64100', status: 'available', lastMileage: 0 },
      { plate: 'PEC9726', model: 'HONDA/XRE300', prefix: '64103', status: 'available', lastMileage: 0 },
      { plate: 'PEC9736', model: 'HONDA/XRE300', prefix: '64104', status: 'available', lastMileage: 0 },
      { plate: 'PDS1785', model: 'HONDA/XRE300', prefix: '64105', status: 'available', lastMileage: 0 },
      { plate: 'PDS1795', model: 'HONDA/XRE300', prefix: '64106', status: 'available', lastMileage: 0 },
      { plate: 'SNR1I38', model: 'HONDA/XRE300', prefix: '640145', status: 'available', lastMileage: 0 },
      { plate: 'SNR8D25', model: 'HONDA/XRE300', prefix: '640146', status: 'available', lastMileage: 0 },
      { plate: 'SNR8A05', model: 'HONDA/XRE300', prefix: '640147', status: 'available', lastMileage: 0 },
      { plate: 'SNT5I45', model: 'HONDA/XRE300', prefix: '640148', status: 'available', lastMileage: 0 },
      { plate: 'SNT5I46', model: 'HONDA/XRE300', prefix: '640149', status: 'available', lastMileage: 0 },
      { plate: 'SOJ6C78', model: 'HONDA/XRE300', prefix: '640158', status: 'available', lastMileage: 0 },
      { plate: 'SOJ6D28', model: 'HONDA/XRE300', prefix: '640159', status: 'available', lastMileage: 0 },
      { plate: 'SOJ6D78', model: 'HONDA/XRE300', prefix: '640160', status: 'available', lastMileage: 0 },
    ];

    try {
      for (const v of initialVehicles) {
        // Use plate as ID to avoid duplicates
        const docRef = doc(db, 'vehicles', v.plate);
        await setDoc(docRef, v);
      }
    } catch (err) {
      console.error("Error bootstrapping:", err);
      if (force) setError("Erro ao sincronizar frota.");
    } finally {
      isBootstrapping.current = false;
      if (force) {
        setIsSyncing(false);
        alert("Frota sincronizada com sucesso!");
      }
    }
  };

  const handleToggleMaintenance = async (vehicle: Vehicle) => {
    const newStatus = vehicle.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      await updateDoc(doc(db, 'vehicles', vehicle.id), {
        status: newStatus
      });

      // Record this action in the history
      if (user) {
        await addDoc(collection(db, 'checklists'), {
          vehicleId: vehicle.id,
          type: newStatus === 'maintenance' ? 'maintenance-in' : 'maintenance-out',
          timestamp: serverTimestamp(),
          userEmail: user.email,
          userName: user.displayName || user.email.split('@')[0],
          identification: {
            plate: vehicle.plate,
            prefix: vehicle.prefix || 'RESERVA',
            model: vehicle.model,
            operationalPrefix: 'MANUTENÇÃO',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: format(new Date(), 'HH:mm')
          },
          drivers: {
            driverName: 'SISTEMA / MANUTENÇÃO',
            serviceType: 'MANUTENÇÃO'
          },
          mileage: {
            currentMileage: vehicle.lastMileage,
            notes: newStatus === 'maintenance' ? 'Viatura baixada para manutenção.' : 'Viatura liberada da manutenção.'
          }
        });
      }
    } catch (err) {
      console.error("Error updating vehicle status:", err);
      setError("Erro ao atualizar status da viatura.");
    }
  };

  const handleStartRecord = async (vehicle: Vehicle, type: 'check-out' | 'check-in') => {
    let lastCheckIn: RecordEntry | null = null;
    
    if (type === 'check-out') {
      try {
        const q = query(
          collection(db, 'checklists'), 
          where('vehicleId', '==', vehicle.id),
          where('type', '==', 'check-in'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          lastCheckIn = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as RecordEntry;
        }
      } catch (err) {
        console.error("Error fetching last check-in:", err);
      }
    }

    setSelectedVehicle(vehicle);
    setOperationType(type);
    setCurrentTab(type === 'check-out' ? 2 : 0);
    setFormData({
      identification: {
        prefix: vehicle.prefix || 'RESERVA',
        operationalPrefix: lastCheckIn?.identification.operationalPrefix || '',
        plate: vehicle.plate,
        model: vehicle.model,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm')
      },
      drivers: {
        driverName: lastCheckIn?.drivers.driverName || '',
        serviceType: lastCheckIn?.drivers.serviceType || ''
      },
      mileage: {
        currentMileage: vehicle.lastMileage,
        notes: ''
      }
    });
  };

  const formatWhatsAppMessage = (record: RecordEntry) => {
    const driverFormatted = record.drivers.driverName.replace(/ (\d)/, ' / $1');
    const dateFormatted = record.identification.date.split('-').reverse().join('/');
    
    const messageBody = record.type === 'check-in' 
      ? `✅ *CHECK-IN VIATURA*\n` +
        `🪙 *Pat:* ${record.identification.prefix}\n` +
        `⛔ *Placa:* ${record.identification.plate}\n` +
        `📟 *Prefixo:* ${record.identification.operationalPrefix || '---'}\n` +
        `🧮 *Emprego:* ${record.drivers.serviceType || '---'}\n` +
        `🚓 *Vtr:* ${record.identification.model}\n` +
        `🔓 *Km inic:* ${record.mileage.currentMileage}\n` +
        `📅 *Data:* ${dateFormatted}\n` +
        `⌚ *Hora que armou:* ${record.identification.time}\n` +
        `👮🏻‍♂️ *Condutor/Mat:* ${driverFormatted}`
      : `🏁 *CHECK-OUT VIATURA*\n` +
        `🪙 *Pat:* ${record.identification.prefix}\n` +
        `⛔ *Placa:* ${record.identification.plate}\n` +
        `📟 *Prefixo:* ${record.identification.operationalPrefix || '---'}\n` +
        `🧮 *Emprego:* ${record.drivers.serviceType || '---'}\n` +
        `🚓 *Vtr:* ${record.identification.model}\n` +
        `🔐 *Km final:* ${record.mileage.currentMileage}\n` +
        `📅 *Data:* ${dateFormatted}\n` +
        `⌚ *Hora que desarmou:* ${record.identification.time}\n` +
        `👮🏻‍♂️ *Condutor/Mat:* ${driverFormatted}`;
    
    return record.mileage.notes 
      ? `${messageBody}\n\n📝 *Obs:* ${record.mileage.notes}`
      : messageBody;
  };

  const handleResendWhatsApp = (record: RecordEntry) => {
    const message = formatWhatsAppMessage(record);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSaveRecord = async () => {
    if (!selectedVehicle || !operationType || !user) return;

    if (formData.mileage.currentMileage < selectedVehicle.lastMileage && operationType === 'check-out') {
      setError("A quilometragem de devolução não pode ser menor que a de saída.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Add record to database
      await addDoc(collection(db, 'checklists'), {
        vehicleId: selectedVehicle.id,
        type: operationType,
        timestamp: serverTimestamp(),
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        identification: formData.identification,
        drivers: formData.drivers,
        mileage: formData.mileage
      });

      // Update vehicle status
      await updateDoc(doc(db, 'vehicles', selectedVehicle.id), {
        status: operationType === 'check-in' ? 'in_use' : 'available',
        lastMileage: formData.mileage.currentMileage,
        currentDriver: operationType === 'check-in' ? formData.drivers.driverName : null,
        currentDriverEmail: operationType === 'check-in' ? user.email : null
      });

      // Format WhatsApp Message
      const recordToFormat: RecordEntry = {
        ...formData,
        id: '', // Not needed for formatting
        vehicleId: selectedVehicle.id,
        type: operationType!,
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || '',
        timestamp: new Date()
      };

      const finalMessage = formatWhatsAppMessage(recordToFormat);

      // Open WhatsApp using the most compatible API
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(finalMessage)}`;
      window.open(whatsappUrl, '_blank');

      // Reset form
      setSelectedVehicle(null);
      setOperationType(null);
      setCurrentTab(0);
      setError(null);
    } catch (err: any) {
      console.error("Error saving record:", err);
      setError("Erro ao salvar registro. " + (err.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pmpe-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-8 border-pmpe-blue"
        >
          <div className="mb-6 flex justify-center">
            <div className="bg-white p-2 rounded-full shadow-lg border-4 border-pmpe-gold overflow-hidden w-24 h-24 flex items-center justify-center">
              <img 
                src="https://i.pinimg.com/originals/25/fe/68/25fe6812a14bafd836f89d73a5b96663.png" 
                alt="Logo AutoCheck" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AutoCheck</h1>
          <p className="text-pmpe-blue mb-8 font-bold italic">14º BPM - Polícia Militar de Pernambuco</p>
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Erro ao entrar:</p>
                <p>{loginError}</p>
                <p className="mt-2 text-[10px] opacity-80">Dica: Verifique se os popups estão permitidos ou se o domínio está autorizado no Firebase.</p>
              </div>
            </div>
          )}
          
          <button 
            disabled={isLoggingIn}
            onClick={async () => {
              setLoginError(null);
              setIsLoggingIn(true);
              try {
                await loginWithGoogle();
              } catch (err: any) {
                console.error('Login error:', err);
                if (err.code === 'auth/popup-blocked') {
                  setLoginError('O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site.');
                } else if (err.code === 'auth/unauthorized-domain') {
                  setLoginError('Este domínio não está autorizado no Firebase. Tente abrir o app em uma nova aba usando o botão abaixo.');
                } else if (err.code === 'auth/popup-closed-by-user') {
                  setLoginError('A janela de login foi fechada antes de completar o acesso.');
                } else {
                  setLoginError('Ocorreu um erro ao tentar fazer login. Tente abrir o app em uma nova aba.');
                }
              } finally {
                setIsLoggingIn(false);
              }
            }}
            className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-pmpe-blue text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all active:scale-95 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoggingIn ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pmpe-blue"></div>
            ) : (
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            )}
            {isLoggingIn ? 'Acessando...' : 'Entrar com Google'}
          </button>

          {loginError && (
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="mt-4 w-full flex items-center justify-center gap-2 text-pmpe-blue hover:underline text-sm font-bold"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir em Nova Aba (Recomendado)
            </button>
          )}
          
          <p className="mt-8 text-xs text-pmpe-red uppercase tracking-widest font-black">
            Acesso Restrito a Policiais Militares
          </p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 0, label: 'Identificação', icon: ClipboardList },
    { id: 1, label: 'Condutores', icon: Users },
    { id: 2, label: 'Quilometragem', icon: Gauge }
  ];

  const stats = {
    available: vehicles.filter(v => v.status === 'available').length,
    inUse: vehicles.filter(v => v.status === 'in_use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <header className="bg-pmpe-blue text-white p-4 sticky top-0 z-50 shadow-md border-b-4 border-pmpe-gold">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border-2 border-pmpe-gold overflow-hidden w-10 h-10 flex items-center justify-center">
              <img 
                src="https://i.pinimg.com/originals/25/fe/68/25fe6812a14bafd836f89d73a5b96663.png" 
                alt="Logo AutoCheck" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">14º BPM</h1>
              <p className="text-[10px] uppercase tracking-tighter opacity-90 font-bold">AutoCheck • PMPE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold">{user.displayName}</p>
              <p className="text-[10px] opacity-80">{user.email}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-[76px] z-40">
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-around items-center text-center">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Disponíveis</span>
            <span className="text-lg font-black text-green-600">{stats.available}</span>
          </div>
          <div className="w-px h-6 bg-slate-100"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Em Uso</span>
            <span className="text-lg font-black text-pmpe-blue">{stats.inUse}</span>
          </div>
          <div className="w-px h-6 bg-slate-100"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Baixadas</span>
            <span className="text-lg font-black text-pmpe-red">{stats.maintenance}</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4">
        {/* Navigation Tabs */}
        {!selectedVehicle && (
          <div className="flex bg-white rounded-xl shadow-sm mb-6 p-1 border border-slate-200">
            <button 
              onClick={() => setView('list')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${view === 'list' ? 'bg-pmpe-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Car className="w-4 h-4" />
              Viaturas
            </button>
            <button 
              onClick={() => setView('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-pmpe-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
            {isAdmin && (
              <button 
                onClick={() => setView('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${view === 'admin' ? 'bg-pmpe-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Settings className="w-4 h-4" />
                Gerenciamento
              </button>
            )}
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!selectedVehicle ? (
            view === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid gap-4"
              >
                {/* Search Bar */}
                <div className="relative mb-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por placa, patrimônio ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:border-pmpe-blue outline-none transition-all shadow-sm font-medium"
                  />
                </div>

                {(() => {
                  const filtered = vehicles.filter(v => 
                    (v.status === 'available' || v.status === 'in_use' || v.status === 'maintenance') && (
                      (v.plate?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                      (v.prefix?.toLowerCase() || "reserva").includes(searchTerm.toLowerCase()) ||
                      (v.model?.toLowerCase() || "").includes(searchTerm.toLowerCase())
                    )
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhuma viatura encontrada para "{searchTerm}"</p>
                      </div>
                    );
                  }

                  return filtered.map((vehicle) => (
                    <div 
                      key={vehicle.id}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            vehicle.status === 'available' ? 'bg-blue-50 text-pmpe-blue' : 
                            vehicle.status === 'maintenance' ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-pmpe-red'
                          }`}>
                            {vehicle.status === 'maintenance' ? (
                              <AlertCircle className="w-6 h-6" />
                            ) : vehicle.model.toLowerCase().includes('xre') ? (
                              <Bike className="w-6 h-6" />
                            ) : (
                              <Car className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-900">{vehicle.plate}</h3>
                              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                                {vehicle.prefix || 'RESERVA'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">{vehicle.model}</p>
                            {vehicle.status === 'in_use' && vehicle.currentDriver && (
                              <p className="text-xs font-medium text-pmpe-red mt-1 flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                {vehicle.currentDriver}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            vehicle.status === 'available' ? 'bg-blue-100 text-pmpe-blue' : 
                            vehicle.status === 'maintenance' ? 'bg-amber-100 text-amber-600' :
                            'bg-red-100 text-pmpe-red'
                          }`}>
                            {vehicle.status === 'available' ? 'Disponível' : 
                             vehicle.status === 'maintenance' ? 'Baixada' : 
                             'Em Uso'}
                          </span>
                          <p className="text-xs font-mono text-slate-400">{vehicle.lastMileage} KM</p>
                        </div>
                      </div>
                      
                      {(vehicle.status === 'available' || 
                        (isAdmin && vehicle.status === 'maintenance') ||
                        (vehicle.status === 'in_use' && (isAdmin || vehicle.currentDriverEmail === user?.email))
                      ) && (
                        <div className="bg-slate-50 px-5 py-3 flex gap-2 border-t border-slate-100">
                          {vehicle.status === 'available' && (
                            <button 
                              onClick={() => handleStartRecord(vehicle, 'check-in')}
                              className="flex-1 bg-pmpe-blue text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-pmpe-dark transition-colors flex items-center justify-center gap-2"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                              Check-in (Retirada)
                            </button>
                          )}
                          {vehicle.status === 'in_use' && (isAdmin || vehicle.currentDriverEmail === user?.email) && (
                            <button 
                              onClick={() => handleStartRecord(vehicle, 'check-out')}
                              className="flex-1 bg-pmpe-red text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Check-out (Devolução)
                            </button>
                          )}
                          {isAdmin && (
                            <button 
                              onClick={() => handleToggleMaintenance(vehicle)}
                              className={`flex-1 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${
                                vehicle.status === 'maintenance' 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'bg-amber-500 text-white hover:bg-amber-600'
                              }`}
                            >
                              <AlertCircle className="w-4 h-4" />
                              {vehicle.status === 'maintenance' ? 'Ativar' : 'Baixar'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </motion.div>
            ) : view === 'history' ? (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* History Filters */}
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setHistoryFilter('all')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${historyFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setHistoryFilter('check-in')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${historyFilter === 'check-in' ? 'bg-pmpe-blue text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                  >
                    Check-in
                  </button>
                  <button 
                    onClick={() => setHistoryFilter('check-out')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${historyFilter === 'check-out' ? 'bg-pmpe-red text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                  >
                    Check-out
                  </button>
                  <button 
                    onClick={() => setHistoryFilter('maintenance')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${historyFilter === 'maintenance' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                  >
                    Manutenção
                  </button>
                </div>

                {(() => {
                  const filteredHistory = history.filter(record => {
                    if (historyFilter === 'all') return true;
                    if (historyFilter === 'maintenance') return record.type.includes('maintenance');
                    return record.type === historyFilter;
                  });

                  if (filteredHistory.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhum registro encontrado</p>
                      </div>
                    );
                  }

                  return filteredHistory.map((record) => {
                    const vehicle = vehicles.find(v => v.id === record.vehicleId);
                    const canConclude = record.type === 'check-in' && 
                                      vehicle?.status === 'in_use' && 
                                      (isAdmin || record.userEmail === user?.email);
                    const isExpanded = expandedHistoryId === record.id;

                    return (
                      <div 
                        key={record.id} 
                        className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-pmpe-blue/20' : ''}`}
                      >
                        <div 
                          onClick={() => setExpandedHistoryId(isExpanded ? null : record.id)}
                          className="p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${
                            record.type === 'check-in' ? 'bg-blue-50 text-pmpe-blue' : 
                            record.type.includes('maintenance') ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-pmpe-red'
                          }`}>
                            {record.type === 'check-in' ? <ArrowLeftRight className="w-5 h-5" /> : 
                             record.type.includes('maintenance') ? <AlertCircle className="w-5 h-5" /> :
                             <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">
                                  {record.identification.plate} ({record.identification.prefix || 'RESERVA'})
                                </h4>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-black text-pmpe-blue uppercase">
                                    {record.identification.operationalPrefix || 'SEM PREFIXO OP.'}
                                  </p>
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                    record.type === 'check-in' ? 'bg-blue-100 text-pmpe-blue' : 
                                    record.type.includes('maintenance') ? 'bg-amber-100 text-amber-600' :
                                    'bg-red-100 text-pmpe-red'
                                  }`}>
                                    {record.type === 'check-in' ? 'IN' : 
                                     record.type === 'maintenance-in' ? 'BAIXA' :
                                     record.type === 'maintenance-out' ? 'ALTA' :
                                     'OUT'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {record.timestamp?.toDate ? format(record.timestamp.toDate(), "dd/MM/yy HH:mm", { locale: ptBR }) : '...'}
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1 font-medium text-pmpe-blue truncate">
                                <Shield className="w-3 h-3" />
                                Operador: {record.userName || record.userEmail}
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                <span className="flex items-center gap-1">
                                  <UserIcon className="w-3 h-3" />
                                  {record.drivers.driverName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Gauge className="w-3 h-3" />
                                  {record.mileage.currentMileage} KM
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-100 bg-slate-50/50"
                            >
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Modelo</p>
                                    <p className="text-xs font-bold text-slate-700">{record.identification.model}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data/Hora Registro</p>
                                    <p className="text-xs font-bold text-slate-700">{record.identification.date} às {record.identification.time}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registrado por</p>
                                    <p className="text-xs font-bold text-slate-700">{record.userName || 'N/A'} ({record.userEmail})</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Serviço</p>
                                    <p className="text-xs font-bold text-slate-700">{record.drivers.serviceType || 'N/A'}</p>
                                  </div>
                                </div>

                                {record.mileage.notes && (
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Observações</p>
                                    <p className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200">
                                      "{record.mileage.notes}"
                                    </p>
                                  </div>
                                )}

                                  <div className="flex gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleResendWhatsApp(record);
                                      }}
                                      className="flex-1 py-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-green-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Share2 className="w-4 h-4" />
                                      Reenviar WhatsApp
                                    </button>

                                    {canConclude && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartRecord(vehicle, 'check-out');
                                        }}
                                        className="flex-[1.5] py-3 bg-pmpe-red text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-pmpe-red/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Concluir (Check-out)
                                      </button>
                                    )}
                                  </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  });
                })()}
              </motion.div>
            ) : (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Admin Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-bold text-slate-900">Gerenciamento</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => bootstrapVehicles(true)}
                      disabled={isSyncing}
                      className="flex-1 sm:flex-none bg-white border-2 border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:border-pmpe-blue transition-all flex items-center justify-center gap-2"
                    >
                      {isSyncing ? (
                        <div className="w-4 h-4 border-2 border-pmpe-blue/30 border-t-pmpe-blue rounded-full animate-spin" />
                      ) : (
                        <ArrowLeftRight className="w-4 h-4" />
                      )}
                      Sincronizar Frota
                    </button>
                    <button 
                      onClick={() => {
                        setEditingVehicle(null);
                        setVehicleForm({ prefix: '', plate: '', model: '', status: 'available', lastMileage: 0 });
                        setIsVehicleModalOpen(true);
                      }}
                      className="flex-1 sm:flex-none bg-pmpe-blue text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pmpe-blue/20 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Viatura
                    </button>
                  </div>
                </div>

                {/* Vehicles Management */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Frota de Viaturas</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {vehicles.map(v => (
                      <div key={v.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{v.plate} <span className="text-[10px] text-slate-400 ml-2">{v.prefix}</span></p>
                          <p className="text-xs text-slate-500">{v.model}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingVehicle(v);
                              setVehicleForm({
                                prefix: v.prefix || '',
                                plate: v.plate,
                                model: v.model,
                                status: v.status,
                                lastMileage: v.lastMileage
                              });
                              setIsVehicleModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-pmpe-blue hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteVehicle(v.id, v.plate)}
                            className="p-2 text-slate-400 hover:text-pmpe-red hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admins Management */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Administradores</h3>
                    <button 
                      onClick={() => setIsUserModalOpen(true)}
                      className="text-pmpe-blue text-xs font-bold hover:underline"
                    >
                      Adicionar Admin
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {adminUsers.filter(u => u.role === 'admin').map(u => (
                      <div key={u.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{u.displayName || 'Usuário'}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                        {u.email !== 'demetriomarques@gmail.com' && (
                          <button 
                            onClick={() => handleRemoveAdmin(u.id, u.email)}
                            className="p-2 text-slate-400 hover:text-pmpe-red hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          ) : (
            <motion.div 
              key="record"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
            >
              {/* Record Header */}
              <div className={`p-6 ${operationType === 'check-in' ? 'bg-pmpe-blue' : 'bg-pmpe-red'} text-white border-b-4 border-pmpe-gold`}>
                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={() => setSelectedVehicle(null)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold">Registro</h2>
                    <p className="text-white/80 text-xs uppercase tracking-widest font-bold">
                      {operationType === 'check-in' ? 'Check-in (Retirada)' : 'Check-out (Devolução)'} • {selectedVehicle.plate}
                    </p>
                  </div>
                </div>

                {/* Tab Progress */}
                <div className="flex gap-2">
                  {tabs.map((tab) => (
                    <div 
                      key={tab.id}
                      className={`h-1.5 flex-1 rounded-full transition-all ${currentTab >= tab.id ? 'bg-pmpe-gold' : 'bg-white/30'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-100">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`flex-1 flex flex-col items-center py-4 gap-1 transition-all ${
                      currentTab === tab.id 
                        ? 'text-pmpe-blue border-b-2 border-pmpe-blue' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon className={`w-5 h-5 ${currentTab === tab.id ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Form Content */}
              <div className="p-6 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {currentTab === 0 && (
                    <motion.div 
                      key="tab0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Placa</label>
                          <input 
                            type="text"
                            value={formData.identification.plate}
                            readOnly
                            className="w-full p-4 bg-slate-100 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Patrimônio</label>
                          <input 
                            type="text"
                            value={formData.identification.prefix}
                            readOnly
                            className="w-full p-4 bg-slate-100 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prefixo Operacional (GT/GG/GE...)</label>
                        <input 
                          list="operational-prefixes"
                          type="text"
                          value={formData.identification.operationalPrefix}
                          onChange={(e) => setFormData({...formData, identification: {...formData.identification, operationalPrefix: e.target.value}})}
                          placeholder="Ex: GT 14111"
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pmpe-blue outline-none transition-all font-bold"
                        />
                        <datalist id="operational-prefixes">
                          {OPERATIONAL_PREFIXES.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Modelo</label>
                        <input 
                          type="text"
                          value={formData.identification.model}
                          readOnly
                          className="w-full p-4 bg-slate-100 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data</label>
                          <input 
                            type="date"
                            value={formData.identification.date}
                            onChange={(e) => setFormData({...formData, identification: {...formData.identification, date: e.target.value}})}
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pmpe-blue outline-none transition-all font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hora</label>
                          <input 
                            type="time"
                            value={formData.identification.time}
                            onChange={(e) => setFormData({...formData, identification: {...formData.identification, time: e.target.value}})}
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pmpe-blue outline-none transition-all font-bold"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentTab === 1 && (
                    <motion.div 
                      key="tab1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Condutor (Nome / Mat.)</label>
                        <input 
                          list="drivers-list"
                          type="text"
                          value={formData.drivers.driverName}
                          onChange={(e) => setFormData({...formData, drivers: {...formData.drivers, driverName: e.target.value}})}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pmpe-blue outline-none transition-all font-bold"
                          placeholder="Nome do condutor"
                        />
                        <datalist id="drivers-list">
                          {DRIVERS_LIST.map(d => <option key={d} value={d} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Serviço</label>
                        <select 
                          value={formData.drivers.serviceType}
                          onChange={(e) => setFormData({...formData, drivers: {...formData.drivers, serviceType: e.target.value}})}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pmpe-blue outline-none transition-all font-bold appearance-none"
                        >
                          <option value="">Selecione o serviço...</option>
                          {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {currentTab === 2 && (
                    <motion.div 
                      key="tab2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          {operationType === 'check-in' ? 'Quilometragem Inicial' : 'Quilometragem Final'} (KM)
                        </label>
                        <div className="relative">
                          <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            type="number"
                            value={formData.mileage.currentMileage}
                            onChange={(e) => setFormData({...formData, mileage: {...formData.mileage, currentMileage: parseInt(e.target.value)}})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pmpe-blue outline-none transition-all text-2xl font-mono font-bold"
                          />
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400">
                          Último registro: <span className="font-bold">{selectedVehicle.lastMileage} KM</span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Observações</label>
                        <textarea 
                          value={formData.mileage.notes}
                          onChange={(e) => setFormData({...formData, mileage: {...formData.mileage, notes: e.target.value}})}
                          rows={4}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pmpe-blue outline-none transition-all text-sm"
                          placeholder="Alguma observação sobre o estado da viatura?"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Form Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                {currentTab > 0 ? (
                  <button 
                    onClick={() => setCurrentTab(currentTab - 1)}
                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Voltar
                  </button>
                ) : (
                  <button 
                    onClick={() => setSelectedVehicle(null)}
                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    Cancelar
                  </button>
                )}

                {currentTab < tabs.length - 1 ? (
                  <button 
                    onClick={() => setCurrentTab(currentTab + 1)}
                    className="flex-[2] bg-pmpe-blue text-white py-4 rounded-2xl font-bold shadow-lg shadow-pmpe-blue/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Próximo
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveRecord}
                    disabled={submitting}
                    className={`flex-[2] py-4 rounded-2xl text-white font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                      operationType === 'check-in' ? 'bg-pmpe-blue shadow-pmpe-blue/20' : 'bg-pmpe-red shadow-pmpe-red/20'
                    }`}
                  >
                    {submitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Enviar via WhatsApp
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl mx-auto p-4 text-center">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
          Polícia Militar de Pernambuco • 14º BPM
        </p>
      </footer>

      {/* Vehicle Modal */}
      <AnimatePresence>
        {isVehicleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-pmpe-blue text-white">
                <h3 className="text-xl font-bold">{editingVehicle ? 'Editar Viatura' : 'Nova Viatura'}</h3>
                <p className="text-white/70 text-xs uppercase tracking-widest font-bold">Cadastro de Frota</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prefixo</label>
                  <input 
                    type="text"
                    value={vehicleForm.prefix}
                    onChange={(e) => setVehicleForm({...vehicleForm, prefix: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-pmpe-blue outline-none font-bold"
                    placeholder="Ex: GT 14111"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Placa</label>
                  <input 
                    type="text"
                    value={vehicleForm.plate}
                    onChange={(e) => setVehicleForm({...vehicleForm, plate: e.target.value.toUpperCase()})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-pmpe-blue outline-none font-bold"
                    placeholder="Ex: PDS1795"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modelo</label>
                  <input 
                    type="text"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-pmpe-blue outline-none font-bold"
                    placeholder="Ex: FORD RANGER"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">KM Atual</label>
                    <input 
                      type="number"
                      value={vehicleForm.lastMileage}
                      onChange={(e) => setVehicleForm({...vehicleForm, lastMileage: parseInt(e.target.value) || 0})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-pmpe-blue outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
                    <select 
                      value={vehicleForm.status}
                      onChange={(e) => setVehicleForm({...vehicleForm, status: e.target.value as any})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-pmpe-blue outline-none font-bold appearance-none"
                    >
                      <option value="available">Disponível</option>
                      <option value="in_use">Em Uso</option>
                      <option value="maintenance">Baixada</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveVehicle}
                  className="flex-[2] bg-pmpe-blue text-white py-3 rounded-xl font-bold shadow-lg shadow-pmpe-blue/20 active:scale-95 transition-all"
                >
                  Salvar Viatura
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-pmpe-blue text-white">
                <h3 className="text-xl font-bold">Adicionar Administrador</h3>
                <p className="text-white/70 text-xs uppercase tracking-widest font-bold">Controle de Acesso</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500">
                  O usuário deve ter feito login no sistema pelo menos uma vez para ser promovido a administrador.
                </p>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail do Usuário</label>
                  <input 
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-pmpe-blue outline-none font-bold"
                    placeholder="exemplo@gmail.com"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddAdmin}
                  className="flex-[2] bg-pmpe-blue text-white py-3 rounded-xl font-bold shadow-lg shadow-pmpe-blue/20 active:scale-95 transition-all"
                >
                  Promover a Admin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-pmpe-red rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
                <p className="text-slate-500 text-sm">
                  Tem certeza que deseja excluir {deleteConfirm.type === 'vehicle' ? 'a viatura' : 'o administrador'} <span className="font-bold text-slate-900">{deleteConfirm.label}</span>?
                </p>
                {deleteConfirm.type === 'vehicle' && (
                  <p className="mt-2 text-[10px] text-pmpe-red font-bold uppercase">Esta ação não pode ser desfeita.</p>
                )}
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-pmpe-red text-white py-3 rounded-xl font-bold shadow-lg shadow-pmpe-red/20 active:scale-95 transition-all"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
