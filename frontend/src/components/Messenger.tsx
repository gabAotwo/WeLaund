'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchJson } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  FiMessageSquare, 
  FiX, 
  FiArrowLeft, 
  FiSend, 
  FiPaperclip, 
  FiUserPlus, 
  FiUserCheck, 
  FiUserMinus, 
  FiPlus, 
  FiSearch, 
  FiSlash, 
  FiTrash2, 
  FiImage 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_photo: string | null;
  connection_status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | null;
}

interface ChatRoom {
  room_id: string;
  created_at: string;
  other_id: string;
  other_name: string;
  other_role: string;
  other_photo: string | null;
  unread_count: number;
  last_message_text: string | null;
  last_message_image: string | null;
  last_message_time: string;
}

interface Message {
  id: string;
  sender_id: string;
  message_text: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Messenger() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'rooms' | 'contacts' | 'chat'>('rooms');
  
  // Connection tabs for customer: 'chats', 'search', 'requests', 'blocked'
  const [customerTab, setCustomerTab] = useState<'chats' | 'search' | 'requests' | 'blocked'>('chats');
  
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  
  // Pending connections
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<any[]>([]);

  // Input states
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll for unread count & updates
  useEffect(() => {
    if (!user) return;
    fetchUnreadTotal();
    const interval = setInterval(() => {
      fetchUnreadTotal();
      if (isOpen) {
        if (view === 'rooms') {
          fetchRooms();
        } else if (view === 'chat' && activeRoom) {
          fetchMessages(activeRoom.room_id);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, view, activeRoom, user]);

  // Fetch initial rooms when panel is opened
  useEffect(() => {
    if (!user) return;
    if (isOpen) {
      fetchRooms();
      fetchContacts();
      if (user.role === 'customer') {
        fetchConnections();
        fetchBlockedUsers();
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!user) return;
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUnreadTotal = async () => {
    try {
      const res = await fetchJson('/api/chat/unread_count.php');
      if (res.success) {
        setUnreadTotal(res.unread_count);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetchJson('/api/chat/rooms.php');
      if (res.success) {
        setRooms(res.rooms || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetchJson('/api/chat/participants.php');
      if (res.success) {
        setContacts(res.contacts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await fetchJson('/api/chat/connections.php');
      if (res.success) {
        setAcceptedFriends(res.accepted || []);
        setPendingSent(res.pending_sent || []);
        setPendingReceived(res.pending_received || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetchJson('/api/chat/blocks.php');
      if (res.success) {
        setBlockedUsers(res.blocked || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetchJson(`/api/chat/messages.php?room_id=${roomId}`);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Start chat with a contact
  const startChat = async (contactId: string) => {
    try {
      const res = await fetchJson('/api/chat/rooms.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: contactId })
      });
      if (res.success) {
        // Find existing room details or create temporary details
        const found = rooms.find(r => r.room_id === res.room_id);
        if (found) {
          setActiveRoom(found);
        } else {
          const contact = contacts.find(c => c.id === contactId);
          setActiveRoom({
            room_id: res.room_id,
            created_at: new Date().toISOString(),
            other_id: contactId,
            other_name: contact ? contact.name : 'User',
            other_role: contact ? contact.role : 'Member',
            other_photo: contact ? contact.profile_photo : null,
            unread_count: 0,
            last_message_text: null,
            last_message_image: null,
            last_message_time: new Date().toISOString()
          });
        }
        await fetchMessages(res.room_id);
        setView('chat');
      } else {
        toast.error(res.message || 'Could not start chat');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error starting chat');
    }
  };

  // Connection operations
  const handleConnectionAction = async (targetId: string, action: 'send' | 'accept' | 'reject' | 'delete') => {
    try {
      const res = await fetchJson('/api/chat/connections.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId, action })
      });
      if (res.success) {
        toast.success(res.message || 'Action completed');
        fetchConnections();
        fetchContacts();
      } else {
        toast.error(res.message || 'Action failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred');
    }
  };

  // Block/unblock operations
  const handleBlockAction = async (targetId: string, action: 'block' | 'unblock') => {
    try {
      const res = await fetchJson('/api/chat/blocks.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId, action })
      });
      if (res.success) {
        toast.success(res.message || 'User block status updated');
        fetchBlockedUsers();
        fetchContacts();
        fetchRooms();
        if (action === 'block' && view === 'chat' && activeRoom?.other_id === targetId) {
          setView('rooms');
          setActiveRoom(null);
        }
      } else {
        toast.error(res.message || 'Block failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, imageUrl: string | null = null) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !imageUrl) return false;
    if (!activeRoom) return false;

    setIsSending(true);
    const textToSend = inputText;
    setInputText('');

    try {
      const res = await fetchJson('/api/chat/messages.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: activeRoom.room_id,
          message_text: textToSend || null,
          image_url: imageUrl || null
        })
      });

      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        fetchRooms();
        return true;
      } else {
        toast.error(res.message || 'Failed to send message');
        if (!imageUrl) setInputText(textToSend);
        return false;
      }
    } catch (e: any) {
      toast.error(e.message || 'Connection error');
      if (!imageUrl) setInputText(textToSend);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!activeRoom) {
      toast.error('Open a chat before sending an image.');
      return;
    }
    
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds the 5MB size limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/chat/upload_chat_image.php', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.image_url) {
        const sent = await handleSendMessage(undefined, data.image_url);
        if (sent) toast.success('Image sent successfully');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed due to connection error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper to format time beautifully
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stop rendering if user session is not loaded
  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      {/* 1. Launcher button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-4 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300 outline-none focus:outline-none"
      >
        {isOpen ? <FiX className="w-6 h-6 animate-spin-once" /> : <FiMessageSquare className="w-6 h-6" />}
        
        {/* Pulsing red notification badge */}
        {unreadTotal > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 text-[10px] font-bold items-center justify-center text-white">
              {unreadTotal}
            </span>
          </span>
        )}
      </button>

      {/* 2. Slide-up premium glassmorphic chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute bottom-16 sm:bottom-20 right-0 w-[calc(100vw-2rem)] sm:w-[360px] h-[calc(100vh-11rem)] sm:h-[550px] max-h-[800px] flex flex-col bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-sky-500/30 to-indigo-500/30 border-b border-white/10 flex items-center justify-between">
              {view === 'chat' && activeRoom ? (
                <div className="flex items-center space-x-3 w-full">
                  <button 
                    onClick={() => {
                      setView('rooms');
                      setActiveRoom(null);
                      fetchRooms();
                    }}
                    className="p-1 text-gray-200 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {activeRoom.other_photo ? (
                      <img 
                        src={activeRoom.other_photo} 
                        alt={activeRoom.other_name} 
                        className="w-9 h-9 rounded-full object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm border border-white/20">
                        {activeRoom.other_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate text-sm leading-tight">{activeRoom.other_name}</h4>
                      <span className="text-[10px] text-gray-300 block capitalize">{activeRoom.other_role}</span>
                    </div>
                  </div>
                  
                  {/* Block Action for Customer roles */}
                  {user.role === 'customer' && activeRoom.other_role === 'customer' && (
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to block ${activeRoom.other_name}?`)) {
                          handleBlockAction(activeRoom.other_id, 'block');
                        }
                      }}
                      className="p-1 text-red-300 hover:text-red-500 rounded-full hover:bg-white/10 transition-colors"
                      title="Block User"
                    >
                      <FiSlash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-bold text-white text-lg tracking-wide">WashWise Message</h3>
                    <p className="text-[10px] text-gray-300">Connected as {user.first_name} ({user.role})</p>
                  </div>
                  {view === 'rooms' && (
                    <button 
                      onClick={() => setView('contacts')}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200"
                      title="New Chat"
                    >
                      <FiPlus className="w-5 h-5" />
                    </button>
                  )}
                  {view === 'contacts' && (
                    <button 
                      onClick={() => setView('rooms')}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200"
                      title="Back to Chats"
                    >
                      <FiArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* View switcher */}
            <div className="flex-1 overflow-hidden flex flex-col">
              
              {/* VIEW 1: Active Rooms list */}
              {view === 'rooms' && (
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {rooms.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                      <FiMessageSquare className="w-12 h-12 mb-3 text-gray-500/50" />
                      <p className="text-sm font-medium">No conversation threads yet.</p>
                      <p className="text-xs text-gray-500 mt-1">Tap the plus icon above to start chatting.</p>
                    </div>
                  ) : (
                    rooms.map((room) => (
                      <div 
                        key={room.room_id}
                        onClick={() => {
                          setActiveRoom(room);
                          fetchMessages(room.room_id);
                          setView('chat');
                        }}
                        className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 dark:bg-black/10 hover:bg-white/15 dark:hover:bg-black/20 border border-white/5 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                      >
                        {room.other_photo ? (
                          <img 
                            src={room.other_photo} 
                            alt={room.other_name} 
                            className="w-11 h-11 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base">
                            {room.other_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white text-sm truncate">{room.other_name}</h4>
                            <span className="text-[9px] text-gray-400">{formatTime(room.last_message_time)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-gray-300 truncate pr-2">
                              {room.last_message_image ? (
                                <span className="flex items-center text-sky-400"><FiImage className="mr-1 w-3 h-3" /> Image sent</span>
                              ) : (
                                room.last_message_text || 'Start chatting...'
                              )}
                            </p>
                            {room.unread_count > 0 && (
                              <span className="bg-red-500 text-white font-bold text-[9px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                                {room.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* VIEW 2: Contacts drawer */}
              {view === 'contacts' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Customer specific navigation tabs */}
                  {user.role === 'customer' && (
                    <div className="flex bg-black/20 border-b border-white/10 text-xs text-gray-300">
                      <button 
                        onClick={() => setCustomerTab('chats')}
                        className={`flex-1 py-2 text-center font-semibold border-b ${customerTab === 'chats' ? 'border-sky-400 text-white' : 'border-transparent'}`}
                      >
                        Friends
                      </button>
                      <button 
                        onClick={() => setCustomerTab('search')}
                        className={`flex-1 py-2 text-center font-semibold border-b ${customerTab === 'search' ? 'border-sky-400 text-white' : 'border-transparent'}`}
                      >
                        Add
                      </button>
                      <button 
                        onClick={() => setCustomerTab('requests')}
                        className={`flex-1 py-2 text-center font-semibold border-b ${customerTab === 'requests' ? 'border-sky-400 text-white' : 'border-transparent'}`}
                      >
                        Requests {(pendingReceived.length > 0) && `(${pendingReceived.length})`}
                      </button>
                      <button 
                        onClick={() => setCustomerTab('blocked')}
                        className={`flex-1 py-2 text-center font-semibold border-b ${customerTab === 'blocked' ? 'border-sky-400 text-white' : 'border-transparent'}`}
                      >
                        Blocked
                      </button>
                    </div>
                  )}

                  {/* Search box for Find/Filter */}
                  {user.role !== 'customer' || customerTab === 'chats' || customerTab === 'search' ? (
                    <div className="p-2 border-b border-white/5 flex items-center bg-white/5">
                      <FiSearch className="text-gray-400 w-4 h-4 ml-1.5" />
                      <input 
                        type="text" 
                        placeholder={user.role === 'customer' && customerTab === 'search' ? "Search all customers..." : "Search contacts..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-0 text-white placeholder-gray-400 text-xs px-2 py-1 outline-none focus:ring-0"
                      />
                    </div>
                  ) : null}

                  {/* Contact rendering */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    
                    {/* CUSTOMER TABS */}
                    {user.role === 'customer' ? (
                      <>
                        {/* Tab 1: Staff & Friends */}
                        {customerTab === 'chats' && (
                          filteredContacts.filter(c => c.role.startsWith('staff') || c.connection_status === 'accepted').length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-8">No friends or staff found.</p>
                          ) : (
                            filteredContacts
                              .filter(c => c.role.startsWith('staff') || c.connection_status === 'accepted')
                              .map(contact => (
                                <div key={contact.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10">
                                  <div className="flex items-center space-x-3 min-w-0">
                                    {contact.profile_photo ? (
                                      <img src={contact.profile_photo} alt={contact.name} className="w-9 h-9 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                                        {contact.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <h5 className="text-sm font-semibold text-white truncate">{contact.name}</h5>
                                      <span className="text-[10px] text-gray-400 block capitalize">{contact.role}</span>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => startChat(contact.id)}
                                    className="px-3 py-1 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-medium text-xs rounded-lg hover:scale-105 transition-all"
                                  >
                                    Chat
                                  </button>
                                </div>
                              ))
                          )
                        )}

                        {/* Tab 2: Find Customers to Add */}
                        {customerTab === 'search' && (
                          filteredContacts.filter(c => c.role === 'customer').length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-8">No other customers found.</p>
                          ) : (
                            filteredContacts
                              .filter(c => c.role === 'customer')
                              .map(contact => (
                                <div key={contact.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10">
                                  <div className="flex items-center space-x-3 min-w-0">
                                    {contact.profile_photo ? (
                                      <img src={contact.profile_photo} alt={contact.name} className="w-9 h-9 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                                        {contact.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <h5 className="text-sm font-semibold text-white truncate">{contact.name}</h5>
                                      <span className="text-[10px] text-gray-400 block">{contact.email}</span>
                                    </div>
                                  </div>
                                  <div>
                                    {contact.connection_status === 'none' && (
                                      <button 
                                        onClick={() => handleConnectionAction(contact.id, 'send')}
                                        className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
                                        title="Add Friend"
                                      >
                                        <FiUserPlus className="w-4 h-4" />
                                      </button>
                                    )}
                                    {contact.connection_status === 'pending_sent' && (
                                      <button 
                                        onClick={() => handleConnectionAction(contact.id, 'delete')}
                                        className="px-2 py-1 bg-gray-600 hover:bg-red-500 text-white text-[10px] font-semibold rounded-lg transition-colors"
                                        title="Cancel Request"
                                      >
                                        Sent
                                      </button>
                                    )}
                                    {contact.connection_status === 'pending_received' && (
                                      <div className="flex space-x-1">
                                        <button 
                                          onClick={() => handleConnectionAction(contact.id, 'accept')}
                                          className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                                          title="Accept"
                                        >
                                          <FiUserCheck className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={() => handleConnectionAction(contact.id, 'reject')}
                                          className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                          title="Reject"
                                        >
                                          <FiUserMinus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                    {contact.connection_status === 'accepted' && (
                                      <button 
                                        onClick={() => startChat(contact.id)}
                                        className="px-3 py-1 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-medium text-xs rounded-lg hover:scale-105 transition-all"
                                      >
                                        Chat
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                          )
                        )}

                        {/* Tab 3: Requests view */}
                        {customerTab === 'requests' && (
                          (pendingSent.length === 0 && pendingReceived.length === 0) ? (
                            <p className="text-center text-xs text-gray-400 py-8">No pending requests.</p>
                          ) : (
                            <div className="space-y-4">
                              {pendingReceived.length > 0 && (
                                <div>
                                  <h6 className="text-xs font-semibold text-sky-400 mb-1.5 px-1">Received Requests</h6>
                                  <div className="space-y-2">
                                    {pendingReceived.map(req => (
                                      <div key={req.connection_id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                        <span className="text-sm text-white truncate font-medium max-w-[180px]">{req.first_name} {req.last_name}</span>
                                        <div className="flex space-x-1">
                                          <button 
                                            onClick={() => handleConnectionAction(req.user_id, 'accept')}
                                            className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg font-semibold"
                                          >
                                            Accept
                                          </button>
                                          <button 
                                            onClick={() => handleConnectionAction(req.user_id, 'reject')}
                                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-semibold"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {pendingSent.length > 0 && (
                                <div>
                                  <h6 className="text-xs font-semibold text-indigo-400 mb-1.5 px-1">Sent Requests</h6>
                                  <div className="space-y-2">
                                    {pendingSent.map(req => (
                                      <div key={req.connection_id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                        <span className="text-sm text-white truncate font-medium max-w-[200px]">{req.first_name} {req.last_name}</span>
                                        <button 
                                          onClick={() => handleConnectionAction(req.user_id, 'delete')}
                                          className="p-1.5 bg-white/10 hover:bg-red-500 hover:text-white text-gray-300 rounded-lg"
                                          title="Cancel Request"
                                        >
                                          <FiTrash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        )}

                        {/* Tab 4: Blocked Users list */}
                        {customerTab === 'blocked' && (
                          blockedUsers.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-8">No blocked users.</p>
                          ) : (
                            blockedUsers.map(b => (
                              <div key={b.block_id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                                <div className="min-w-0">
                                  <h5 className="text-sm font-semibold text-white truncate">{b.first_name} {b.last_name}</h5>
                                  <span className="text-[10px] text-gray-400 block">{b.email}</span>
                                </div>
                                <button 
                                  onClick={() => handleBlockAction(b.user_id, 'unblock')}
                                  className="px-2.5 py-1 bg-white/10 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg transition-colors"
                                >
                                  Unblock
                                </button>
                              </div>
                            ))
                          )
                        )}
                      </>
                    ) : (
                      /* OTHER ROLES (Standard static contacts matching criteria) */
                      filteredContacts.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-8">No contacts found.</p>
                      ) : (
                        filteredContacts.map(contact => (
                          <div 
                            key={contact.id} 
                            onClick={() => startChat(contact.id)}
                            className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 hover:-translate-y-[1px]"
                          >
                            {contact.profile_photo ? (
                              <img src={contact.profile_photo} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base">
                                {contact.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-white truncate">{contact.name}</h5>
                              <span className="text-[10px] text-gray-300 block capitalize">{contact.role}</span>
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 3: Chat Room history */}
              {view === 'chat' && activeRoom && (
                <div className="flex-1 flex flex-col overflow-hidden bg-black/10">
                  {/* Chat bubbles list */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-4 text-gray-400">
                        <p className="text-xs">No messages yet. Send a message to start the conversation.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user.user_id;
                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div 
                              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs shadow-md ${
                                isMe 
                                  ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-tr-none' 
                                  : 'bg-white/15 dark:bg-black/30 text-white rounded-tl-none border border-white/5'
                              }`}
                            >
                              {msg.message_text && <p className="leading-relaxed break-words">{msg.message_text}</p>}
                              {msg.image_url && (
                                <div className="mt-1 rounded-lg overflow-hidden border border-white/10 max-w-full">
                                  <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                    <img 
                                      src={msg.image_url} 
                                      alt="Uploaded chat file" 
                                      className="object-cover max-h-[160px] w-full hover:opacity-90 transition-opacity"
                                    />
                                  </a>
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] text-gray-400 mt-1 px-1">{formatTime(msg.created_at)}</span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Form footer */}
                  <form onSubmit={handleSendMessage} className="p-2.5 bg-black/30 border-t border-white/10 flex items-center space-x-2">
                    <button 
                      type="button"
                      disabled={isUploading || isSending}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin block"></span>
                      ) : (
                        <FiPaperclip className="w-4 h-4" />
                      )}
                    </button>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <input 
                      type="text"
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isSending}
                      className="flex-1 bg-white/10 focus:bg-white/15 border-0 focus:ring-1 focus:ring-sky-500 text-white placeholder-gray-400 text-xs rounded-xl px-3 py-2 outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={isSending || (!inputText.trim())}
                      className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                    >
                      <FiSend className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
