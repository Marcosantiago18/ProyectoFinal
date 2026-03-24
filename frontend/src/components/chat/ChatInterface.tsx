import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contex/AuthContext';
import { mensajesAPI } from '../../utils/api';
import { toast } from 'sonner';
import type { Usuario } from '../../types';

interface Mensaje {
  id: number;
  remitente_id: number;
  destinatario_id: number;
  contenido: string;
  fecha_envio: string;
}

const ChatInterface: React.FC = () => {
  const { usuario } = useAuth();
  const [contactos, setContactos] = useState<Usuario[]>([]);
  const [selectedContacto, setSelectedContacto] = useState<Usuario | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (usuario) {
      loadContactos();
    }
  }, [usuario]);

  useEffect(() => {
    if (selectedContacto) {
      loadMensajes();
      // Setup polling logic
      const interval = setInterval(() => {
        loadMensajes(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContacto]);

  const loadContactos = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const data = await mensajesAPI.getContactos(usuario!.id, token) as Usuario[];
      setContactos(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const loadMensajes = async (isPolling = false) => {
    if (!selectedContacto || !usuario) return;
    if (!isPolling) setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const data = await mensajesAPI.getMensajes(usuario.id, selectedContacto.id, token) as Mensaje[];
      setMensajes(data);
      if (!isPolling) {
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContacto || !usuario) return;

    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        remitente_id: usuario.id,
        destinatario_id: selectedContacto.id,
        contenido: newMessage.trim(),
      };
      const res = await mensajesAPI.sendMensaje(payload, token) as any;
      setMensajes(prev => [...prev, res.mensaje]);
      setNewMessage('');
      scrollToBottom();
      
      // Update contacts list if this is the first message to them
      if (!contactos.find(c => c.id === selectedContacto.id)) {
        loadContactos();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('No se pudo enviar el mensaje');
    }
  };

  return (
    <div className="flex bg-[#0a1628] rounded-2xl overflow-hidden border border-white/10 h-[600px]">
      {/* Contact List Sidebar */}
      <div className="w-1/3 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">
            {usuario?.rol === 'cliente' ? 'Capitanes Disponibles' : 'Conversaciones'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contactos.length === 0 ? (
            <div className="p-4 text-white/50 text-sm text-center">No tienes conversaciones disponibles.</div>
          ) : (
            contactos.map(contacto => (
              <button
                key={contacto.id}
                onClick={() => setSelectedContacto(contacto)}
                className={`w-full text-left p-4 hover:bg-white/10 transition flex items-center gap-3 border-b border-white/5 ${selectedContacto?.id === contacto.id ? 'bg-white/10' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] font-bold">
                  {contacto.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{contacto.nombre}</div>
                  <div className="text-xs text-white/50">{contacto.rol === 'capitan' ? 'Capitán' : 'Cliente'}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#050a14]">
        {selectedContacto ? (
          <>
            <div className="p-4 border-b border-white/10 flex flex-col bg-white/5">
              <span className="text-white font-bold text-lg">{selectedContacto.nombre}</span>
              <span className="text-white/50 text-xs">Alineado para responder a la brevedad.</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center text-white/50 mt-10">Cargando historial...</div>
              ) : mensajes.length === 0 ? (
                <div className="text-center text-white/50 mt-10">
                  Aún no hay mensajes. ¡Di hola!
                </div>
              ) : (
                mensajes.map(msg => {
                  const isMine = msg.remitente_id === usuario?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isMine ? 'bg-[#d4af37] text-[#0a1628]' : 'bg-white/10 text-white'
                      }`}>
                        <p className="text-sm">{msg.contenido}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-black/60' : 'text-white/40'}`}>
                          {new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
              <input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-black/30 border border-white/10 rounded-full px-4 text-sm text-white focus:outline-none focus:border-[#d4af37]/50"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#d4af37] text-black w-10 h-10 rounded-full flex justify-center items-center hover:bg-[#f4d03f] transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-white/40">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Selecciona una conversación para iniciar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
